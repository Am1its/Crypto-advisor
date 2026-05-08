import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, LogOut, RefreshCw,
  ThumbsUp, ThumbsDown, Newspaper, Sparkles, ImageIcon,
  BarChart2, ExternalLink,
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

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-3">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="text-gray-500 text-sm">Loading your dashboard…</p>
    </div>
  );
}

function VoteButtons({ section, itemId, votes, onVote }) {
  const key = `${section}:${itemId}`;
  const current = votes[key];
  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => onVote(section, itemId, 'up')}
        disabled={!!current}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
          current === 'up'
            ? 'bg-green-500/15 border-green-500/50 text-green-400'
            : 'border-gray-700 text-gray-500 hover:border-green-500/50 hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed'
        }`}
      >
        <ThumbsUp size={10} strokeWidth={2.5} /> Helpful
      </button>
      <button
        onClick={() => onVote(section, itemId, 'down')}
        disabled={!!current}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
          current === 'down'
            ? 'bg-red-500/15 border-red-500/50 text-red-400'
            : 'border-gray-700 text-gray-500 hover:border-red-500/50 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed'
        }`}
      >
        <ThumbsDown size={10} strokeWidth={2.5} /> Not helpful
      </button>
    </div>
  );
}

function Card({ accent, icon: Icon, iconColor, title, children, className = '' }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col ${className}`}>
      <div className={`h-0.5 ${accent}`} />
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-center gap-2">
          <Icon size={15} className={iconColor} />
          <span className={`text-xs font-semibold uppercase tracking-widest ${iconColor}`}>{title}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Section cards ──────────────────────────────────────────────────────────

function PricesCard({ prices, votes, onVote }) {
  return (
    <Card accent="bg-amber-400" icon={BarChart2} iconColor="text-amber-400" title="Coin Prices">
      <div className="flex flex-col">
        {prices.map((coin, i) => (
          <div key={coin.symbol}
            className={`flex items-center justify-between py-3 ${i < prices.length - 1 ? 'border-b border-gray-800/70' : ''}`}>
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
      <div className="mt-auto pt-3 border-t border-gray-800/60">
        <VoteButtons section="prices" itemId="prices-today" votes={votes} onVote={onVote} />
      </div>
    </Card>
  );
}

function AIInsightCard({ insight, votes, onVote }) {
  const isOpenRouter = insight.source === 'openrouter';
  return (
    <Card accent="bg-violet-500" icon={Sparkles} iconColor="text-violet-400" title="AI Insight of the Day">
      <div className="relative rounded-xl overflow-hidden flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        <div className="relative p-4 border border-violet-500/20 rounded-xl">
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
      </div>
      <div className="pt-1">
        <VoteButtons section="ai" itemId={insight.id} votes={votes} onVote={onVote} />
      </div>
    </Card>
  );
}

function NewsCard({ news, votes, onVote }) {
  return (
    <Card accent="bg-sky-400" icon={Newspaper} iconColor="text-sky-400" title="Market News" className="h-full">
      <div className="flex flex-col gap-0 flex-1">
        {news.map((article, i) => (
          <div key={article.id}
            className={`group py-3.5 ${i < news.length - 1 ? 'border-b border-gray-800/60' : ''}`}>
            <div className="flex gap-3">
              <span className="text-gray-700 font-bold text-sm w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-200 text-sm font-medium leading-snug hover:text-white transition-colors flex items-start gap-1"
                >
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
      <div className="flex flex-col gap-4 flex-1">
        <div className="rounded-xl overflow-hidden bg-gray-800/60 flex items-center justify-center min-h-52">
          <img
            src={meme.url}
            alt={meme.caption}
            className="w-full max-h-72 object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <div className="flex items-end justify-between gap-4 mt-auto">
          <p className="text-gray-300 text-sm leading-relaxed italic">"{meme.caption}"</p>
          <div className="flex-shrink-0">
            <VoteButtons section="meme" itemId={meme.id} votes={votes} onVote={onVote} />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [votes, setVotes] = useState({});
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

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800/60 bg-gray-900/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-400 rounded-lg p-1.5">
              <TrendingUp size={16} className="text-gray-950" />
            </div>
            <span className="text-white font-bold tracking-tight">CryptoAdvisor</span>
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

      <main className="max-w-[1600px] mx-auto px-5 py-7">
        {/* Error banner */}
        {error && (
          <div className="mb-5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex justify-between items-center">
            {error}
            <button onClick={() => loadDashboard()} className="underline text-xs">Retry</button>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PricesCard prices={data.prices} votes={votes} onVote={handleVote} />
            <NewsCard news={data.news} votes={votes} onVote={handleVote} />
            <AIInsightCard insight={data.insight} votes={votes} onVote={handleVote} />
            <MemeCard meme={data.meme} votes={votes} onVote={handleVote} />
          </div>
        )}
      </main>
    </div>
  );
}
