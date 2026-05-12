import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react';
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

function Chip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="px-4 py-2 rounded-full text-sm font-medium border transition-all"
      style={{
        background: selected ? '#F59E0B' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${selected ? '#F59E0B' : 'rgba(255,255,255,0.1)'}`,
        color: selected ? '#030712' : 'rgba(255,255,255,0.7)',
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
  const isLight = document.documentElement.classList.contains('light');

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

  const cardBg      = isLight ? 'rgba(255,255,255,0.85)' : 'rgba(6,6,16,0.82)';
  const cardBorder  = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const textPrimary = isLight ? '#0f172a' : '#fff';
  const textSecondary = isLight ? '#64748b' : 'rgba(255,255,255,0.45)';
  const divider     = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';

  return (
    <>
      <MeshBackground light={isLight} />

      <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden">
        <div className="w-full max-w-lg relative z-10">

          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="rounded-2xl p-3.5" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 0 30px rgba(245,158,11,0.35)' }}>
              <TrendingUp size={28} className="text-black" />
            </div>
            <p className="text-2xl font-bold tracking-tight" style={{ color: textPrimary }}>CryptoAdvisor</p>
          </div>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: i < step ? '#F59E0B' : i === step ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${i <= step ? '#F59E0B' : 'rgba(255,255,255,0.1)'}`,
                    color: i < step ? '#030712' : i === step ? '#F59E0B' : 'rgba(255,255,255,0.3)',
                  }}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-8 h-px" style={{ background: i < step ? '#F59E0B' : 'rgba(255,255,255,0.08)' }} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: `1px solid ${cardBorder}`, boxShadow: '0 0 60px rgba(245,158,11,0.08), 0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ background: 'linear-gradient(90deg, #F59E0B, #F59E0B55)' }} className="h-[2px]" />

            <div className="p-8">
              {/* Step header */}
              <div className="mb-7"
                style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(6px)' : 'translateY(0)', transition: 'opacity 0.18s, transform 0.18s' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: '#F59E0B' }}>
                    Step {step + 1} of {STEPS.length}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold" style={{ color: textPrimary }}>{STEPS[step].title}</h2>
                <p className="text-sm mt-1" style={{ color: textSecondary }}>{STEPS[step].subtitle}</p>
              </div>

              {/* Step content */}
              <div style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(8px)' : 'translateY(0)', transition: 'opacity 0.18s, transform 0.18s' }}>

                {step === 0 && (
                  <div className="flex flex-wrap gap-2">
                    {CRYPTO_OPTIONS.map(coin => (
                      <Chip key={coin} label={coin}
                        selected={cryptoAssets.includes(coin)}
                        onClick={() => toggleMulti(setCryptoAssets, cryptoAssets, coin)} />
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <div className="flex flex-wrap gap-2">
                    {INVESTOR_TYPES.map(type => (
                      <Chip key={type} label={type}
                        selected={investorType === type}
                        onClick={() => setInvestorType(type)} />
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_TYPES.map(type => (
                      <Chip key={type} label={type}
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
                            background: avatarEmoji === a.emoji ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
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
                <div className="mt-5 px-3 py-2.5 rounded-xl text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              {/* Navigation */}
              <div className={`flex items-center mt-8 pt-5 ${step === 0 ? 'justify-end' : 'justify-between'}`}
                style={{ borderTop: `1px solid ${divider}` }}>
                {step > 0 && (
                  <button type="button" onClick={goPrev}
                    className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                    style={{ color: textSecondary }}
                    onMouseEnter={e => e.currentTarget.style.color = '#F59E0B'}
                    onMouseLeave={e => e.currentTarget.style.color = textSecondary}>
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
    </>
  );
}
