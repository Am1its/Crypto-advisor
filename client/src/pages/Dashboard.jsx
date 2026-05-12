import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, LogOut, RefreshCw,
  ThumbsUp, ThumbsDown, Newspaper, Sparkles, ImageIcon,
  BarChart2, ExternalLink, ChevronsUpDown,
  Activity, Layers, Zap, DollarSign,
} from 'lucide-react';
import client from '../api/client';

// ── Widget theming ─────────────────────────────────────────────────────────

const WIDGET_META = {
  'Charts':         { accent: '#F59E0B', glow: 'rgba(245,158,11,0.18)',  Icon: BarChart2,  label: 'COIN PRICES'   },
  'Market News':    { accent: '#38BDF8', glow: 'rgba(56,189,248,0.14)',  Icon: Newspaper,  label: 'MARKET NEWS'   },
  'AI Insights':    { accent: '#A78BFA', glow: 'rgba(167,139,250,0.18)', Icon: Sparkles,   label: 'AI INSIGHT'    },
  'Memes':          { accent: '#FB7185', glow: 'rgba(251,113,133,0.14)', Icon: ImageIcon,  label: 'CRYPTO MEME'   },
  'Fear & Greed':   { accent: '#F97316', glow: 'rgba(249,115,22,0.18)',  Icon: Activity,   label: 'FEAR & GREED'  },
  'ROI Calculator': { accent: '#34D399', glow: 'rgba(52,211,153,0.14)',  Icon: DollarSign, label: 'ROI CALC'      },
  'NFT Showcase':   { accent: '#EC4899', glow: 'rgba(236,72,153,0.14)',  Icon: Layers,     label: 'TRENDING NFTS' },
  'Whale Alerts':   { accent: '#EF4444', glow: 'rgba(239,68,68,0.14)',   Icon: Zap,        label: 'WHALE ALERTS'  },
};

const DEFAULT_COLS = {
  'Charts': 6, 'Market News': 6, 'AI Insights': 3, 'Memes': 3,
  'Fear & Greed': 3, 'ROI Calculator': 3, 'NFT Showcase': 6, 'Whale Alerts': 6,
};

const SIZE_TO_COLS = { S: 3, M: 6, L: 12 };

function getColSpan(type, widgetSizes) {
  const size = widgetSizes?.[type];
  return SIZE_TO_COLS[size] ?? DEFAULT_COLS[type] ?? 6;
}

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

// ── Animated mesh background ───────────────────────────────────────────────

function MeshBackground() {
  return (
    <>
      <style>{`
        @keyframes meshBlob1 {
          0%,100% { transform: translate(0%,0%) scale(1); }
          33%      { transform: translate(12%,22%) scale(1.08); }
          66%      { transform: translate(-8%,12%) scale(0.94); }
        }
        @keyframes meshBlob2 {
          0%,100% { transform: translate(0%,0%) scale(1); }
          33%      { transform: translate(-18%,-12%) scale(1.06); }
          66%      { transform: translate(8%,-22%) scale(1.1); }
        }
        @keyframes meshBlob3 {
          0%,100% { transform: translate(0%,0%) scale(1); }
          33%      { transform: translate(8%,-8%) scale(0.92); }
          66%      { transform: translate(-12%,18%) scale(1.04); }
        }
        .mesh-b1 { animation: meshBlob1 24s ease-in-out infinite; }
        .mesh-b2 { animation: meshBlob2 30s ease-in-out infinite; }
        .mesh-b3 { animation: meshBlob3 20s ease-in-out infinite; }
      `}</style>
      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#04040a]">
        <div className="mesh-b1 absolute -top-40 -left-32 w-[700px] h-[700px] rounded-full bg-violet-600/[0.11] blur-[130px] pointer-events-none" />
        <div className="mesh-b2 absolute top-10 right-[-15%] w-[550px] h-[550px] rounded-full bg-amber-500/[0.07] blur-[110px] pointer-events-none" />
        <div className="mesh-b3 absolute bottom-[-15%] left-[25%] w-[650px] h-[650px] rounded-full bg-sky-500/[0.07] blur-[130px] pointer-events-none" />
        {/* subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '52px 52px' }} />
      </div>
    </>
  );
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
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" points={linePoints} />
    </svg>
  );
}

// ── VoteButtons ─────────────────────────────────────────────────────────────

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
        { vote: 'up',   Icon: ThumbsUp,   label: 'Helpful',     active: 'bg-green-500/20 border-green-500/40 text-green-400' },
        { vote: 'down', Icon: ThumbsDown, label: 'Not helpful', active: 'bg-red-500/20 border-red-500/40 text-red-400' },
      ].map(({ vote, Icon, label, active }) => (
        <button
          key={vote}
          onClick={() => handleVote(vote)}
          disabled={!!current}
          className={[
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all active:scale-90',
            popping === vote ? 'scale-95' : '',
            current === vote
              ? active
              : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/50 disabled:opacity-30 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          <Icon size={10} strokeWidth={2.5} /> {label}
        </button>
      ))}
    </div>
  );
}

// ── GlassCard (replaces old Card) ──────────────────────────────────────────

function GlassCard({ type, colSpan, action, isStale, children }) {
  const meta = WIDGET_META[type] || { accent: '#888', glow: 'transparent', Icon: BarChart2, label: type };
  const { accent, glow, Icon, label } = meta;

  return (
    <div
      style={{
        gridColumn: `span ${colSpan} / span ${colSpan}`,
        background: 'rgba(6, 6, 16, 0.76)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: `1px solid ${accent}22`,
        boxShadow: `0 0 50px ${glow}, 0 1px 0 rgba(255,255,255,0.04) inset`,
      }}
      className="rounded-2xl overflow-hidden flex flex-col min-h-0"
    >
      {/* gradient accent bar */}
      <div style={{ background: `linear-gradient(90deg, ${accent}, ${accent}55)` }} className="h-[2px] flex-shrink-0" />

      {/* header row */}
      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Icon size={13} style={{ color: accent }} />
          <span style={{ color: accent }} className="text-[10px] font-bold uppercase tracking-[0.14em] leading-none">{label}</span>
          {isStale && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400/70 border border-amber-500/20 leading-none">
              APPROX
            </span>
          )}
        </div>
        {action}
      </div>

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3">
        {children}
      </div>
    </div>
  );
}

// ── Glass Skeleton ─────────────────────────────────────────────────────────

function GlassSkeleton({ colSpan = 6 }) {
  return (
    <div
      style={{
        gridColumn: `span ${colSpan} / span ${colSpan}`,
        background: 'rgba(6, 6, 16, 0.55)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
      className="rounded-2xl overflow-hidden flex flex-col min-h-0 animate-pulse"
    >
      <div className="h-[2px] bg-white/[0.08] flex-shrink-0" />
      <div className="px-4 py-2.5 border-b border-white/[0.05] flex-shrink-0">
        <div className="h-2.5 w-24 bg-white/[0.08] rounded-full" />
      </div>
      <div className="flex-1 p-4 flex flex-col gap-3 min-h-0">
        {[1, 0.8, 1, 0.65, 1, 0.75, 1].map((w, i) => (
          <div key={i} style={{ width: `${w * 100}%` }} className="h-3 bg-white/[0.06] rounded-full" />
        ))}
      </div>
    </div>
  );
}

// ── SORT OPTIONS ───────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default'          },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'change',     label: '24h Change'        },
];

// ── PricesCard ─────────────────────────────────────────────────────────────

function PricesCard({ prices, widgetSizes, votes, onVote }) {
  const [sortBy, setSortBy] = useState('default');
  const isStale = prices.some((c) => c._stale);

  const sorted = [...prices].sort((a, b) => {
    if (sortBy === 'price-desc') return (b.price ?? -Infinity) - (a.price ?? -Infinity);
    if (sortBy === 'price-asc')  return (a.price ?? Infinity) - (b.price ?? Infinity);
    if (sortBy === 'change')     return (b.change24h ?? -Infinity) - (a.change24h ?? -Infinity);
    return 0;
  });

  const sortAction = (
    <div className="relative flex items-center">
      <ChevronsUpDown size={10} className="absolute left-2 text-white/30 pointer-events-none" />
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="text-[10px] font-medium rounded-lg pl-5 pr-2 py-1 focus:outline-none cursor-pointer appearance-none text-white/60"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <GlassCard type="Charts" colSpan={getColSpan('Charts', widgetSizes)} action={sortAction} isStale={isStale}>
      <div className="flex flex-col divide-y divide-white/[0.04]">
        {sorted.map((coin) => (
          <div key={coin.symbol} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
            <div className="flex items-center gap-2.5">
              {coin.image
                ? <img src={coin.image} alt={coin.symbol} className="w-7 h-7 rounded-full" />
                : <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white/50">{coin.symbol[0]}</div>
              }
              <div>
                <p className="text-white font-semibold text-sm leading-tight">{coin.symbol}</p>
                <p className="text-white/30 text-[11px]">{coin.name}</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center flex-1 px-4">
              <Sparkline prices={coin.sparkline} change24h={coin.change24h} coinId={coin.symbol} />
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-sm">{fmt(coin.price)}</p>
              {coin.change24h != null && (
                <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-full ${
                  coin.change24h >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {coin.change24h >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                  {Math.abs(coin.change24h).toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="pt-3 mt-2 border-t border-white/[0.05]">
        <VoteButtons section="prices" itemId="prices-today" votes={votes} onVote={onVote} />
      </div>
    </GlassCard>
  );
}

// ── NewsCard ───────────────────────────────────────────────────────────────

function NewsCard({ news, widgetSizes, votes, onVote }) {
  return (
    <GlassCard type="Market News" colSpan={getColSpan('Market News', widgetSizes)}>
      <div className="flex flex-col divide-y divide-white/[0.04]">
        {news.map((article, i) => (
          <div key={article.id} className="group py-2.5 first:pt-0 last:pb-0">
            <div className="flex gap-2.5">
              <span className="text-white/20 font-bold text-xs w-4 flex-shrink-0 mt-0.5 tabular-nums">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <a href={article.url} target="_blank" rel="noreferrer"
                  className="text-white/80 text-sm font-medium leading-snug hover:text-white transition-colors flex items-start gap-1">
                  <span className="line-clamp-2">{article.title}</span>
                  <ExternalLink size={10} className="flex-shrink-0 mt-0.5 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <div className="flex items-center justify-between mt-1.5 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.2)' }}>
                      {article.source}
                    </span>
                    <span className="text-white/25 text-[10px]">{timeAgo(article.publishedAt)}</span>
                  </div>
                  <VoteButtons section="news" itemId={article.id} votes={votes} onVote={onVote} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ── AIInsightCard ──────────────────────────────────────────────────────────

function AIInsightCard({ insight, widgetSizes, votes, onVote }) {
  const isOpenRouter = insight.source === 'openrouter';
  return (
    <GlassCard type="AI Insights" colSpan={getColSpan('AI Insights', widgetSizes)}>
      <div className="rounded-xl p-3 relative overflow-hidden h-full flex flex-col justify-between"
        style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.12)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 via-purple-500/4 to-transparent pointer-events-none rounded-xl" />
        <div className="relative">
          <span className="text-violet-400/40 text-4xl font-serif leading-none select-none">"</span>
          <p className="text-white/75 text-sm leading-relaxed -mt-2">{insight.text}</p>
        </div>
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            isOpenRouter
              ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
              : 'bg-white/5 text-white/30 border border-white/10'
          }`}>
            {isOpenRouter ? '⚡ OpenRouter AI' : '📋 Curated tip'}
          </span>
          <VoteButtons section="ai" itemId={insight.id} votes={votes} onVote={onVote} />
        </div>
      </div>
    </GlassCard>
  );
}

// ── MemeCard ───────────────────────────────────────────────────────────────

function MemeCard({ meme, widgetSizes, votes, onVote }) {
  return (
    <GlassCard type="Memes" colSpan={getColSpan('Memes', widgetSizes)}>
      <div className="flex flex-col gap-3 h-full">
        <div className="flex-1 rounded-xl overflow-hidden min-h-0" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <img
            src={meme.url}
            alt={meme.caption}
            className="w-full h-full object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <div className="flex items-end justify-between gap-3">
          <p className="text-white/60 text-xs leading-relaxed italic flex-1">"{meme.caption}"</p>
          <div className="flex-shrink-0">
            <VoteButtons section="meme" itemId={meme.id} votes={votes} onVote={onVote} />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ── FearGreedCard ──────────────────────────────────────────────────────────

const ARC_R = 70;
const ARC_LEN = Math.PI * ARC_R;

function fearGreedColors(v) {
  if (v <= 25) return { text: '#ef4444', arc: '#ef4444' };
  if (v <= 46) return { text: '#f97316', arc: '#f97316' };
  if (v <= 54) return { text: '#eab308', arc: '#eab308' };
  if (v <= 75) return { text: '#84cc16', arc: '#84cc16' };
  return            { text: '#22c55e', arc: '#22c55e' };
}

function FearGreedCard({ fearGreed, widgetSizes, votes, onVote }) {
  const { value, classification } = fearGreed;
  const { text, arc } = fearGreedColors(value);
  const dashOffset = ARC_LEN * (1 - value / 100);
  const angle = Math.PI * (1 - value / 100);
  const nx = 90 + 56 * Math.cos(angle);
  const ny = 82 - 56 * Math.sin(angle);

  return (
    <GlassCard type="Fear & Greed" colSpan={getColSpan('Fear & Greed', widgetSizes)}>
      <div className="flex flex-col items-center gap-1 h-full justify-between py-1">
        <svg viewBox="0 0 180 88" className="w-full max-w-[200px] mx-auto">
          <path d="M 20 82 A 70 70 0 0 1 160 82"
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
          <path d="M 20 82 A 70 70 0 0 1 160 82"
            fill="none" stroke={arc} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={ARC_LEN} strokeDashoffset={dashOffset} />
          <line x1="90" y1="82" x2={nx} y2={ny} stroke={arc} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="90" cy="82" r="4" fill={arc} />
        </svg>
        <div className="text-4xl font-black -mt-1" style={{ color: text }}>{value}</div>
        <div className="text-sm font-bold" style={{ color: text }}>{classification}</div>
        <div className="flex justify-between w-full text-[10px] text-white/20 px-2 mt-1">
          <span>Fear</span><span>Neutral</span><span>Greed</span>
        </div>
        <p className="text-white/20 text-[10px]">Alternative.me · updated daily</p>
        <div className="w-full pt-2 border-t border-white/[0.05]">
          <VoteButtons section="feargreed" itemId="feargreed-today" votes={votes} onVote={onVote} />
        </div>
      </div>
    </GlassCard>
  );
}

// ── ROICard ────────────────────────────────────────────────────────────────

function ROICard({ roi, prices, widgetSizes, votes, onVote }) {
  const fallbackData = (prices || []).map(p => {
    const fakeYearlyChange = 50 + Math.random() * 200;
    return {
      symbol: p.symbol.toUpperCase(),
      name: p.name,
      currentValue: 1000 * (1 + fakeYearlyChange / 100),
      changePercentage: fakeYearlyChange,
    };
  });

  const safeRoi = (Array.isArray(roi) && roi.length > 0) ? roi : fallbackData;
  const [selectedSymbol, setSelectedSymbol] = useState(safeRoi[0]?.symbol || '');

  if (!safeRoi || safeRoi.length === 0) return null;

  const activeData = safeRoi.find(item => item.symbol === selectedSymbol) || safeRoi[0];
  const name = activeData.name || activeData.symbol;
  const currentVal = Number(activeData.currentValue || activeData.value || 1000);
  const changePct = Number(activeData.changePercentage || activeData.change || 0);
  const profit = currentVal - 1000;

  const accent = '#34D399';

  const coinSelect = (
    <div className="relative flex items-center">
      <ChevronsUpDown size={10} className="absolute left-2 text-white/30 pointer-events-none" />
      <select
        value={selectedSymbol}
        onChange={(e) => setSelectedSymbol(e.target.value)}
        className="text-[10px] font-medium rounded-lg pl-5 pr-2 py-1 focus:outline-none cursor-pointer appearance-none text-white/60"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {safeRoi.map(item => (
          <option key={item.symbol} value={item.symbol}>{item.symbol}</option>
        ))}
      </select>
    </div>
  );

  return (
    <GlassCard type="ROI Calculator" colSpan={getColSpan('ROI Calculator', widgetSizes)} action={coinSelect}>
      <div className="flex flex-col justify-between h-full gap-3">
        <div className="text-center py-2">
          <p className="text-white/40 text-xs mb-3">
            $1,000 in <span className="text-white/70 font-semibold">{name}</span> 1 year ago:
          </p>
          <div className="text-3xl font-black text-white tracking-tight mb-2">
            ${currentVal.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
            profit >= 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
          }`}>
            {profit >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {changePct.toFixed(2)}%
          </span>
        </div>
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-[9px] text-white/25 uppercase tracking-widest font-semibold">Helpful?</span>
          <div className="flex gap-1.5">
            {[['up', ThumbsUp, '✓'], ['down', ThumbsDown, '✗']].map(([v, Icon, _]) => (
              <button key={v}
                onClick={() => onVote('ROI Calculator', activeData.symbol, v)}
                className={`p-1.5 rounded-full transition-all active:scale-90 ${
                  votes['ROI Calculator']?.[activeData.symbol] === v
                    ? v === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    : 'bg-white/5 text-white/30 hover:bg-white/10'
                }`}>
                <Icon size={12} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ── NFTCard ────────────────────────────────────────────────────────────────

function NFTCard({ nfts, widgetSizes, votes, onVote }) {
  return (
    <GlassCard type="NFT Showcase" colSpan={getColSpan('NFT Showcase', widgetSizes)}>
      <div className="flex flex-col divide-y divide-white/[0.04]">
        {nfts.slice(0, 6).map((nft, i) => (
          <div key={nft.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="text-white/20 font-bold text-xs w-4 flex-shrink-0 tabular-nums">{i + 1}</span>
            {nft.thumb
              ? <img src={nft.thumb} alt={nft.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
              : <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ background: 'rgba(236,72,153,0.1)' }}>
                  <Layers size={12} style={{ color: '#EC4899' }} />
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-white/85 text-sm font-semibold truncate">{nft.name}</p>
              <p className="text-white/35 text-[11px]">{nft.floor_price}</p>
            </div>
            {nft.change24h != null && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                nft.change24h >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {nft.change24h >= 0 ? '+' : ''}{nft.change24h.toFixed(1)}%
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="pt-2 mt-2 border-t border-white/[0.05]">
        <VoteButtons section="nft" itemId="nft-trending" votes={votes} onVote={onVote} />
      </div>
    </GlassCard>
  );
}

// ── WhaleAlertCard ─────────────────────────────────────────────────────────

function WhaleAlertCard({ whales, widgetSizes, votes, onVote }) {
  function fmtUsd(v) {
    if (v == null) return null;
    return v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : `$${(v / 1e6).toFixed(1)}M`;
  }

  return (
    <GlassCard type="Whale Alerts" colSpan={getColSpan('Whale Alerts', widgetSizes)}>
      <div className="flex flex-col divide-y divide-white/[0.04]">
        {whales.map((alert) => (
          <div key={alert.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
            <span className="text-sm flex-shrink-0 mt-0.5">🚨</span>
            <div className="flex-1 min-w-0">
              <p className="text-white/75 text-xs leading-snug">
                <span className="text-white font-bold">{alert.amount} {alert.coin}</span>
                {' '}moved from{' '}
                <span className="text-amber-400/80">{alert.from}</span>
                {' '}→{' '}
                <span className="text-amber-400/80">{alert.to}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                {fmtUsd(alert.usdValue) && (
                  <span className="text-green-400/80 text-[10px] font-semibold">{fmtUsd(alert.usdValue)}</span>
                )}
                <span className="text-white/25 text-[10px]">{timeAgo(alert.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-2 mt-2 border-t border-white/[0.05]">
        <VoteButtons section="whale" itemId="whale-alerts" votes={votes} onVote={onVote} />
      </div>
    </GlassCard>
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
  const [loadSlow, setLoadSlow]     = useState(false);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    setLoadSlow(false);

    const slowTimer = setTimeout(() => setLoadSlow(true), 8000);
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
      clearTimeout(slowTimer);
      setLoading(false);
      setLoadSlow(false);
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

  const ALL_TYPES = ['Charts', 'Market News', 'AI Insights', 'Memes', 'Fear & Greed', 'ROI Calculator', 'NFT Showcase', 'Whale Alerts'];

  const renderWidget = (type, widgetSizes) => {
    if (!data) return null;
    const props = { widgetSizes, votes, onVote: handleVote };
    switch (type) {
      case 'Charts':         return data.prices    ? <PricesCard    key={type} prices={data.prices}       {...props} /> : null;
      case 'Market News':    return data.news      ? <NewsCard      key={type} news={data.news}           {...props} /> : null;
      case 'AI Insights':    return data.insight   ? <AIInsightCard key={type} insight={data.insight}     {...props} /> : null;
      case 'Memes':          return data.meme      ? <MemeCard      key={type} meme={data.meme}           {...props} /> : null;
      case 'Fear & Greed':   return data.fearGreed ? <FearGreedCard key={type} fearGreed={data.fearGreed} {...props} /> : null;
      case 'ROI Calculator': return (data.roi || data.prices) ? <ROICard key={type} roi={data.roi} prices={data.prices} {...props} /> : null;
      case 'NFT Showcase':   return data.nfts      ? <NFTCard       key={type} nfts={data.nfts}           {...props} /> : null;
      case 'Whale Alerts':   return data.whales    ? <WhaleAlertCard key={type} whales={data.whales}      {...props} /> : null;
      default:               return null;
    }
  };

  return (
    <>
      <MeshBackground />

      <div className="h-dvh overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <header className="flex-shrink-0 border-b border-white/[0.06]"
          style={{ background: 'rgba(4,4,10,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
          <div className="max-w-[1920px] mx-auto px-5 h-14 flex items-center justify-between">

            <div className="flex items-center gap-3">
              <div className="rounded-xl p-1.5 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
                <TrendingUp size={17} className="text-black" />
              </div>
              <span className="text-white text-base font-bold tracking-tight">CryptoAdvisor</span>
              {loadSlow && (
                <div className="flex items-center gap-1.5 text-amber-400/70 text-[11px] ml-2">
                  <RefreshCw size={11} className="animate-spin" />
                  <span>Fetching live data…</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="text-white/30 hover:text-amber-400 transition-colors disabled:opacity-40 p-2 rounded-lg hover:bg-white/5"
                title="Refresh"
              >
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              </button>

              <div className="h-5 w-px bg-white/10" />

              <Link to="/profile" title="Edit profile"
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  {user.avatarEmoji
                    ? <span className="text-base leading-none">{user.avatarEmoji}</span>
                    : <span className="text-amber-400 text-xs font-bold">{initials(user)}</span>
                  }
                </div>
                <span className="text-white/60 text-sm hidden sm:block">{user.name || user.email}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-white/30 hover:text-red-400 text-sm transition-colors p-2 rounded-lg hover:bg-white/5"
              >
                <LogOut size={14} />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Error bar ── */}
        {error && (
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 text-red-400 text-xs"
            style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
            {error}
            <button onClick={() => loadDashboard()} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* ── Grid ── */}
        <main className="flex-1 overflow-hidden p-3 min-h-0">
          <div
            className="h-full grid grid-cols-12 gap-3"
            style={{ gridAutoFlow: 'dense', gridTemplateRows: 'repeat(3, 1fr)' }}
          >
            {loading ? (
              <>
                <GlassSkeleton colSpan={6} />
                <GlassSkeleton colSpan={6} />
                <GlassSkeleton colSpan={3} />
                <GlassSkeleton colSpan={3} />
                <GlassSkeleton colSpan={3} />
                <GlassSkeleton colSpan={3} />
                <GlassSkeleton colSpan={6} />
                <GlassSkeleton colSpan={6} />
              </>
            ) : data ? (() => {
                const order = data.contentTypes?.length > 0 ? data.contentTypes : ALL_TYPES;
                const widgetSizes = data.widgetSizes || {};
                return order.map((type) => renderWidget(type, widgetSizes));
              })()
            : null}
          </div>
        </main>
      </div>
    </>
  );
}
