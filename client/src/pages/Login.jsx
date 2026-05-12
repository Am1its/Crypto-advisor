import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Loader2, Sun, Moon } from 'lucide-react';
import client from '../api/client';
import MeshBackground from '../components/MeshBackground';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
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

  const ThemeToggle = () => (
    <button onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-2.5 rounded-xl transition-all"
      style={isLight
        ? { background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.1)', color: '#64748b', backdropFilter: 'blur(8px)' }
        : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)' }}>
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );

  if (isLight) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10">
        <MeshBackground light absolute />
        <ThemeToggle />
        <div className="w-full max-w-xl relative z-10">
          <div className="flex flex-col items-center gap-3 mb-10">
            <div className="rounded-2xl p-4 shadow-lg" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', boxShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
              <TrendingUp size={32} className="text-white" />
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold tracking-tight text-slate-900">CryptoAdvisor</p>
              <p className="text-sm mt-1.5 text-slate-500">Your AI-powered crypto companion</p>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ background: 'linear-gradient(90deg,#F59E0B,#FBBF24)' }} className="h-[3px]" />
            <div className="p-10">
              <h2 className="text-3xl font-bold mb-1.5 text-slate-900">Welcome back</h2>
              <p className="text-sm mb-8 text-slate-500">Sign in to your dashboard</p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="you@example.com" required
                    className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-all text-slate-900 placeholder-slate-400"
                    style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                    onFocus={e => e.target.style.borderColor = '#F59E0B'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Password</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange}
                    placeholder="••••••••" required
                    className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-all text-slate-900 placeholder-slate-400"
                    style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                    onFocus={e => e.target.style.borderColor = '#F59E0B'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs text-slate-400 hover:text-amber-500 transition-colors">Forgot password?</Link>
                </div>
                {error && <div className="px-3 py-2.5 rounded-xl text-sm text-red-600" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>{error}</div>}
                <button type="submit" disabled={loading}
                  className="w-full font-semibold rounded-xl py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity mt-2 text-white"
                  style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}>
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
              <p className="text-sm text-center mt-7 text-slate-500">
                Don't have an account?{' '}
                <Link to="/signup" className="text-amber-500 hover:text-amber-600 font-semibold">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10"
      style={{ background: '#04040a' }}>
      <MeshBackground absolute />
      <ThemeToggle />
      <div className="w-full max-w-xl relative z-10">
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', boxShadow: '0 0 30px rgba(245,158,11,0.35)' }}>
            <TrendingUp size={32} className="text-black" />
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold tracking-tight text-white">CryptoAdvisor</p>
            <p className="text-sm mt-1.5 text-white/40">Your AI-powered crypto companion</p>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(6,6,16,0.82)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 0 60px rgba(245,158,11,0.08), 0 25px 50px rgba(0,0,0,0.25)' }}>
          <div style={{ background: 'linear-gradient(90deg,#F59E0B,#F59E0B55)' }} className="h-[2px]" />
          <div className="p-10">
            <h2 className="text-3xl font-semibold mb-1.5 text-white">Welcome back</h2>
            <p className="text-sm mb-8 text-white/40">Sign in to your dashboard</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm mb-1.5 text-white/50">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" required
                  className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-all text-white placeholder-white/20"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => e.target.style.borderColor = '#F59E0B'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div>
                <label className="block text-sm mb-1.5 text-white/50">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  placeholder="••••••••" required
                  className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-all text-white placeholder-white/20"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => e.target.style.borderColor = '#F59E0B'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-white/30 hover:text-amber-400 transition-colors">Forgot password?</Link>
              </div>
              {error && <div className="px-3 py-2.5 rounded-xl text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full font-semibold rounded-xl py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-60 mt-2 text-[#030712]"
                style={{ background: '#F59E0B' }}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="text-sm text-center mt-7 text-white/40">
              Don't have an account?{' '}
              <Link to="/signup" className="text-amber-400 hover:underline font-medium">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
