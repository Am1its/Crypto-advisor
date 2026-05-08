import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Loader2 } from 'lucide-react';
import client from '../api/client';

const CRYPTO_OPTIONS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX'];
const INVESTOR_TYPES = ['HODLer', 'Day Trader', 'NFT Collector'];
const CONTENT_TYPES = ['Market News', 'Charts', 'AI Insights', 'Memes'];

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
  const [investorType, setInvestorType] = useState('');
  const [contentTypes, setContentTypes] = useState([]);
  const [error, setError] = useState('');
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
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          <TrendingUp className="text-amber-400" size={28} />
          <span className="text-white text-2xl font-bold">CryptoAdvisor</span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-white text-2xl font-semibold mb-1">Set up your profile</h1>
          <p className="text-gray-400 text-sm mb-8">Tell us about yourself so we can tailor your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Crypto Assets */}
            <div>
              <h2 className="text-white font-medium mb-1">Which crypto assets interest you?</h2>
              <p className="text-gray-500 text-xs mb-3">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {CRYPTO_OPTIONS.map((coin) => (
                  <Chip
                    key={coin}
                    label={coin}
                    selected={cryptoAssets.includes(coin)}
                    onClick={() => toggleMulti(setCryptoAssets, cryptoAssets, coin)}
                  />
                ))}
              </div>
            </div>

            {/* Investor Type */}
            <div>
              <h2 className="text-white font-medium mb-1">What type of investor are you?</h2>
              <p className="text-gray-500 text-xs mb-3">Pick one</p>
              <div className="flex flex-wrap gap-2">
                {INVESTOR_TYPES.map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    selected={investorType === type}
                    onClick={() => setInvestorType(type)}
                  />
                ))}
              </div>
            </div>

            {/* Content Types */}
            <div>
              <h2 className="text-white font-medium mb-1">What content would you like to see?</h2>
              <p className="text-gray-500 text-xs mb-3">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    selected={contentTypes.includes(type)}
                    onClick={() => toggleMulti(setContentTypes, contentTypes, type)}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
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
