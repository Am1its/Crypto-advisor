import { Router } from 'express';
import pool from '../db/index.js';
import authMiddleware from '../middleware/auth.js';
import { fetchMeme } from '../data/memes.js';

const router = Router();

const COIN_ID_MAP = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', AVAX: 'avalanche-2',
};

const COIN_NAME_MAP = {
  BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', BNB: 'BNB',
  XRP: 'XRP', ADA: 'Cardano', DOGE: 'Dogecoin', AVAX: 'Avalanche',
};

const COIN_IMAGES = {
  bitcoin:      'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ethereum:     'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  solana:       'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  binancecoin:  'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  ripple:       'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  cardano:      'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  dogecoin:     'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  'avalanche-2':'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
};

let _priceCache = null;
let _priceCacheKey = '';
let _priceCachedAt = 0;
const PRICE_CACHE_TTL = 90_000; // 90 seconds — well under CoinGecko's 1-min window

async function fetchPrices(symbols) {
  const ids = symbols.map((s) => COIN_ID_MAP[s?.toUpperCase()]).filter(Boolean);
  if (!ids.length) return [];

  const cacheKey = ids.join(',');
  if (_priceCache && cacheKey === _priceCacheKey && Date.now() - _priceCachedAt < PRICE_CACHE_TTL) {
    return _priceCache;
  }

  // Primary: /coins/markets — returns images + price + 24h change
  try {
    const headers = process.env.COINGECKO_API_KEY
      ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
      : {};
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(',')}&price_change_percentage=24h`,
      { headers }
    );
    if (!res.ok) throw new Error(`CoinGecko markets ${res.status}`);
    const data = await res.json();
    const result = data.map((coin) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h,
      image: coin.image || COIN_IMAGES[coin.id] || null,
    }));
    _priceCache = result;
    _priceCacheKey = cacheKey;
    _priceCachedAt = Date.now();
    return result;
  } catch (err) {
    console.error('[CoinGecko] /coins/markets failed:', err.message, '— trying /simple/price');
  }

  // Fallback: /simple/price — more lenient rate limits, no images
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true`
    );
    if (!res.ok) throw new Error(`CoinGecko simple/price ${res.status}`);
    const data = await res.json();
    const result = ids.map((id) => {
      const sym = Object.keys(COIN_ID_MAP).find((k) => COIN_ID_MAP[k] === id) || id.toUpperCase();
      return {
        symbol: sym,
        name: COIN_NAME_MAP[sym] || sym,
        price: data[id]?.usd ?? null,
        change24h: data[id]?.usd_24h_change ?? null,
        image: COIN_IMAGES[id] || null,
      };
    }).filter((c) => c.price != null);
    if (result.length) {
      _priceCache = result;
      _priceCacheKey = cacheKey;
      _priceCachedAt = Date.now();
      return result;
    }
  } catch (err) {
    console.error('[CoinGecko] /simple/price also failed:', err.message);
  }

  // Last resort: return nulls but with correct names and hardcoded images
  return symbols.map((s) => {
    const sym = s?.toUpperCase() || s;
    return { symbol: sym, name: COIN_NAME_MAP[sym] || sym, price: null, change24h: null, image: COIN_IMAGES[COIN_ID_MAP[sym]] || null };
  });
}

function generateMockNews(symbols) {
  const coin = symbols[0] || 'Bitcoin';
  const today = new Date().toISOString();
  return [
    { id: 'n1', title: `${coin} Shows Strong Momentum as Institutional Buyers Return`, url: '#', source: 'CoinDesk', publishedAt: today },
    { id: 'n2', title: `Analysts Predict ${coin} Could Break Key Resistance Level This Week`, url: '#', source: 'CryptoSlate', publishedAt: today },
    { id: 'n3', title: 'Global Crypto Market Cap Climbs as Sentiment Turns Bullish', url: '#', source: 'The Block', publishedAt: today },
    { id: 'n4', title: 'DeFi Protocol TVL Hits New All-Time High Amid Renewed Interest', url: '#', source: 'Decrypt', publishedAt: today },
    { id: 'n5', title: `${symbols[1] || 'ETH'} Network Upgrade Scheduled — What You Need to Know`, url: '#', source: 'Blockworks', publishedAt: today },
  ];
}

async function fetchNews(symbols) {
  try {
    const res = await fetch(
      'https://www.reddit.com/r/CryptoCurrency/top.json?limit=20&t=day',
      { headers: { 'User-Agent': 'CryptoAdvisor/1.0' } }
    );
    if (!res.ok) throw new Error(`Reddit ${res.status}`);
    const data = await res.json();

    const newsPosts = data.data.children
      .filter((p) => ['GENERAL-NEWS', 'METRICS', 'TECHNOLOGY'].includes(p.data.link_flair_text))
      .slice(0, 5);

    if (!newsPosts.length) throw new Error('No news posts found');

    return newsPosts.map((p) => ({
      id: p.data.id,
      title: p.data.title,
      url: `https://reddit.com${p.data.permalink}`,
      source: 'r/CryptoCurrency',
      publishedAt: new Date(p.data.created_utc * 1000).toISOString(),
    }));
  } catch (err) {
    console.error('News fetch error:', err.message);
    return generateMockNews(symbols);
  }
}

function getFallbackInsight(investorType, assets) {
  const tips = {
    HODLer: `As a HODLer focused on ${assets.slice(0, 2).join(' and ')}, consider setting calendar reminders to review your position quarterly rather than daily — reducing emotional decisions is your edge. Dollar-cost averaging on dips below your entry price can strengthen your long-term position without market-timing risk.`,
    'Day Trader': `For ${assets[0] || 'your assets'}, watch the 4-hour RSI and volume profile before entering — today's volatility windows are typically 9–11 AM and 2–4 PM UTC. Stick to a maximum 2% portfolio risk per trade and always define your stop-loss before entry, not after.`,
    'NFT Collector': `Floor price trends on ${assets[0] || 'ETH'}-based collections are closely correlated with ETH gas fees — low gas windows are often the best times to mint or list. Track social sentiment on Discord and Twitter before any large purchase; community health is a stronger signal than floor price alone.`,
  };
  return {
    id: `ai-${new Date().toISOString().split('T')[0]}`,
    text: tips[investorType] || tips['HODLer'],
  };
}

async function fetchAIInsight(investorType, assets, apiKey) {
  if (!apiKey) return getFallbackInsight(investorType, assets);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://crypto-advisor.app',
      },
      body: JSON.stringify({
        model: 'liquid/lfm-2.5-1.2b-instruct:free',
        messages: [
          {
            role: 'user',
            content: `You are a concise crypto advisor. Write exactly 2 sentences of actionable investment insight for a ${investorType} who is interested in ${assets.join(', ')}. Be specific, practical, and skip all disclaimers.`,
          },
        ],
        max_tokens: 120,
      }),
    });
    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty response');
    return { id: `ai-${new Date().toISOString().split('T')[0]}`, text };
  } catch (err) {
    console.error('OpenRouter error:', err.message);
    return getFallbackInsight(investorType, assets);
  }
}

router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  try {
    const prefResult = await pool.query(
      'SELECT crypto_assets, investor_type, content_types FROM preferences WHERE user_id = $1',
      [userId]
    );

    if (!prefResult.rows.length) {
      return res.status(404).json({ error: 'no_preferences', message: 'Please complete onboarding first.' });
    }

    const { crypto_assets, investor_type } = prefResult.rows[0];
    const assets = crypto_assets || ['BTC', 'ETH'];

    const [prices, news, insight, meme] = await Promise.all([
      fetchPrices(assets),
      fetchNews(assets),
      fetchAIInsight(investor_type, assets, process.env.OPENROUTER_API_KEY),
      fetchMeme(),
    ]);

    res.json({ prices, news, insight, meme });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
