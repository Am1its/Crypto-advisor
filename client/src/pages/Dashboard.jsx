import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, LogOut, RefreshCw,
  ThumbsUp, ThumbsDown, Newspaper, Sparkles, ImageIcon,
  BarChart2, ExternalLink, ChevronsUpDown,
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

function SkeletonPulse({ className }) {
  return <div className={`animate-pulse bg-gray-800 rounded ${className}`} />;
}

function PricesSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
      <div className="h-0.5 flex-shrink-0 bg-amber-400/30" />
      <div className="px-5 pt-4 pb-5 flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex items-center justify-between flex-shrink-0">
          <SkeletonPulse className="h-4 w-28" />
          <SkeletonPulse className="h-6 w-24 rounded-lg" />
        </div>
        <div className="flex-1 min-h-0 flex flex-col gap-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-800/70 last:border-0">
              <div className="flex items-center gap-3">
                <SkeletonPulse className="w-8 h-8 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <SkeletonPulse className="h-3.5 w-10" />
                  <SkeletonPulse className="h-2.5 w-16" />
                </div>
              </div>
              <SkeletonPulse className="hidden sm:block h-7 w-20 rounded" />
              <div className="flex flex-col items-end gap-1.5">
                <SkeletonPulse className="h-3.5 w-16" />
                <SkeletonPulse className="h-4 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-gray-800/60 flex-shrink-0">
          <SkeletonPulse className="h-6 w-36 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function NewsSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
      <div className="h-0.5 flex-shrink-0 bg-sky-400/30" />
      <div className="px-5 pt-4 pb-5 flex flex-col gap-3 flex-1 min-h-0">
        <SkeletonPulse className="h-4 w-28 flex-shrink-0" />
        <div className="flex-1 min-h-0 flex flex-col gap-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 py-3 border-b border-gray-800/60 last:border-0">
              <SkeletonPulse className="w-4 h-3.5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <SkeletonPulse className="h-3.5 w-full" />
                <SkeletonPulse className="h-3.5 w-4/5" />
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1.5">
                    <SkeletonPulse className="h-5 w-24 rounded-full" />
                    <SkeletonPulse className="h-3 w-10" />
                  </div>
                  <SkeletonPulse className="h-6 w-28 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIInsightSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
      <div className="h-0.5 flex-shrink-0 bg-violet-500/30" />
      <div className="px-5 pt-4 pb-5 flex flex-col gap-3 flex-1 min-h-0">
        <SkeletonPulse className="h-4 w-36 flex-shrink-0" />
        <div className="rounded-xl border border-violet-500/10 p-4 flex-1 min-h-0 flex flex-col gap-3">
          <SkeletonPulse className="h-8 w-8" />
          <SkeletonPulse className="h-3.5 w-full -mt-1" />
          <SkeletonPulse className="h-3.5 w-full" />
          <SkeletonPulse className="h-3.5 w-4/5" />
          <SkeletonPulse className="h-3.5 w-3/5" />
          <div className="flex items-center justify-between mt-auto">
            <SkeletonPulse className="h-5 w-28 rounded-full" />
            <SkeletonPulse className="h-3 w-32" />
          </div>
        </div>
        <SkeletonPulse className="h-6 w-28 rounded-full flex-shrink-0" />
      </div>
    </div>
  );
}

function MemeSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
      <div className="h-0.5 flex-shrink-0 bg-rose-400/30" />
      <div className="px-5 pt-4 pb-5 flex flex-col gap-3 flex-1 min-h-0">
        <SkeletonPulse className="h-4 w-32 flex-shrink-0" />
        <div className="flex-1 min-h-0 rounded-xl overflow-hidden">
          <SkeletonPulse className="w-full h-full rounded-xl" />
        </div>
        <div className="flex items-end justify-between gap-4 flex-shrink-0">
          <div className="flex flex-col gap-1.5 flex-1">
            <SkeletonPulse className="h-3.5 w-full" />
            <SkeletonPulse className="h-3.5 w-2/3" />
          </div>
          <SkeletonPulse className="h-6 w-28 rounded-full flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

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

// Card: accepts optional `action` slot rendered right of the title
function Card({ accent, icon: Icon, iconColor, title, action, children, className = '' }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col ${className}`}>
      <div className={`h-0.5 flex-shrink-0 ${accent}`} />
      <div className="px-5 pt-4 pb-5 flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex items-center justify-between gap-2 flex-shrink-0">
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

// ── Section cards ──────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default'         },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'change',     label: '24h Change'       },
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
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
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
      <div className="pt-3 border-t border-gray-800/60 flex-shrink-0">
        <VoteButtons section="prices" itemId="prices-today" votes={votes} onVote={onVote} />
      </div>
    </Card>
  );
}

function AIInsightCard({ insight, votes, onVote }) {
  const isOpenRouter = insight.source === 'openrouter';
  return (
    <Card accent="bg-violet-500" icon={Sparkles} iconColor="text-violet-400" title="AI Insight of the Day">
      <div className="relative rounded-xl overflow-hidden flex-1 min-h-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        <div className="relative p-4 border border-violet-500/20 rounded-xl h-full overflow-y-auto scrollbar-hide">
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
      <div className="pt-1 flex-shrink-0">
        <VoteButtons section="ai" itemId={insight.id} votes={votes} onVote={onVote} />
      </div>
    </Card>
  );
}

function NewsCard({ news, votes, onVote }) {
  return (
    <Card accent="bg-sky-400" icon={Newspaper} iconColor="text-sky-400" title="Market News">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {news.map((article, i) => (
          <div key={article.id}
            className={`group py-3 ${i < news.length - 1 ? 'border-b border-gray-800/60' : ''}`}>
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
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col gap-3">
        <div className="rounded-xl overflow-hidden bg-gray-800/60 flex items-center justify-center flex-1 min-h-0">
          <img
            src={meme.url}
            alt={meme.caption}
            className="w-full h-full object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <div className="flex items-end justify-between gap-4 flex-shrink-0">
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

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [votes, setVotes]       = useState({});
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
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-800/60 bg-gray-900/60 backdrop-blur-sm z-10">
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

      {/* Main */}
      <main className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto px-5 py-5 flex flex-col overflow-hidden">
        {error && (
          <div className="flex-shrink-0 mb-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex justify-between items-center">
            {error}
            <button onClick={() => loadDashboard()} className="underline text-xs">Retry</button>
          </div>
        )}

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-5">
          {loading ? (
            <>
              <PricesSkeleton />
              <NewsSkeleton />
              <AIInsightSkeleton />
              <MemeSkeleton />
            </>
          ) : data ? (
            <>
              <PricesCard    prices={data.prices}   votes={votes} onVote={handleVote} />
              <NewsCard      news={data.news}        votes={votes} onVote={handleVote} />
              <AIInsightCard insight={data.insight}  votes={votes} onVote={handleVote} />
              <MemeCard      meme={data.meme}        votes={votes} onVote={handleVote} />
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
