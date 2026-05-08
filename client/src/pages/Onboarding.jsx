import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Loader2 } from 'lucide-react';
import client from '../api/client';

const CRYPTO_OPTIONS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX'];
const INVESTOR_TYPES = ['HODLer', 'Day Trader', 'NFT Collector'];
const CONTENT_TYPES  = ['Market News', 'Charts', 'AI Insights', 'Memes'];
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

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
        selected
          ? 'bg-amber-400 border-amber-400 text-gray-950'
          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-amber-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [cryptoAssets, setCryptoAssets] = useState([]);
  const [investorType, setInvestorType]  = useState('');
  const [contentTypes, setContentTypes]  = useState([]);
  const [avatarEmoji, setAvatarEmoji]    = useState('🚀');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const toggleMulti = (setter, current, value) =>
    setter(current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cryptoAssets.length || !investorType || !contentTypes.length) {
      setError('Please complete all sections before continuing.');
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

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-400/6 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="bg-amber-400 rounded-2xl p-3.5 shadow-lg shadow-amber-400/20">
            <TrendingUp className="text-gray-950" size={30} />
          </div>
          <div className="text-center">
            <p className="text-white text-3xl font-bold tracking-tight">CryptoAdvisor</p>
            <p className="text-gray-500 text-sm mt-1">Let's personalise your experience</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white text-2xl font-semibold mb-1">Set up your profile</h2>
          <p className="text-gray-400 text-sm mb-8">Tell us about yourself so we can tailor your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Crypto Assets */}
            <div>
              <h3 className="text-white font-semibold mb-1">Which crypto assets interest you?</h3>
              <p className="text-gray-500 text-xs mb-3">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {CRYPTO_OPTIONS.map((coin) => (
                  <Chip key={coin} label={coin}
                    selected={cryptoAssets.includes(coin)}
                    onClick={() => toggleMulti(setCryptoAssets, cryptoAssets, coin)} />
                ))}
              </div>
            </div>

            {/* Investor Type */}
            <div>
              <h3 className="text-white font-semibold mb-1">What type of investor are you?</h3>
              <p className="text-gray-500 text-xs mb-3">Pick one</p>
              <div className="flex flex-wrap gap-2">
                {INVESTOR_TYPES.map((type) => (
                  <Chip key={type} label={type}
                    selected={investorType === type}
                    onClick={() => setInvestorType(type)} />
                ))}
              </div>
            </div>

            {/* Content Types */}
            <div>
              <h3 className="text-white font-semibold mb-1">What content would you like to see?</h3>
              <p className="text-gray-500 text-xs mb-3">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map((type) => (
                  <Chip key={type} label={type}
                    selected={contentTypes.includes(type)}
                    onClick={() => toggleMulti(setContentTypes, contentTypes, type)} />
                ))}
              </div>
            </div>

            {/* Avatar */}
            <div>
              <h3 className="text-white font-semibold mb-1">Pick your avatar</h3>
              <p className="text-gray-500 text-xs mb-4">This will appear in your dashboard header</p>
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-4xl flex-shrink-0">
                  {avatarEmoji}
                </div>
                <div className="grid grid-cols-6 gap-2 flex-1">
                  {AVATARS.map((a) => (
                    <button key={a.emoji} type="button" onClick={() => setAvatarEmoji(a.emoji)}
                      title={a.label}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110 ${
                        avatarEmoji === a.emoji
                          ? 'bg-amber-400/20 ring-2 ring-amber-400 scale-110'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}>
                      {a.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Saving…' : 'Go to my dashboard →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
