import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TrendingUp, Loader2, CheckCircle } from 'lucide-react';
import client from '../api/client';

export default function ResetPassword() {
  const { token }             = useParams();
  const navigate              = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 6)  return setError('Password must be at least 6 characters');
    setLoading(true); setError('');
    try {
      await client.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired link');
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
          {done ? (
            <div className="text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="text-green-400" size={28} />
              </div>
              <div>
                <h1 className="text-white text-xl font-semibold mb-1">Password updated!</h1>
                <p className="text-gray-400 text-sm">Redirecting you to login…</p>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-white text-2xl font-semibold mb-1">Set new password</h1>
              <p className="text-gray-400 text-sm mb-6">Choose a strong password for your account.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">New password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Confirm password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button type="submit" disabled={loading}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>

              <p className="text-gray-400 text-sm text-center mt-6">
                <Link to="/login" className="text-amber-400 hover:underline">Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
