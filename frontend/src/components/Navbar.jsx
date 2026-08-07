import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-navy-100 bg-white/90 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-navy-600 text-white flex items-center justify-center font-display text-sm">PM</span>
          <div className="leading-tight">
            <div className="font-display font-semibold text-navy-800 text-[15px]">PM Internship Scheme</div>
            <div className="text-[10px] tracking-widest uppercase text-navy-400">Smart Allocation Portal</div>
          </div>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-navy-500 hidden sm:inline">
              {user.name || user.email} <span className="chip ml-2 capitalize">{user.role}</span>
            </span>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="btn-secondary !px-3.5 !py-1.5 text-sm"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary !px-4 !py-1.5 text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary !px-4 !py-1.5 text-sm">Register</Link>
          </div>
        )}
      </div>
    </header>
  );
}
