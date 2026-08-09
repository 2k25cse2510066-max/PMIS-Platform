import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      sessionStorage.removeItem('pmis_is_new_user');
      const user = await login(email, password);
      navigate(user.role === 'student' ? '/student' : user.role === 'company' ? '/company' : '/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not sign in');
    } finally {
      setLoading(false);
    }
  }

  function fill(role) {
    setActiveDemo(role);
    if (role === 'student') { setEmail('rahul.sharma@example.com'); setPassword('student123'); }
    if (role === 'company') { setEmail('hr@technova.com'); setPassword('company123'); }
    if (role === 'admin') { setEmail('admin@mca.gov.in'); setPassword('admin123'); }
  }

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />
      <div className="max-w-md mx-auto px-5 pt-16 pb-16 flex flex-col justify-center">
        {/* Centered Glass Card */}
        <div className="glass-panel p-8 space-y-6 border-slate-200/90 dark:border-white/20">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white mb-1">Sign in</h1>
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium">Access your allocation dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-xs text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2 font-semibold">
                {error}
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setActiveDemo(null);
                }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setActiveDemo(null);
                }}
                placeholder="••••••••"
              />
            </div>
            <button className="btn-primary w-full !py-3 font-bold" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* DEMO ROLE BUTTONS WITH BLUE/PURPLE GRADIENT ACTIVE STATE */}
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between font-mono">
              <span>Try a Demo Account</span>
              <span className="text-indigo-600 dark:text-indigo-400">One-click auto-fill</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fill('student')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                  activeDemo === 'student'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 border border-white/20'
                    : 'bg-white dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/15 hover:bg-slate-200/60 dark:hover:bg-white/20'
                }`}
              >
                <span>🎓 Student</span>
                {activeDemo === 'student' && (
                  <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase text-amber-300">
                    ACTIVE
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => fill('company')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                  activeDemo === 'company'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 border border-white/20'
                    : 'bg-white dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/15 hover:bg-slate-200/60 dark:hover:bg-white/20'
                }`}
              >
                <span>🏢 Company</span>
                {activeDemo === 'company' && (
                  <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase text-amber-300">
                    ACTIVE
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => fill('admin')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                  activeDemo === 'admin'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 border border-white/20'
                    : 'bg-white dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/15 hover:bg-slate-200/60 dark:hover:bg-white/20'
                }`}
              >
                <span>🏛️ Admin</span>
                {activeDemo === 'admin' && (
                  <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase text-amber-300">
                    ACTIVE
                  </span>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 text-center font-medium">
            No account yet?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-300 font-bold underline hover:text-indigo-800 dark:hover:text-white">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
