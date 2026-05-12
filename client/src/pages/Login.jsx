import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Loader2 } from 'lucide-react';
import client from '../api/client';
import MeshBackground from '../components/MeshBackground';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isLight = document.documentElement.classList.contains('light');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const cardBg   = isLight ? 'rgba(255,255,255,0.85)' : 'rgba(6,6,16,0.82)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const textPrimary = isLight ? '#0f172a' : '#fff';
  const textSecondary = isLight ? '#64748b' : 'rgba(255,255,255,0.45)';
  const inputBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
  const inputBorder = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)';

  return (
    <>
      <MeshBackground light={isLight} />

      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="w-full max-w-md relative z-10">

          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-10">
            <div className="rounded-2xl p-3.5" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 0 30px rgba(245,158,11,0.35)' }}>
              <TrendingUp size={28} className="text-black" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold tracking-tight" style={{ color: textPrimary }}>CryptoAdvisor</p>
              <p className="text-sm mt-1" style={{ color: textSecondary }}>Your AI-powered crypto companion</p>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: `1px solid ${cardBorder}`, boxShadow: '0 0 60px rgba(245,158,11,0.08), 0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ background: 'linear-gradient(90deg, #F59E0B, #F59E0B55)' }} className="h-[2px]" />
            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-1" style={{ color: textPrimary }}>Welcome back</h2>
              <p className="text-sm mb-7" style={{ color: textSecondary }}>Sign in to your dashboard</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: textSecondary }}>Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                    style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                    onFocus={e => e.target.style.borderColor = '#F59E0B'}
                    onBlur={e => e.target.style.borderColor = inputBorder}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: textSecondary }}>Password</label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                    style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                    onFocus={e => e.target.style.borderColor = '#F59E0B'}
                    onBlur={e => e.target.style.borderColor = inputBorder}
                  />
                </div>

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs transition-colors hover:text-amber-400"
                    style={{ color: textSecondary }}>
                    Forgot password?
                  </Link>
                </div>

                {error && (
                  <div className="px-3 py-2.5 rounded-xl text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                  style={{ background: '#F59E0B', color: '#030712' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FBBF24'}
                  onMouseLeave={e => e.currentTarget.style.background = '#F59E0B'}>
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <p className="text-sm text-center mt-6" style={{ color: textSecondary }}>
                Don't have an account?{' '}
                <Link to="/signup" className="text-amber-400 hover:underline font-medium">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
