import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Loader2, ChevronRight, ChevronLeft, Check, Sun, Moon } from 'lucide-react';
import client from '../api/client';
import MeshBackground from '../components/MeshBackground';

const CRYPTO_OPTIONS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX'];
const INVESTOR_TYPES = ['HODLer', 'Day Trader', 'NFT Collector'];
const CONTENT_TYPES  = ['Market News', 'Charts', 'AI Insights', 'Memes', 'Fear & Greed', 'ROI Calculator', 'NFT Showcase', 'Whale Alerts'];
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
  { emoji: '🐯', label: 'Paper hands'     },
  { emoji: '🦅', label: 'Eagle eye'       },
  { emoji: '🌙', label: 'Moon chaser'     },
  { emoji: '⚡', label: 'Fast mover'      },
];

const STEPS = [
  { title: 'Crypto interests',  subtitle: 'Which assets do you follow?' },
  { title: 'Investor profile',  subtitle: 'How do you approach crypto?' },
  { title: 'Dashboard content', subtitle: 'What do you want to see?' },
  { title: 'Pick your avatar',  subtitle: 'Choose your crypto identity' },
];

function Chip({ label, selected, onClick, light = false }) {
  if (selected) {
    return (
      <button type="button" onClick={onClick}
        className="px-4 py-2 rounded-full text-sm font-semibold border transition-all"
        style={{ background: '#F59E0B', border: '1px solid #F59E0B', color: '#030712' }}>
        {label}
      </button>
    );
  }
  return (
    <button type="button" onClick={onClick}
      className="px-4 py-2 rounded-full text-sm font-medium border transition-all"
      style={{
        background: light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
        border: light ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.1)',
        color: light ? '#475569' : 'rgba(255,255,255,0.7)',
      }}>
      {label}
    </button>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep]            = useState(0);
  const [animating, setAnimating]  = useState(false);
  const [cryptoAssets, setCryptoAssets] = useState([]);
  const [investorType, setInvestorType] = useState('');
  const [contentTypes, setContentTypes] = useState([]);
  const [avatarEmoji, setAvatarEmoji]   = useState('🚀');
  const [error, setError]    = useState('');
  const [loading, setLoading] = useState(false);
  const [isLight, setIsLight] = useState(() => document.documentElement.classList.contains('light'));

  useEffect(() => {
    const obs = new MutationObserver(() => setIsLight(document.documentElement.classList.contains('light')));
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const toggleTheme = () => {
    const next = isLight ? 'dark' : 'light';
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(next);
    localStorage.setItem('theme', next);
  };

  const light = {
    root: 'min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10',
    textTitle: '#0f172a',
    textSub: '#64748b',
    textSecondary: '#94a3b8',
    card: { background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)' },
    bar: 'linear-gradient(90deg,#F59E0B,#FBBF24)',
    barH: 'h-[3px]',
    divider: 'rgba(0,0,0,0.06)',
    stepInactive: { background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.25)' },
    stepActive: { background: 'rgba(245,158,11,0.15)', border: '1px solid #F59E0B', color: '#D97706' },
    stepDone: { background: '#F59E0B', border: '1px solid #F59E0B', color: '#030712' },
    connectorInactive: 'rgba(0,0,0,0.08)',
    backColor: '#94a3b8',
  };
  const dark = {
    root: 'min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden',
    textTitle: '#fff',
    textSub: 'rgba(255,255,255,0.45)',
    textSecondary: 'rgba(255,255,255,0.25)',
    card: { background: 'rgba(6,6,16,0.82)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 0 60px rgba(245,158,11,0.08), 0 25px 50px rgba(0,0,0,0.25)' },
    bar: 'linear-gradient(90deg,#F59E0B,#F59E0B55)',
    barH: 'h-[2px]',
    divider: 'rgba(255,255,255,0.05)',
    stepInactive: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
    stepActive: { background: 'rgba(245,158,11,0.2)', border: '1px solid #F59E0B', color: '#F59E0B' },
    stepDone: { background: '#F59E0B', border: '1px solid #F59E0B', color: '#030712' },
    connectorInactive: 'rgba(255,255,255,0.08)',
    backColor: 'rgba(255,255,255,0.35)',
  };
  const t = isLight ? light : dark;

  const toggleMulti = (setter, current, value) =>
    setter(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);

  const canAdvance = () => {
    if (step === 0) return cryptoAssets.length > 0;
    if (step === 1) return !!investorType;
    if (step === 2) return contentTypes.length > 0;
    return true;
  };

  const goNext = () => {
    if (!canAdvance() || animating) return;
    if (step < STEPS.length - 1) {
      setAnimating(true);
      setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 180);
    }
  };

  const goPrev = () => {
    if (step === 0 || animating) return;
    setAnimating(true);
    setTimeout(() => { setStep(s => s - 1); setAnimating(false); }, 180);
  };

  const handleSubmit = async () => {
    if (!cryptoAssets.length || !investorType || !contentTypes.length) {
      setError('Please complete all steps before continuing.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await client.post('/onboarding', {
        crypto_assets: cryptoAssets,
        investor_type: investorType,
        content_types: contentTypes,
        avatar_emoji: avatarEmoji,
      });
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, avatarEmoji }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={t.root}>
      <MeshBackground light={isLight} absolute />

      <button onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-xl transition-all"
        style={isLight
          ? { background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.1)', color: '#64748b', backdropFilter: 'blur(8px)' }
          : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)' }}>
        {isLight ? <Moon size={16} /> : <Sun size={16} />}
      </button>

      <div className="w-full max-w-lg relative z-10">

          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="rounded-2xl p-3.5" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 0 30px rgba(245,158,11,0.35)' }}>
              <TrendingUp size={28} style={{ color: isLight ? '#fff' : '#000' }} />
            </div>
            <p className="text-2xl font-bold tracking-tight" style={{ color: t.textTitle }}>CryptoAdvisor</p>
          </div>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all"
                  style={i < step ? t.stepDone : i === step ? t.stepActive : t.stepInactive}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-8 h-px" style={{ background: i < step ? '#F59E0B' : t.connectorInactive }} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="rounded-2xl overflow-hidden" style={t.card}>
            <div style={{ background: t.bar }} className={t.barH} />

            <div className="p-8">
              {/* Step header */}
              <div className="mb-7"
                style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(6px)' : 'translateY(0)', transition: 'opacity 0.18s, transform 0.18s' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: '#F59E0B' }}>
                    Step {step + 1} of {STEPS.length}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold" style={{ color: t.textTitle }}>{STEPS[step].title}</h2>
                <p className="text-sm mt-1" style={{ color: t.textSub }}>{STEPS[step].subtitle}</p>
              </div>

              {/* Step content */}
              <div style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(8px)' : 'translateY(0)', transition: 'opacity 0.18s, transform 0.18s' }}>

                {step === 0 && (
                  <div className="flex flex-wrap gap-2">
                    {CRYPTO_OPTIONS.map(coin => (
                      <Chip key={coin} label={coin} light={isLight}
                        selected={cryptoAssets.includes(coin)}
                        onClick={() => toggleMulti(setCryptoAssets, cryptoAssets, coin)} />
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <div className="flex flex-wrap gap-2">
                    {INVESTOR_TYPES.map(type => (
                      <Chip key={type} label={type} light={isLight}
                        selected={investorType === type}
                        onClick={() => setInvestorType(type)} />
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_TYPES.map(type => (
                      <Chip key={type} label={type} light={isLight}
                        selected={contentTypes.includes(type)}
                        onClick={() => toggleMulti(setContentTypes, contentTypes, type)} />
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-col items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.3)', boxShadow: '0 0 30px rgba(245,158,11,0.15)' }}>
                      {avatarEmoji}
                    </div>
                    <div className="grid grid-cols-8 gap-2 w-full">
                      {AVATARS.map(a => (
                        <button key={a.emoji} type="button" onClick={() => setAvatarEmoji(a.emoji)} title={a.label}
                          className="w-full aspect-square rounded-xl text-2xl flex items-center justify-center transition-all hover:scale-110"
                          style={{
                            background: avatarEmoji === a.emoji ? 'rgba(245,158,11,0.15)' : isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)',
                            outline: avatarEmoji === a.emoji ? '2px solid #F59E0B' : 'none',
                            outlineOffset: '2px',
                            transform: avatarEmoji === a.emoji ? 'scale(1.1)' : undefined,
                          }}>
                          {a.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-5 px-3 py-2.5 rounded-xl text-sm" style={isLight
                  ? { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }
                  : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              {/* Navigation */}
              <div className={`flex items-center mt-8 pt-5 ${step === 0 ? 'justify-end' : 'justify-between'}`}
                style={{ borderTop: `1px solid ${t.divider}` }}>
                {step > 0 && (
                  <button type="button" onClick={goPrev}
                    className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                    style={{ color: t.backColor }}
                    onMouseEnter={e => e.currentTarget.style.color = '#F59E0B'}
                    onMouseLeave={e => e.currentTarget.style.color = t.backColor}>
                    <ChevronLeft size={16} /> Back
                  </button>
                )}

                {step < STEPS.length - 1 ? (
                  <button type="button" onClick={goNext} disabled={!canAdvance()}
                    className="flex items-center gap-1.5 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-40"
                    style={{ background: '#F59E0B', color: '#030712' }}
                    onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = '#FBBF24')}
                    onMouseLeave={e => e.currentTarget.style.background = '#F59E0B'}>
                    Continue <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={loading}
                    className="flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-60"
                    style={{ background: '#F59E0B', color: '#030712' }}
                    onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = '#FBBF24')}
                    onMouseLeave={e => e.currentTarget.style.background = '#F59E0B'}>
                    {loading && <Loader2 size={15} className="animate-spin" />}
                    {loading ? 'Setting up…' : 'Go to dashboard →'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
