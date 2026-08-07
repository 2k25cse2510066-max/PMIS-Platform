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
      navigate(user.role === 'student' ? '/student' : user.role === 'company' ? '/company' : '/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="max-w-md mx-auto px-5 pt-16 pb-16">
        <h1 className="font-display text-3xl text-navy-800 mb-1">Create an account</h1>
        <p className="text-navy-500 text-sm mb-8">Choose how you'll use the platform.</p>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {['student', 'company', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-card border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                role === r ? 'border-navy-600 bg-navy-600 text-white' : 'border-navy-200 text-navy-600 hover:bg-navy-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="stub-card p-6 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2">{error}</div>}
          <div>
            <label className="label">{role === 'company' ? 'Company name' : 'Full name'}</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder={role === 'company' ? 'TechNova Solutions' : 'Priya Verma'} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          {role === 'company' && (
            <p className="text-xs text-navy-400">Companies must be verified by an MCA admin before they can post internships.</p>
          )}
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</button>
        </form>

        <p className="mt-6 text-sm text-navy-500">
          Already registered? <Link to="/login" className="text-navy-700 font-medium underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
