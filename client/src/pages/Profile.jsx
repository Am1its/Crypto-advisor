import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, CheckCircle, TrendingUp, Lock, GripVertical, X, LayoutGrid, Sun, Moon } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import client from '../api/client';

const CRYPTO_OPTIONS  = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX'];
const INVESTOR_TYPES  = ['HODLer', 'Day Trader', 'NFT Collector'];
const CONTENT_TYPES   = ['Market News', 'Charts', 'AI Insights', 'Memes', 'Fear & Greed', 'ROI Calculator', 'NFT Showcase', 'Whale Alerts'];

const SIZE_OPTIONS = [
  { key: 'S', label: 'S', desc: '¼ width'  },
  { key: 'M', label: 'M', desc: '½ width'  },
  { key: 'L', label: 'L', desc: 'Full row' },
];

const DEFAULT_SIZE = {
  'Charts': 'M', 'Market News': 'M', 'AI Insights': 'S', 'Memes': 'S',
  'Fear & Greed': 'S', 'ROI Calculator': 'S', 'NFT Showcase': 'M', 'Whale Alerts': 'M',
};

const WIDGET_ACCENT = {
  'Charts': '#F59E0B', 'Market News': '#38BDF8', 'AI Insights': '#A78BFA', 'Memes': '#FB7185',
  'Fear & Greed': '#F97316', 'ROI Calculator': '#34D399', 'NFT Showcase': '#EC4899', 'Whale Alerts': '#EF4444',
};

const AVATARS = [
  { emoji: '🚀', label: 'To the moon'     },
  { emoji: '🦁', label: 'HODL lion'       },
  { emoji: '🐂', label: 'Bull market'     },
  { emoji: '🐻', label: 'Bear market'     },
  { emoji: '🐳', label: 'Crypto whale'    },
  { emoji: '🦊', label: 'MetaMask fox'    },
  { emoji: '🤖', label: 'Trading bot'     },
  { emoji: '🐸', label: 'Pepe'            },
  { emoji: '💎', label: 'Diamond hands'   },
  { emoji: '🦄', label: 'Unicorn'         },
  { emoji: '🤠', label: 'Crypto cowboy'   },
  { emoji: '👽', label: 'From the future' },
];

function Chip({ label, selected, onClick, isLight }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
        selected
          ? 'bg-amber-400 border-amber-400 text-gray-950'
          : isLight
            ? 'bg-slate-100 border-slate-200 text-slate-500 hover:border-amber-400/60 hover:text-slate-800'
            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-amber-400/60 hover:text-white'
      }`}>
      {label}
    </button>
  );
}

function Section({ title, children, action, isLight }) {
  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4"
      style={isLight
        ? { background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }
        : { background: '#111827', border: '1px solid #1f2937' }}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm" style={{ color: isLight ? '#1e293b' : '#fff' }}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const isLight = !isDark;

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(next);
    localStorage.setItem('theme', next);
    setIsDark(!isDark);
  };

  const [name, setName]               = useState(storedUser.name || '');
  const [avatarEmoji, setAvatarEmoji] = useState(storedUser.avatarEmoji || '🚀');
  const [cryptoAssets, setCryptoAssets] = useState([]);
  const [investorType, setInvestorType] = useState('');
  const [contentTypes, setContentTypes] = useState([]);
  const [widgetSizes, setWidgetSizes]   = useState({});
  const [editLayout, setEditLayout]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved]   = useState(false);
  const [pwError, setPwError]   = useState('');

  useEffect(() => {
    client.get('/profile').then(({ data }) => {
      setName(data.user.name || '');
      setCryptoAssets(data.preferences?.crypto_assets || []);
      setInvestorType(data.preferences?.investor_type || '');
      setContentTypes(data.preferences?.content_types || []);
      setWidgetSizes(data.preferences?.widget_sizes || {});
      if (data.preferences?.avatar_emoji) setAvatarEmoji(data.preferences.avatar_emoji);
    }).catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (setter, current, value) =>
    setter(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);

  const onContentDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(contentTypes);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setContentTypes(items);
  };

  const addContentType   = (type) => setContentTypes(prev => [...prev, type]);
  const removeContentType = (type) => setContentTypes(prev => prev.filter(t => t !== type));

  const setSize = (type, size) =>
    setWidgetSizes(prev => ({ ...prev, [type]: size }));

  const getSizeForType = (type) => widgetSizes[type] || DEFAULT_SIZE[type] || 'M';

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await client.put('/profile', {
        name,
        crypto_assets: cryptoAssets,
        investor_type: investorType,
        content_types: contentTypes,
        widget_sizes: widgetSizes,
        avatar_emoji: avatarEmoji,
      });
      const updated = { ...storedUser, name, avatarEmoji };
      localStorage.setItem('user', JSON.stringify(updated));
      setSaved(true);
      toast.success('Profile saved!');
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save. Please try again.');
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) return setPwError('Both fields are required.');
    if (newPassword.length < 6) return setPwError('New password must be at least 6 characters.');
    setPwSaving(true); setPwError(''); setPwSaved(false);
    try {
      await client.put('/profile/password', { currentPassword, newPassword });
      setPwSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password updated!');
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to change password.';
      setPwError(msg);
      toast.error(msg);
    } finally {
      setPwSaving(false);
    }
  };

  const activeAvatar = AVATARS.find(a => a.emoji === avatarEmoji) || AVATARS[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isLight ? '#f1f5f9' : '#030712' }}>
        <Loader2 className="text-amber-400 animate-spin" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: isLight ? '#f1f5f9' : '#030712' }}>
      <header className="sticky top-0 z-10 backdrop-blur-sm"
        style={isLight
          ? { background: 'rgba(255,255,255,0.88)', borderBottom: '1px solid rgba(0,0,0,0.08)' }
          : { background: 'rgba(9,9,21,0.85)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-full max-w-[1600px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              className="transition-colors"
              style={{ color: isLight ? '#94a3b8' : '#6b7280' }}
              onMouseEnter={e => e.currentTarget.style.color = isLight ? '#0f172a' : '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = isLight ? '#94a3b8' : '#6b7280'}>
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-amber-400 rounded-lg p-1.5">
                <TrendingUp size={16} className="text-gray-950" />
              </div>
              <span className="font-bold tracking-tight" style={{ color: isLight ? '#1e293b' : '#fff' }}>Edit Profile</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-all hover:text-amber-500 hover:border-amber-400/40"
              style={isLight
                ? { color: '#64748b', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)' }
                : { color: '#9ca3af', background: '#1f2937', border: '1px solid #374151' }}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
            {saving  ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
             : saved  ? <><CheckCircle size={14} /> Saved!</>
             :           <><Save size={14} /> Save changes</>}
          </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1600px] mx-auto px-6 py-8">
        {error && (
          <div className="mb-5 rounded-xl px-4 py-3 text-sm"
            style={isLight
              ? { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }
              : { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left col ── */}
          <div className="flex flex-col gap-5">

            <Section title="Profile Picture" isLight={isLight}>
              <div className="flex flex-col items-center gap-5">
                <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-5xl shadow-lg">
                  {avatarEmoji}
                </div>
                <p className="text-xs -mt-2" style={{ color: isLight ? '#94a3b8' : '#9ca3af' }}>{activeAvatar.label}</p>
                <div>
                  <p className="text-xs text-center mb-3" style={{ color: isLight ? '#94a3b8' : '#6b7280' }}>Choose your avatar</p>
                  <div className="grid grid-cols-4 gap-2">
                    {AVATARS.map(a => (
                      <button key={a.emoji} onClick={() => setAvatarEmoji(a.emoji)} title={a.label}
                        className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all hover:scale-110 ${
                          avatarEmoji === a.emoji ? 'ring-2 ring-amber-400 scale-110' : ''
                        }`}
                        style={{
                          background: avatarEmoji === a.emoji
                            ? 'rgba(245,158,11,0.15)'
                            : isLight ? 'rgba(0,0,0,0.06)' : '#1f2937',
                        }}>
                        {a.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Account" isLight={isLight}>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: isLight ? '#64748b' : '#9ca3af' }}>Display name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                  style={isLight
                    ? { background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b' }
                    : { background: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#F59E0B'}
                  onBlur={e => e.target.style.borderColor = isLight ? '#e2e8f0' : '#374151'} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: isLight ? '#64748b' : '#9ca3af' }}>Email</label>
                <input value={storedUser.email || ''} disabled
                  className="w-full rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                  style={isLight
                    ? { background: '#f1f5f9', border: '1.5px solid #e2e8f0', color: '#94a3b8' }
                    : { background: 'rgba(31,41,55,0.5)', border: '1px solid rgba(55,65,81,0.5)', color: '#6b7280' }} />
                <p className="text-xs mt-1" style={{ color: isLight ? '#cbd5e1' : '#4b5563' }}>Email cannot be changed</p>
              </div>
            </Section>

            <Section title="Change Password" isLight={isLight}>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: isLight ? '#64748b' : '#9ca3af' }}>Current password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                  style={isLight
                    ? { background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b' }
                    : { background: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#F59E0B'}
                  onBlur={e => e.target.style.borderColor = isLight ? '#e2e8f0' : '#374151'} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: isLight ? '#64748b' : '#9ca3af' }}>New password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                  style={isLight
                    ? { background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b' }
                    : { background: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#F59E0B'}
                  onBlur={e => e.target.style.borderColor = isLight ? '#e2e8f0' : '#374151'} />
              </div>
              {pwError && <p className="text-xs" style={{ color: isLight ? '#dc2626' : '#f87171' }}>{pwError}</p>}
              <button onClick={handlePasswordChange} disabled={pwSaving}
                className="flex items-center gap-2 font-medium text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                style={isLight
                  ? { background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }
                  : { background: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)')}
                onMouseLeave={e => e.currentTarget.style.borderColor = isLight ? '#e2e8f0' : '#374151'}>
                {pwSaving ? <><Loader2 size={14} className="animate-spin" /> Updating…</>
                 : pwSaved ? <><CheckCircle size={14} className="text-green-500" /> Password updated!</>
                 :           <><Lock size={14} className="text-amber-500" /> Update password</>}
              </button>
            </Section>
          </div>

          {/* ── Right col ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            <Section title="Crypto Assets" isLight={isLight}>
              <p className="text-xs -mt-2" style={{ color: isLight ? '#94a3b8' : '#6b7280' }}>Select all that interest you</p>
              <div className="flex flex-wrap gap-2">
                {CRYPTO_OPTIONS.map(coin => (
                  <Chip key={coin} label={coin} isLight={isLight}
                    selected={cryptoAssets.includes(coin)}
                    onClick={() => toggle(setCryptoAssets, cryptoAssets, coin)} />
                ))}
              </div>
            </Section>

            <Section title="Investor Type" isLight={isLight}>
              <p className="text-xs -mt-2" style={{ color: isLight ? '#94a3b8' : '#6b7280' }}>Pick one</p>
              <div className="flex flex-wrap gap-2">
                {INVESTOR_TYPES.map(type => (
                  <Chip key={type} label={type} isLight={isLight}
                    selected={investorType === type}
                    onClick={() => setInvestorType(type)} />
                ))}
              </div>
            </Section>

            {/* ── Content & Layout ── */}
            <Section
              title="Dashboard Layout"
              isLight={isLight}
              action={
                <button
                  onClick={() => setEditLayout(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                  style={editLayout
                    ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#d97706' }
                    : isLight
                      ? { background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)', color: '#64748b' }
                      : { background: '#1f2937', border: '1px solid #374151', color: '#9ca3af' }}
                >
                  <LayoutGrid size={12} />
                  {editLayout ? 'Done sizing' : 'Edit sizes'}
                </button>
              }
            >
              <p className="text-xs -mt-2" style={{ color: isLight ? '#94a3b8' : '#6b7280' }}>
                Drag to reorder.{' '}
                {editLayout
                  ? <span className="text-amber-500">Choose S (¼), M (½), or L (full row) for each widget.</span>
                  : 'Toggle "Edit sizes" to control widget width.'}
              </p>

              {/* Draggable ordered list */}
              {contentTypes.length > 0 && (
                <DragDropContext onDragEnd={onContentDragEnd}>
                  <Droppable droppableId="content-types">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-2">
                        {contentTypes.map((type, index) => {
                          const accent = WIDGET_ACCENT[type] || '#F59E0B';
                          const currentSize = getSizeForType(type);
                          return (
                            <Draggable key={type} draggableId={type} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                                    snapshot.isDragging
                                      ? 'shadow-xl opacity-95'
                                      : ''
                                  }`}
                                  style={{
                                    background: `${accent}0f`,
                                    border: `1px solid ${accent}${snapshot.isDragging ? '55' : '28'}`,
                                    boxShadow: snapshot.isDragging ? `0 8px 30px ${accent}22` : undefined,
                                    ...provided.draggableProps.style,
                                  }}
                                >
                                  {/* Drag handle */}
                                  <div {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing flex-shrink-0 opacity-40 hover:opacity-70 transition-opacity">
                                    <GripVertical size={14} style={{ color: accent }} />
                                  </div>

                                  {/* Label + index */}
                                  <span className="flex-1" style={{ color: accent }}>{type}</span>
                                  <span className="text-[10px] tabular-nums opacity-40" style={{ color: accent }}>#{index + 1}</span>

                                  {/* Size toggle — shown only in edit layout mode */}
                                  {editLayout && (
                                    <div className="flex items-center gap-1 mx-1">
                                      {SIZE_OPTIONS.map(({ key, label, desc }) => (
                                        <button
                                          key={key}
                                          type="button"
                                          title={desc}
                                          onClick={() => setSize(type, key)}
                                          className={`w-7 h-6 rounded-md text-[11px] font-bold transition-all ${
                                            currentSize === key
                                              ? 'text-gray-950'
                                              : 'opacity-30 hover:opacity-60'
                                          }`}
                                          style={currentSize === key ? { background: accent } : { background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}
                                        >
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* Remove */}
                                  <button type="button" onClick={() => removeContentType(type)}
                                    className="opacity-30 hover:opacity-80 hover:text-red-400 transition-all flex-shrink-0 ml-1">
                                    <X size={13} />
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}

              {contentTypes.length === 0 && (
                <p className="text-xs italic" style={{ color: isLight ? '#94a3b8' : '#4b5563' }}>
                  No widgets selected — all will show in default order and size.
                </p>
              )}

              {/* Available to add */}
              {CONTENT_TYPES.filter(t => !contentTypes.includes(t)).length > 0 && (
                <div className="flex flex-col gap-2 pt-2" style={{ borderTop: isLight ? '1px solid rgba(0,0,0,0.07)' : '1px solid #1f2937' }}>
                  <p className="text-xs" style={{ color: isLight ? '#94a3b8' : '#4b5563' }}>Click to add:</p>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_TYPES.filter(t => !contentTypes.includes(t)).map(type => (
                      <Chip key={type} label={type} isLight={isLight} selected={false} onClick={() => addContentType(type)} />
                    ))}
                  </div>
                </div>
              )}

              {editLayout && (
                <p className="text-[10px] italic pt-2" style={{ color: isLight ? '#94a3b8' : '#374151', borderTop: isLight ? '1px solid rgba(0,0,0,0.07)' : '1px solid #1f2937' }}>
                  Note: oversized widgets may push others off-screen. Default layout fits all 8 widgets in 3 rows.
                </p>
              )}
            </Section>

          </div>
        </div>
      </main>
    </div>
  );
}
