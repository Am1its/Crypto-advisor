import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import client from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await client.post('/auth/forgot-password', { email });
      setSent(true);
      if (data.resetUrl) setResetUrl(data.resetUrl); // demo mode
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <TrendingUp className="text-amber-400" size={28} />
          <span className="text-white text-2xl font-bold">CryptoAdvisor</span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {sent ? (
            <div className="text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-amber-400/10 flex items-center justify-center">
                <MailCheck className="text-amber-400" size={28} />
              </div>
              <div>
                <h1 className="text-white text-xl font-semibold mb-1">Check your inbox</h1>
                <p className="text-gray-400 text-sm">
                  If <span className="text-white">{email}</span> exists in our system,
                  a reset link has been sent.
                </p>
              </div>

              {resetUrl && (
                <div className="w-full bg-amber-400/10 border border-amber-400/20 rounded-xl p-4 text-left">
                  <p className="text-amber-400 text-xs font-semibold mb-2">Demo mode — no email configured</p>
                  <p className="text-gray-400 text-xs mb-2">Click the link below to reset your password:</p>
                  <Link to={resetUrl.replace(window.location.origin, '')}
                    className="text-amber-400 text-xs break-all hover:underline">
                    {resetUrl}
                  </Link>
                </div>
              )}

              <Link to="/login" className="text-gray-400 text-sm hover:text-white transition-colors flex items-center gap-1.5 mt-2">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-white text-2xl font-semibold mb-1">Forgot password?</h1>
              <p className="text-gray-400 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button type="submit" disabled={loading}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <Link to="/login" className="text-gray-400 text-sm hover:text-white transition-colors flex items-center gap-1.5 mt-6 justify-center">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
