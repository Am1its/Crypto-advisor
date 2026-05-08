import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/auth/register', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Account created! Welcome aboard.');
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-400/6 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="bg-amber-400 rounded-2xl p-3.5 shadow-lg shadow-amber-400/20">
            <TrendingUp className="text-gray-950" size={30} />
          </div>
          <div className="text-center">
            <p className="text-white text-3xl font-bold tracking-tight">CryptoAdvisor</p>
            <p className="text-gray-500 text-sm mt-1">Your AI-powered crypto companion</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white text-2xl font-semibold mb-1">Create an account</h2>
          <p className="text-gray-400 text-sm mb-7">Start your personalized crypto journey</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1.5">Full name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Satoshi Nakamoto"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-gray-400 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-400 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
