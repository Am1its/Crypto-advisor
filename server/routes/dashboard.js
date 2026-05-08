import { Router } from 'express';
import pool from '../db/index.js';
import authMiddleware from '../middleware/auth.js';
import { fetchMeme } from '../data/memes.js';

const router = Router();

const COIN_ID_MAP = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', AVAX: 'avalanche-2',
};

async function fetchPrices(symbols) {
  try {
    const ids = symbols.map((s) => COIN_ID_MAP[s?.toUpperCase()]).filter(Boolean);
    console.log('[CoinGecko] symbols received:', symbols);
    console.log('[CoinGecko] mapped IDs:', ids);

    if (!ids.length) {
      console.warn('[CoinGecko] No valid IDs — check COIN_ID_MAP for:', symbols);
      return [];
    }

    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(',')}&price_change_percentage=24h`;
    console.log('[CoinGecko] Fetching URL:', url);

    const headers = process.env.COINGECKO_API_KEY
      ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
      : {};
    const res = await fetch(url, { headers });
    console.log('[CoinGecko] Response status:', res.status);

    if (!res.ok) {
      const body = await res.text();
      console.error('[CoinGecko] Error body:', body.slice(0, 200));
      throw new Error(`CoinGecko ${res.status}`);
    }

    const data = await res.json();
    console.log('[CoinGecko] Data received:', JSON.stringify(data));

    return data.map((coin) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h,
      image: coin.image,
    }));
  } catch (err) {
    console.error('[CoinGecko] Fetch failed:', err.message);
    return symbols.map((s) => ({ symbol: s?.toUpperCase() || s, name: s, price: null, change24h: null, image: null }));
  }
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
