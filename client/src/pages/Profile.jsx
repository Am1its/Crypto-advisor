import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, CheckCircle, TrendingUp } from 'lucide-react';
import client from '../api/client';

const CRYPTO_OPTIONS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX'];
const INVESTOR_TYPES = ['HODLer', 'Day Trader', 'NFT Collector'];
const CONTENT_TYPES  = ['Market News', 'Charts', 'AI Insights', 'Memes'];

const AVATAR_COLORS = [
  { bg: 'bg-amber-400',   text: 'text-gray-900',  value: 'amber'  },
  { bg: 'bg-violet-500',  text: 'text-white',      value: 'violet' },
  { bg: 'bg-sky-400',     text: 'text-gray-900',   value: 'sky'    },
  { bg: 'bg-rose-400',    text: 'text-white',       value: 'rose'   },
  { bg: 'bg-emerald-400', text: 'text-gray-900',   value: 'emerald'},
  { bg: 'bg-orange-400',  text: 'text-gray-900',   value: 'orange' },
];

function Chip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
        selected
          ? 'bg-amber-400 border-amber-400 text-gray-950'
          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-amber-400/60 hover:text-white'
      }`}>
      {label}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
      <h2 className="text-white font-semibold text-sm">{title}</h2>
      {children}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [name, setName]               = useState(storedUser.name || '');
  const [avatarColor, setAvatarColor] = useState(storedUser.avatarColor || 'amber');
  const [cryptoAssets, setCryptoAssets] = useState([]);
  const [investorType, setInvestorType] = useState('');
  const [contentTypes, setContentTypes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    client.get('/profile').then(({ data }) => {
      setName(data.user.name || '');
      setCryptoAssets(data.preferences?.crypto_assets || []);
      setInvestorType(data.preferences?.investor_type || '');
      setContentTypes(data.preferences?.content_types || []);
    }).catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (setter, current, value) =>
    setter(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await client.put('/profile', {
        name,
        avatarColor,
        crypto_assets: cryptoAssets,
        investor_type: investorType,
        content_types: contentTypes,
      });
      const updated = { ...storedUser, name, avatarColor };
      localStorage.setItem('user', JSON.stringify(updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const activeColor = AVATAR_COLORS.find(c => c.value === avatarColor) || AVATAR_COLORS[0];
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : storedUser.email?.[0]?.toUpperCase() || '?';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="text-amber-400 animate-spin" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800/60 bg-gray-900/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-full max-w-[1600px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-amber-400 rounded-lg p-1.5">
                <TrendingUp size={16} className="text-gray-950" />
              </div>
              <span className="text-white font-bold tracking-tight">Edit Profile</span>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : saved
              ? <><CheckCircle size={14} /> Saved!</>
              : <><Save size={14} /> Save changes</>
            }
          </button>
        </div>
      </header>

      <main className="w-full max-w-[1600px] mx-auto px-6 py-8">
        {error && (
          <div className="mb-5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left col — Avatar + account info */}
          <div className="flex flex-col gap-5">
            <Section title="Profile Picture">
              <div className="flex flex-col items-center gap-5">
                {/* Avatar preview */}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ${activeColor.bg} ${activeColor.text} shadow-lg`}>
                  {initials}
                </div>

                {/* Color picker */}
                <div>
                  <p className="text-gray-500 text-xs text-center mb-3">Choose avatar color</p>
                  <div className="flex gap-2 justify-center">
                    {AVATAR_COLORS.map(c => (
                      <button key={c.value} onClick={() => setAvatarColor(c.value)}
                        className={`w-8 h-8 rounded-full ${c.bg} transition-transform hover:scale-110 ${
                          avatarColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : ''
                        }`} />
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Account">
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Display name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5">Email</label>
                <input
                  value={storedUser.email || ''}
                  disabled
                  className="w-full bg-gray-800/50 border border-gray-700/50 text-gray-500 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                />
                <p className="text-gray-600 text-xs mt-1">Email cannot be changed</p>
              </div>
            </Section>
          </div>

          {/* Right col — Preferences */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <Section title="Crypto Assets">
              <p className="text-gray-500 text-xs -mt-2">Select all that interest you</p>
              <div className="flex flex-wrap gap-2">
                {CRYPTO_OPTIONS.map(coin => (
                  <Chip key={coin} label={coin}
                    selected={cryptoAssets.includes(coin)}
                    onClick={() => toggle(setCryptoAssets, cryptoAssets, coin)} />
                ))}
              </div>
            </Section>

            <Section title="Investor Type">
              <p className="text-gray-500 text-xs -mt-2">Pick one</p>
              <div className="flex flex-wrap gap-2">
                {INVESTOR_TYPES.map(type => (
                  <Chip key={type} label={type}
                    selected={investorType === type}
                    onClick={() => setInvestorType(type)} />
                ))}
              </div>
            </Section>

            <Section title="Content Preferences">
              <p className="text-gray-500 text-xs -mt-2">What you'd like to see on your dashboard</p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map(type => (
                  <Chip key={type} label={type}
                    selected={contentTypes.includes(type)}
                    onClick={() => toggle(setContentTypes, contentTypes, type)} />
                ))}
              </div>
            </Section>

            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-950 font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                  : saved ? <><CheckCircle size={14} /> Saved!</>
                  : <><Save size={14} /> Save changes</>}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
