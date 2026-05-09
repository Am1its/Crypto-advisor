import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, LogOut, RefreshCw,
  ThumbsUp, ThumbsDown, Newspaper, Sparkles, ImageIcon,
  BarChart2, ExternalLink, ChevronsUpDown,
  Activity, Layers, Zap, DollarSign,
} from 'lucide-react';
import client from '../api/client';

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmt(price) {
  if (price == null) return '–';
  return price >= 1
    ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    : `$${price.toFixed(6)}`;
}

function initials(user) {
  if (user.name) return user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return user.email?.[0]?.toUpperCase() || '?';
}

// ── Sparkline ──────────────────────────────────────────────────────────────

function Sparkline({ prices, change24h, coinId }) {
  if (!prices?.length) return null;
  const W = 80, H = 28, PAD = 1;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const toX = (i) => PAD + (i / (prices.length - 1)) * (W - PAD * 2);
  const toY = (p) => PAD + (1 - (p - min) / range) * (H - PAD * 2);
  const linePoints = prices.map((p, i) => `${toX(i)},${toY(p)}`).join(' ');
  const areaPath =
    `M ${toX(0)},${H} ` +
    prices.map((p, i) => `L ${toX(i)},${toY(p)}`).join(' ') +
    ` L ${toX(prices.length - 1)},${H} Z`;
  const color = (change24h ?? 0) >= 0 ? '#22c55e' : '#ef4444';
  const gradId = `sg-${coinId}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" points={linePoints} />
    </svg>
  );
}

// ── Shared components ──────────────────────────────────────────────────────

function VoteButtons({ section, itemId, votes, onVote }) {
  const key = `${section}:${itemId}`;
  const current = votes[key];
  const [popping, setPopping] = useState(null);

  const handleVote = (vote) => {
    if (current) return;
    setPopping(vote);
    onVote(section, itemId, vote);
    setTimeout(() => setPopping(null), 380);
  };

  return (
    <div className="flex gap-1.5">
      {[
        { vote: 'up',   Icon: ThumbsUp,   label: 'Helpful',     active: 'bg-green-500/15 border-green-500/50 text-green-400' },
        { vote: 'down', Icon: ThumbsDown, label: 'Not helpful', active: 'bg-red-500/15 border-red-500/50 text-red-400'   },
      ].map(({ vote, Icon, label, active }) => (
        <button
          key={vote}
          onClick={() => handleVote(vote)}
          disabled={!!current}
          className={[
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all active:scale-90',
            popping === vote ? 'vote-pop' : '',
            current === vote
              ? active
              : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          <Icon size={10} strokeWidth={2.5} /> {label}
        </button>
      ))}
    </div>
  );
}

function Card({ accent, icon: Icon, iconColor, title, action, children, className = '' }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col break-inside-avoid mb-5 ${className}`}>
      <div className={`h-0.5 flex-shrink-0 ${accent}`} />
      <div className="px-5 pt-4 pb-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon size={16} className={iconColor} />
            <span className={`text-sm font-bold uppercase tracking-widest ${iconColor}`}>{title}</span>
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Skeletons (masonry-compatible) ─────────────────────────────────────────

function SkeletonBlock({ className }) {
  return <div className={`animate-pulse bg-gray-800 rounded ${className}`} />;
}

function SkeletonCard({ rows = 4, hasImage = false, hasGauge = false }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden break-inside-avoid mb-5">
      <div className="h-0.5 bg-gray-800/60 animate-pulse" />
      <div className="px-5 pt-4 pb-5 flex flex-col gap-3">
        <SkeletonBlock className="h-4 w-32" />
        {hasGauge && <SkeletonBlock className="h-28 w-full rounded-xl" />}
        {hasImage && <SkeletonBlock className="h-40 w-full rounded-xl" />}
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonBlock key={i} className={`h-3.5 ${i % 3 === 2 ? 'w-3/4' : 'w-full'}`} />
        ))}
        <SkeletonBlock className="h-6 w-28 rounded-full mt-1" />
      </div>
    </div>
  );
}

// ── Section cards ──────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default'          },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'change',     label: '24h Change'        },
];

function PricesCard({ prices, votes, onVote }) {
  const [sortBy, setSortBy] = useState('default');

  const sorted = [...prices].sort((a, b) => {
    if (sortBy === 'price-desc') return (b.price ?? -Infinity) - (a.price ?? -Infinity);
    if (sortBy === 'price-asc')  return (a.price ?? Infinity)  - (b.price ?? Infinity);
    if (sortBy === 'change')     return (b.change24h ?? -Infinity) - (a.change24h ?? -Infinity);
    return 0;
  });

  const sortAction = (
    <div className="relative flex items-center">
      <ChevronsUpDown size={11} className="absolute left-2 text-gray-500 pointer-events-none" />
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg pl-6 pr-2 py-1 focus:outline-none focus:border-amber-400 cursor-pointer appearance-none"
      >
        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <Card accent="bg-amber-400" icon={BarChart2} iconColor="text-amber-400" title="Coin Prices" action={sortAction}>
      <div className="max-h-[340px] overflow-y-auto scrollbar-hide">
        {sorted.map((coin, i) => (
          <div key={coin.symbol}
            className={`flex items-center justify-between py-2.5 ${i < sorted.length - 1 ? 'border-b border-gray-800/70' : ''}`}>
            <div className="flex items-center gap-3">
              {coin.image
                ? <img src={coin.image} alt={coin.symbol} className="w-8 h-8 rounded-full" />
                : <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">{coin.symbol[0]}</div>
              }
              <div>
                <p className="text-white font-semibold text-sm leading-tight">{coin.symbol}</p>
                <p className="text-gray-500 text-xs">{coin.name}</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center flex-1 px-3">
              <Sparkline prices={coin.sparkline} change24h={coin.change24h} coinId={coin.symbol} />
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-sm">{fmt(coin.price)}</p>
              {coin.change24h != null && (
                <span className={`inline-flex items-center gap-0.5 text-xs font-medium mt-0.5 px-1.5 py-0.5 rounded-full ${
                  coin.change24h >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {coin.change24h >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  {Math.abs(coin.change24h).toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="pt-3 border-t border-gray-800/60">
        <VoteButtons section="prices" itemId="prices-today" votes={votes} onVote={onVote} />
      </div>
    </Card>
  );
}

function AIInsightCard({ insight, votes, onVote }) {
  const isOpenRouter = insight.source === 'openrouter';
  return (
    <Card accent="bg-violet-500" icon={Sparkles} iconColor="text-violet-400" title="AI Insight of the Day">
      <div className="rounded-xl border border-violet-500/20 p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        <span className="text-violet-400/60 text-5xl font-serif leading-none select-none">"</span>
        <p className="text-gray-200 text-sm leading-relaxed -mt-3">{insight.text}</p>
        <div className="flex items-center justify-between mt-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isOpenRouter
              ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
              : 'bg-gray-800 text-gray-500 border border-gray-700'
          }`}>
            {isOpenRouter ? '⚡ OpenRouter AI' : '📋 Curated tip'}
          </span>
          <p className="text-violet-400/50 text-xs">— AI-generated insight</p>
        </div>
      </div>
      <VoteButtons section="ai" itemId={insight.id} votes={votes} onVote={onVote} />
    </Card>
  );
}

function NewsCard({ news, votes, onVote }) {
  return (
    <Card accent="bg-sky-400" icon={Newspaper} iconColor="text-sky-400" title="Market News">
      <div className="max-h-[420px] overflow-y-auto scrollbar-hide">
        {news.map((article, i) => (
          <div key={article.id}
            className={`group py-3 ${i < news.length - 1 ? 'border-b border-gray-800/60' : ''}`}>
            <div className="flex gap-3">
              <span className="text-gray-700 font-bold text-sm w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <a href={article.url} target="_blank" rel="noreferrer"
                  className="text-gray-200 text-sm font-medium leading-snug hover:text-white transition-colors flex items-start gap-1">
                  <span className="line-clamp-2">{article.title}</span>
                  <ExternalLink size={11} className="flex-shrink-0 mt-0.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-sky-500/10 text-sky-400 text-xs px-2 py-0.5 rounded-full font-medium">{article.source}</span>
                    <span className="text-gray-600 text-xs">{timeAgo(article.publishedAt)}</span>
                  </div>
                  <VoteButtons section="news" itemId={article.id} votes={votes} onVote={onVote} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MemeCard({ meme, votes, onVote }) {
  return (
    <Card accent="bg-rose-400" icon={ImageIcon} iconColor="text-rose-400" title="Fun Crypto Meme">
      <div className="rounded-xl overflow-hidden bg-gray-800/60">
        <img
          src={meme.url}
          alt={meme.caption}
          className="w-full object-contain max-h-64"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
      <div className="flex items-end justify-between gap-4">
        <p className="text-gray-300 text-sm leading-relaxed italic">"{meme.caption}"</p>
        <div className="flex-shrink-0">
          <VoteButtons section="meme" itemId={meme.id} votes={votes} onVote={onVote} />
        </div>
      </div>
    </Card>
  );
}

// ── New personalized widgets ───────────────────────────────────────────────

const ARC_R = 70;
const ARC_LEN = Math.PI * ARC_R; // ~219.9

function fearGreedColors(v) {
  if (v <= 25) return { text: 'text-red-400',    arc: '#ef4444' };
  if (v <= 46) return { text: 'text-orange-400', arc: '#f97316' };
  if (v <= 54) return { text: 'text-yellow-400', arc: '#eab308' };
  if (v <= 75) return { text: 'text-lime-400',   arc: '#84cc16' };
  return            { text: 'text-green-400',    arc: '#22c55e' };
}

function FearGreedCard({ fearGreed, votes, onVote }) {
  const { value, classification } = fearGreed;
  const { text, arc } = fearGreedColors(value);
  const dashOffset = ARC_LEN * (1 - value / 100);
  // Standard-math angle: π (left=fear) → 0 (right=greed)
  const angle = Math.PI * (1 - value / 100);
  const nx = 90 + 56 * Math.cos(angle);
  const ny = 82 - 56 * Math.sin(angle);

  return (
    <Card accent="bg-orange-500" icon={Activity} iconColor="text-orange-400" title="Fear & Greed Index">
      <div className="flex flex-col items-center gap-1 py-1">
        {/* Gauge arc — sweep=1 draws the top semicircle in SVG coords */}
        <svg viewBox="0 0 180 88" className="w-full max-w-[220px] mx-auto">
          <path d="M 20 82 A 70 70 0 0 1 160 82"
            fill="none" stroke="#1f2937" strokeWidth="10" strokeLinecap="round" />
          <path d="M 20 82 A 70 70 0 0 1 160 82"
            fill="none" stroke={arc} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={ARC_LEN} strokeDashoffset={dashOffset} />
          <line x1="90" y1="82" x2={nx} y2={ny}
            stroke={arc} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="90" cy="82" r="4" fill={arc} />
        </svg>
        <div className={`text-4xl font-black -mt-1 ${text}`}>{value}</div>
        <div className={`text-sm font-bold ${text}`}>{classification}</div>
        <div className="flex justify-between w-full text-xs text-gray-700 px-2 mt-1">
          <span>Fear</span>
          <span>Neutral</span>
          <span>Greed</span>
        </div>
        <p className="text-gray-600 text-xs mt-0.5">Source: Alternative.me · updated daily</p>
      </div>
      <div className="pt-2 border-t border-gray-800/60">
        <VoteButtons section="feargreed" itemId="feargreed-today" votes={votes} onVote={onVote} />
      </div>
    </Card>
  );
}

// --- ROI Calculator Component ---
function ROICard({ roi, votes, onVote }) {
  const [selectedSymbol, setSelectedSymbol] = useState(roi?.[0]?.symbol || '');

  if (!roi || roi.length === 0) return null;

  const activeData = roi.find(item => item.symbol === selectedSymbol) || roi[0];

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl break-inside-avoid mb-6 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-green-500/20 p-2 rounded-lg">
            <DollarSign className="text-green-400" size={20} />
          </div>
          <h2 className="text-white font-bold text-lg">ROI Calculator</h2>
        </div>
        
        {/* תפריט בחירת מטבע מעוצב */}
        <div className="relative">
          <select 
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="appearance-none bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {roi.map(item => (
              <option key={item.symbol} value={item.symbol}>{item.symbol}</option>
            ))}
          </select>
          <ChevronsUpDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-gray-400 text-sm mb-2">If you invested <span className="text-white font-semibold">$1,000</span> a year ago in {activeData.name}:</p>
        
        <div className="text-3xl font-black text-white mb-2 tracking-tight">
          {fmt(activeData.currentValue)}
        </div>

        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${activeData.profit >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {activeData.profit >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {activeData.changePercentage.toFixed(2)}%
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Is this ROI Insight helpful?</span>
        <div className="flex gap-2">
          <button 
            onClick={() => onVote('ROI Calculator', activeData.symbol, 'up')}
            className={`p-2 rounded-full transition-all active:scale-90 ${votes['ROI Calculator']?.[activeData.symbol] === 'up' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <ThumbsUp size={14} />
          </button>
          <button 
            onClick={() => onVote('ROI Calculator', activeData.symbol, 'down')}
            className={`p-2 rounded-full transition-all active:scale-90 ${votes['ROI Calculator']?.[activeData.symbol] === 'down' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <ThumbsDown size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function NFTCard({ nfts, votes, onVote }) {
  return (
    <Card accent="bg-pink-500" icon={Layers} iconColor="text-pink-400" title="Trending NFTs">
      <div>
        {nfts.slice(0, 6).map((nft, i) => (
          <div key={nft.id}
            className={`flex items-center gap-3 py-2.5 ${i < Math.min(nfts.length, 6) - 1 ? 'border-b border-gray-800/60' : ''}`}>
            <span className="text-gray-700 font-bold text-sm w-4 flex-shrink-0">{i + 1}</span>
            {nft.thumb
              ? <img src={nft.thumb} alt={nft.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              : <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-pink-400/60 flex-shrink-0">
                  <Layers size={14} />
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{nft.name}</p>
              <p className="text-gray-500 text-xs">{nft.floor_price}</p>
            </div>
            {nft.change24h != null && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                nft.change24h >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {nft.change24h >= 0 ? '+' : ''}{nft.change24h.toFixed(1)}%
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="pt-1 border-t border-gray-800/60">
        <VoteButtons section="nft" itemId="nft-trending" votes={votes} onVote={onVote} />
      </div>
    </Card>
  );
}

function WhaleAlertCard({ whales, votes, onVote }) {
  function fmtUsd(v) {
    if (v == null) return null;
    return v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : `$${(v / 1e6).toFixed(1)}M`;
  }

  return (
    <Card accent="bg-red-500" icon={Zap} iconColor="text-red-400" title="Whale Alerts">
      <div className="max-h-[320px] overflow-y-auto scrollbar-hide">
        {whales.map((alert) => (
          <div key={alert.id} className="flex items-start gap-3 py-3 border-b border-gray-800/60 last:border-0">
            <span className="text-base flex-shrink-0 mt-0.5">🚨</span>
            <div className="flex-1 min-w-0">
              <p className="text-gray-200 text-sm leading-snug">
                <span className="text-white font-bold">{alert.amount} {alert.coin}</span>
                {' '}transferred from{' '}
                <span className="text-amber-400">{alert.from}</span>
                {' '}to{' '}
                <span className="text-amber-400">{alert.to}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                {fmtUsd(alert.usdValue) && (
                  <span className="text-green-400 text-xs font-medium">{fmtUsd(alert.usdValue)}</span>
                )}
                <span className="text-gray-600 text-xs">{timeAgo(alert.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-1 border-t border-gray-800/60">
        <VoteButtons section="whale" itemId="whale-alerts" votes={votes} onVote={onVote} />
      </div>
    </Card>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [votes, setVotes]           = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const { data: res } = await client.get('/dashboard');
      setData(res);
    } catch (err) {
      if (err.response?.data?.error === 'no_preferences') {
        navigate('/onboarding');
      } else {
        setError('Failed to load dashboard. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleVote = async (section, itemId, vote) => {
    const key = `${section}:${itemId}`;
    setVotes((prev) => ({ ...prev, [key]: vote }));
    try {
      await client.post('/votes', { section, item_id: itemId, vote });
    } catch {
      setVotes((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-800/60 bg-gray-900/60 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-400 rounded-lg p-1.5">
              <TrendingUp size={18} className="text-gray-950" />
            </div>
            <span className="text-white text-lg font-bold tracking-tight">CryptoAdvisor</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="text-gray-500 hover:text-amber-400 transition-colors disabled:opacity-40"
              title="Refresh dashboard"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-800">
              <Link to="/profile" title="Edit profile"
                className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:border-amber-400 transition-colors overflow-hidden">
                {user.avatarEmoji
                  ? <span className="text-base leading-none">{user.avatarEmoji}</span>
                  : <span className="text-amber-400 text-xs font-bold">{initials(user)}</span>
                }
              </Link>
              <span className="text-gray-300 text-sm hidden sm:block">{user.name || user.email}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-gray-500 hover:text-red-400 text-sm transition-colors pl-3 border-l border-gray-800"
            >
              <LogOut size={15} />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main — masonry */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-5 py-6">
        {error && (
          <div className="mb-5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex justify-between items-center">
            {error}
            <button onClick={() => loadDashboard()} className="underline text-xs">Retry</button>
          </div>
        )}

        <div className="columns-1 md:columns-2 xl:columns-3 gap-5">
          {loading ? (
            <>
              <SkeletonCard rows={5} />
              <SkeletonCard rows={6} />
              <SkeletonCard rows={3} hasImage />
              <SkeletonCard rows={4} hasGauge />
              <SkeletonCard rows={5} />
              <SkeletonCard rows={4} />
            </>
          ) : data ? (() => {
            const ct = data.contentTypes || [];
            const ALL_TYPES = ['Charts', 'Market News', 'AI Insights', 'Memes', 'Fear & Greed', 'ROI Calculator', 'NFT Showcase', 'Whale Alerts'];
            const order = ct.length > 0 ? ct : ALL_TYPES;

            const renderWidget = (type) => {
              switch (type) {
                case 'Charts':         return data.prices    ? <PricesCard    key={type} prices={data.prices}        votes={votes} onVote={handleVote} /> : null;
                case 'Market News':    return data.news      ? <NewsCard      key={type} news={data.news}            votes={votes} onVote={handleVote} /> : null;
                case 'AI Insights':    return data.insight   ? <AIInsightCard key={type} insight={data.insight}      votes={votes} onVote={handleVote} /> : null;
                case 'Memes':          return data.meme      ? <MemeCard      key={type} meme={data.meme}            votes={votes} onVote={handleVote} /> : null;
                case 'Fear & Greed':   return data.fearGreed ? <FearGreedCard key={type} fearGreed={data.fearGreed}  votes={votes} onVote={handleVote} /> : null;
                case 'ROI Calculator': return data.roi       ? <ROICard       key={type} roi={data.roi}              votes={votes} onVote={handleVote} /> : null;
                case 'NFT Showcase':   return data.nfts      ? <NFTCard       key={type} nfts={data.nfts}            votes={votes} onVote={handleVote} /> : null;
                case 'Whale Alerts':   return data.whales    ? <WhaleAlertCard key={type} whales={data.whales}       votes={votes} onVote={handleVote} /> : null;
                default:               return null;
              }
            };

            return order.map(renderWidget);
          })() : null}
        </div>
      </main>
    </div>
  );
}
