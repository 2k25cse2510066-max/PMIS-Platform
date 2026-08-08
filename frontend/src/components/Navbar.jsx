import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Notification Preferences State (saved locally)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    const raw = localStorage.getItem('pmis_notif_prefs');
    return raw ? JSON.parse(raw) : { appStatus: true, newApps: true, general: true };
  });

  const notifRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (user) {
      api.get('/auth/notifications')
        .then((r) => {
          setNotifications(r.data);
          setUnreadCount(r.data.length);
        })
        .catch(() => {});
    }
  }, [user]);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleNotifPref(key) {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    localStorage.setItem('pmis_notif_prefs', JSON.stringify(updated));
  }

  function handleProfileClick() {
    setShowSettings(false);
    if (!user) return navigate('/login');
    if (user.role === 'student') navigate('/student');
    else if (user.role === 'company') navigate('/company');
    else navigate('/admin');
  }

  return (
    <>
      <header className="border-b border-navy-100 dark:border-navy-800 bg-white/90 dark:bg-navy-900/90 backdrop-blur sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-8 h-8 rounded-full bg-navy-600 dark:bg-navy-500 text-white flex items-center justify-center font-display text-sm font-bold shadow-sm">
              PM
            </span>
            <div className="leading-tight">
              <div className="font-display font-semibold text-navy-800 dark:text-navy-100 text-[15px]">
                PM Internship Scheme
              </div>
              <div className="text-[10px] tracking-widest uppercase text-navy-400 dark:text-navy-400 hidden xs:block">
                Smart Allocation Portal
              </div>
            </div>
          </Link>

          {/* Right Action Icons & Auth Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 1. NOTIFICATION ICON 🔔 (if logged in) */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setShowNotifs(!showNotifs);
                    setShowSettings(false);
                  }}
                  className="relative p-2 rounded-xl text-navy-600 dark:text-navy-300 hover:text-navy-800 dark:hover:text-white hover:bg-navy-50 dark:hover:bg-navy-800 focus:outline-none transition-all"
                  title="Notifications"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-saffron-500 rounded-full ring-2 ring-white dark:ring-navy-900" />
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-navy-900 rounded-2xl shadow-xl border border-navy-100 dark:border-navy-800 p-4 z-40 space-y-3">
                    <div className="font-display font-semibold text-sm text-navy-800 dark:text-navy-100 border-b border-navy-100 dark:border-navy-800 pb-2 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-saffron-100 dark:bg-saffron-950 text-saffron-700 dark:text-saffron-300 text-[11px] font-mono px-2 py-0.5 rounded-full font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => setUnreadCount(0)}
                          className="text-[11px] text-navy-500 dark:text-navy-400 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-navy-400 dark:text-navy-500 space-y-1">
                          <p className="text-2xl">🔔</p>
                          <p className="text-xs">No notifications yet.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className="p-2.5 rounded-xl bg-navy-50/70 dark:bg-navy-800/60 border border-navy-100/60 dark:border-navy-700/60 text-xs text-navy-700 dark:text-navy-200 space-y-1 transition-all hover:bg-navy-50 dark:hover:bg-navy-800"
                          >
                            <p className="leading-snug">{n.message}</p>
                            <div className="text-[10px] font-mono text-navy-400 dark:text-navy-400">
                              {new Date(n.created_at).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. SETTINGS ICON ⚙️ */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowNotifs(false);
                }}
                className="p-2 rounded-xl text-navy-600 dark:text-navy-300 hover:text-navy-800 dark:hover:text-white hover:bg-navy-50 dark:hover:bg-navy-800 focus:outline-none transition-all"
                title="Settings"
                aria-label="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Settings Dropdown Panel */}
              {showSettings && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-navy-900 rounded-2xl shadow-xl border border-navy-100 dark:border-navy-800 p-4 z-40 space-y-4">
                  <div className="font-display font-semibold text-sm text-navy-800 dark:text-navy-100 border-b border-navy-100 dark:border-navy-800 pb-2 flex justify-between items-center">
                    <span>Preferences & Settings</span>
                    <span className="text-xs text-navy-400 dark:text-navy-500 font-mono">⚙️</span>
                  </div>

                  {/* APPEARANCE SECTION */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy-500 dark:text-navy-400 block">
                      Appearance
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-navy-50 dark:bg-navy-950 rounded-xl border border-navy-100 dark:border-navy-800">
                      <button
                        onClick={() => setTheme('light')}
                        className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                          theme === 'light'
                            ? 'bg-white text-navy-800 shadow-sm border border-navy-200'
                            : 'text-navy-600 dark:text-navy-400 hover:text-navy-800'
                        }`}
                      >
                        <span>☀️</span> Light
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                          theme === 'dark'
                            ? 'bg-navy-800 text-white shadow-sm border border-navy-700'
                            : 'text-navy-600 dark:text-navy-400 hover:text-navy-800 dark:hover:text-navy-100'
                        }`}
                      >
                        <span>🌙</span> Dark
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                          theme === 'system'
                            ? 'bg-navy-600 text-white shadow-sm'
                            : 'text-navy-600 dark:text-navy-400 hover:text-navy-800 dark:hover:text-navy-100'
                        }`}
                      >
                        <span>💻</span> System
                      </button>
                    </div>
                  </div>

                  {/* NOTIFICATIONS SECTION */}
                  <div className="space-y-2 border-t border-navy-100 dark:border-navy-800 pt-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy-500 dark:text-navy-400 block">
                      Notifications
                    </label>
                    <div className="space-y-2 text-xs text-navy-700 dark:text-navy-200">
                      <label className="flex items-center justify-between cursor-pointer hover:opacity-90">
                        <span>Application status notifications</span>
                        <input
                          type="checkbox"
                          checked={notifPrefs.appStatus}
                          onChange={() => toggleNotifPref('appStatus')}
                          className="w-4 h-4 rounded text-navy-600 focus:ring-navy-500 border-navy-300 dark:border-navy-700"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer hover:opacity-90">
                        <span>New application notifications</span>
                        <input
                          type="checkbox"
                          checked={notifPrefs.newApps}
                          onChange={() => toggleNotifPref('newApps')}
                          className="w-4 h-4 rounded text-navy-600 focus:ring-navy-500 border-navy-300 dark:border-navy-700"
                        />
                      </label>
                    </div>
                  </div>

                  {/* ACCOUNT SECTION */}
                  <div className="space-y-2 border-t border-navy-100 dark:border-navy-800 pt-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy-500 dark:text-navy-400 block">
                      Account
                    </label>
                    <div className="space-y-1 text-xs">
                      <button
                        onClick={handleProfileClick}
                        className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-navy-50 dark:hover:bg-navy-800 text-navy-700 dark:text-navy-200 font-medium flex items-center justify-between"
                      >
                        <span>Profile & Details</span>
                        <span className="text-navy-400">→</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowSettings(false);
                          setShowPasswordModal(true);
                        }}
                        className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-navy-50 dark:hover:bg-navy-800 text-navy-700 dark:text-navy-200 font-medium flex items-center justify-between"
                      >
                        <span>Change Password</span>
                        <span className="text-[10px] text-saffron-600 dark:text-saffron-400 font-mono bg-saffron-50 dark:bg-saffron-950 px-1.5 py-0.5 rounded">
                          Managed
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. USER INFO & SIGN OUT BUTTONS */}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-navy-600 dark:text-navy-300 hidden md:inline font-medium">
                  {user.name || user.email}
                  <span className="chip ml-2 capitalize font-mono text-xs">{user.role}</span>
                </span>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="btn-secondary !px-3.5 !py-1.5 text-sm"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login" className="btn-secondary !px-3.5 !py-1.5 text-sm">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary !px-3.5 !py-1.5 text-sm">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-navy-800 dark:text-navy-100 border border-navy-100 dark:border-navy-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-navy-100 dark:border-navy-800 pb-3">
              <h3 className="font-display font-bold text-lg">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-navy-400 hover:text-navy-600 text-xl font-bold">×</button>
            </div>
            <div className="p-3 bg-navy-50 dark:bg-navy-950 rounded-xl text-xs text-navy-600 dark:text-navy-300 space-y-1">
              <p className="font-semibold">Security Note:</p>
              <p>Account credentials for the PM Internship Scheme are managed via secure single sign-on or system administrator authorization.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Current Password</label>
                <input className="input text-xs" type="password" placeholder="••••••••" disabled />
              </div>
              <div>
                <label className="label">New Password</label>
                <input className="input text-xs" type="password" placeholder="••••••••" disabled />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setShowPasswordModal(false)} className="btn-secondary text-xs !py-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
