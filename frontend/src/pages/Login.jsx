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
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-navy-950 text-navy-800 dark:text-navy-100 transition-colors duration-200">
      <Navbar />
      <div className="max-w-md mx-auto px-5 pt-16 pb-12">
        <h1 className="font-display text-3xl font-bold text-navy-800 dark:text-navy-100 mb-1">Sign in</h1>
        <p className="text-navy-500 dark:text-navy-400 text-sm mb-8">Access your allocation dashboard.</p>

        <form onSubmit={handleSubmit} className="stub-card p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-card px-3 py-2">
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
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* DEMO BUTTONS WITH CLEAR ACTIVE STYLING */}
        <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-navy-900 border border-navy-100/90 dark:border-navy-800/90 shadow-sm space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-navy-500 dark:text-navy-400 flex items-center justify-between">
            <span>Try a demo account</span>
            <span className="font-mono text-[10px] text-navy-400">One-click auto-fill</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fill('student')}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                activeDemo === 'student'
                  ? 'bg-navy-800 dark:bg-navy-600 text-white shadow-md ring-2 ring-navy-600 dark:ring-navy-400'
                  : 'bg-white dark:bg-navy-800/60 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-700 hover:bg-navy-50 dark:hover:bg-navy-800'
              }`}
            >
              <span>🎓 Student</span>
              {activeDemo === 'student' && (
                <span className="text-[9px] font-mono tracking-wider font-bold uppercase text-saffron-300">
                  ACTIVE
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => fill('company')}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                activeDemo === 'company'
                  ? 'bg-navy-800 dark:bg-navy-600 text-white shadow-md ring-2 ring-navy-600 dark:ring-navy-400'
                  : 'bg-white dark:bg-navy-800/60 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-700 hover:bg-navy-50 dark:hover:bg-navy-800'
              }`}
            >
              <span>🏢 Company</span>
              {activeDemo === 'company' && (
                <span className="text-[9px] font-mono tracking-wider font-bold uppercase text-saffron-300">
                  ACTIVE
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => fill('admin')}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                activeDemo === 'admin'
                  ? 'bg-navy-800 dark:bg-navy-600 text-white shadow-md ring-2 ring-navy-600 dark:ring-navy-400'
                  : 'bg-white dark:bg-navy-800/60 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-700 hover:bg-navy-50 dark:hover:bg-navy-800'
              }`}
            >
              <span>🏛️ Admin</span>
              {activeDemo === 'admin' && (
                <span className="text-[9px] font-mono tracking-wider font-bold uppercase text-saffron-300">
                  ACTIVE
                </span>
              )}
            </button>
          </div>
        </div>

        <p className="mt-6 text-sm text-navy-500 dark:text-navy-400 text-center">
          No account yet?{' '}
          <Link to="/register" className="text-navy-700 dark:text-navy-200 font-semibold underline hover:text-navy-900 dark:hover:text-white">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
