import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/auth/notifications')
        .then((r) => setNotifications(r.data))
        .catch(() => {});
    }
  }, [user]);

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
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 text-navy-600 hover:text-navy-800 focus:outline-none"
                title="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-saffron-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-card shadow-lg border border-navy-100 p-3 z-30 space-y-2">
                  <div className="font-display font-semibold text-sm text-navy-800 border-b pb-2 flex justify-between items-center">
                    <span>Notifications</span>
                    <span className="text-xs font-mono text-navy-400">{notifications.length} recent</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 divide-y divide-navy-50">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-navy-400 text-center py-3">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="pt-2 text-xs text-navy-600">
                          <p>{n.message}</p>
                          <span className="text-[10px] text-navy-400">{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
