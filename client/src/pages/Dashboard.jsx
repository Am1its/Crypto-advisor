import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, LogOut, RefreshCw,
  ThumbsUp, ThumbsDown, Newspaper, Brain, ImageIcon, BarChart2,
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

// ── Sub-components ─────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <RefreshCw className="text-amber-400 animate-spin" size={36} />
      <p className="text-gray-400 text-sm">Loading your dashboard…</p>
    </div>
  );
}

function VoteButtons({ section, itemId, votes, onVote }) {
  const key = `${section}:${itemId}`;
  const current = votes[key];
  const base = 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border';
  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={() => onVote(section, itemId, 'up')}
        disabled={!!current}
        className={`${base} ${
          current === 'up'
            ? 'bg-green-500/20 border-green-500 text-green-400'
            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-green-500 hover:text-green-400 disabled:opacity-40 disabled:cursor-not-allowed'
        }`}
      >
        <ThumbsUp size={14} />
        Helpful
      </button>
      <button
        onClick={() => onVote(section, itemId, 'down')}
        disabled={!!current}
        className={`${base} ${
          current === 'down'
            ? 'bg-red-500/20 border-red-500 text-red-400'
            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-red-500 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed'
        }`}
      >
        <ThumbsDown size={14} />
        Not helpful
      </button>
    </div>
  );
}

function CardShell({ icon: Icon, title, children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Icon className="text-amber-400" size={18} />
        <h2 className="text-white font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function PricesCard({ prices, votes, onVote }) {
  return (
    <CardShell icon={BarChart2} title="Coin Prices">
      <div className="divide-y divide-gray-800">
        {prices.map((coin) => (
          <div key={coin.symbol} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {coin.image && (
                <img src={coin.image} alt={coin.symbol} className="w-7 h-7 rounded-full" />
              )}
              <div>
                <p className="text-white font-medium text-sm">{coin.symbol}</p>
                <p className="text-gray-500 text-xs">{coin.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white text-sm font-medium">{fmt(coin.price)}</p>
              {coin.change24h != null && (
                <p className={`text-xs flex items-center justify-end gap-0.5 ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {coin.change24h >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(coin.change24h).toFixed(2)}%
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <VoteButtons section="prices" itemId="prices-today" votes={votes} onVote={onVote} />
    </CardShell>
  );
}

function NewsCard({ news, votes, onVote }) {
  return (
    <CardShell icon={Newspaper} title="Market News">
      <div className="flex flex-col gap-3">
        {news.map((article) => (
          <div key={article.id} className="border border-gray-800 rounded-xl p-3">
            <a
              href={article.url !== '#' ? article.url : undefined}
              target="_blank"
              rel="noreferrer"
              className={`text-sm font-medium leading-snug ${article.url !== '#' ? 'text-white hover:text-amber-400 transition-colors' : 'text-white cursor-default'}`}
            >
              {article.title}
            </a>
            <p className="text-gray-500 text-xs mt-1">
              {article.source} · {timeAgo(article.publishedAt)}
            </p>
            <VoteButtons section="news" itemId={article.id} votes={votes} onVote={onVote} />
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function AIInsightCard({ insight, votes, onVote }) {
  return (
    <CardShell icon={Brain} title="AI Insight of the Day">
      <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4">
        <p className="text-gray-200 text-sm leading-relaxed">{insight.text}</p>
      </div>
      <VoteButtons section="ai" itemId={insight.id} votes={votes} onVote={onVote} />
    </CardShell>
  );
}

function MemeCard({ meme, votes, onVote }) {
  return (
    <CardShell icon={ImageIcon} title="Fun Crypto Meme">
      <div className="rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center min-h-48">
        <img
          src={meme.url}
          alt={meme.caption}
          className="w-full max-h-72 object-contain"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
      <p className="text-gray-300 text-sm text-center italic">"{meme.caption}"</p>
      <VoteButtons section="meme" itemId={meme.id} votes={votes} onVote={onVote} />
    </CardShell>
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

  const loadDashboard = useCallback(async () => {
    setLoading(true);
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
    <div className="min-h-screen bg-gray-950 px-4 py-6 md:px-8">
      {/* Header */}
      <header className="max-w-5xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-amber-400" size={24} />
          <span className="text-white text-xl font-bold">CryptoAdvisor</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden sm:block">
            Hey, <span className="text-white">{user.name || user.email}</span>
          </span>
          <button
            onClick={loadDashboard}
            className="text-gray-400 hover:text-amber-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 text-sm transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="max-w-5xl mx-auto mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm flex justify-between items-center">
          {error}
          <button onClick={loadDashboard} className="underline">Retry</button>
        </div>
      )}

      {/* Dashboard grid */}
      {data && (
        <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <PricesCard prices={data.prices} votes={votes} onVote={handleVote} />
          <NewsCard news={data.news} votes={votes} onVote={handleVote} />
          <AIInsightCard insight={data.insight} votes={votes} onVote={handleVote} />
          <MemeCard meme={data.meme} votes={votes} onVote={handleVote} />
        </main>
      )}
    </div>
  );
}
