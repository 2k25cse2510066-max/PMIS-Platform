import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(email, password, role, name);
      sessionStorage.setItem('pmis_is_new_user', 'true');
      const target = user.role === 'student' ? '/student' : user.role === 'company' ? '/company' : '/admin';
      navigate(target, { state: { isNewUser: true } });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />
      <div className="max-w-md mx-auto px-5 pt-16 pb-16 flex flex-col justify-center">
        <div className="glass-panel p-8 space-y-6 border-slate-200/90 dark:border-white/20">
          <div className="flex flex-col items-center text-center">
            <img src="/logo.png" alt="PMIS" className="w-16 h-16 object-contain mb-3 drop-shadow-md" />
            <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white mb-1">Create an Account</h1>
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium">Choose how you'll use the platform.</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['student', 'company', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-xl border px-3 py-2.5 text-xs font-bold capitalize transition-all ${
                  role === r
                    ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 dark:from-blue-600 dark:via-indigo-600 dark:to-purple-600 text-white shadow-lg shadow-orange-500/20 dark:shadow-indigo-500/30 border-white/20'
                    : 'bg-white dark:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-white/15 hover:bg-slate-200/60 dark:hover:bg-white/20'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-xs text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2 font-semibold">{error}</div>}
            <div>
              <label className="label">{role === 'company' ? 'Company Name' : 'Full Name'}</label>
              <input className="input text-xs" required value={name} onChange={(e) => setName(e.target.value)} placeholder={role === 'company' ? 'TechNova Solutions' : 'Priya Verma'} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input text-xs" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input text-xs" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            {role === 'company' && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Companies must be verified by an MCA admin before posting internships.</p>
            )}
            <button className="btn-primary w-full !py-3 text-xs font-bold" disabled={loading}>{loading ? 'Creating Account…' : 'Create Account'}</button>
          </form>

          <p className="text-xs text-slate-600 dark:text-slate-300 text-center font-medium">
            Already registered?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-300 font-bold underline hover:text-indigo-800 dark:hover:text-white">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
