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
    if (role === 'student') { setEmail('rahul.sharma@example.com'); setPassword('student123'); }
    if (role === 'company') { setEmail('hr@technova.com'); setPassword('company123'); }
    if (role === 'admin') { setEmail('admin@mca.gov.in'); setPassword('admin123'); }
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="max-w-md mx-auto px-5 pt-16">
        <h1 className="font-display text-3xl text-navy-800 mb-1">Sign in</h1>
        <p className="text-navy-500 text-sm mb-8">Access your allocation dashboard.</p>

        <form onSubmit={handleSubmit} className="stub-card p-6 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2">{error}</div>}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>

        <div className="mt-4 text-xs text-navy-400 flex flex-wrap gap-2 items-center">
          Try a demo:
          <button onClick={() => fill('student')} className="chip hover:bg-navy-100">Student</button>
          <button onClick={() => fill('company')} className="chip hover:bg-navy-100">Company</button>
          <button onClick={() => fill('admin')} className="chip hover:bg-navy-100">Admin</button>
        </div>

        <p className="mt-6 text-sm text-navy-500">
          No account yet? <Link to="/register" className="text-navy-700 font-medium underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
