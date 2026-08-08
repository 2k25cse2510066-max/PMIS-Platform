import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';

export default function Navbar({ onToggleSidebar, search, onSearchChange }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

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

  const initial = user?.name ? user.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U';

  return (
    <>
      <header className="glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Left Brand & Mobile Sidebar Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 lg:hidden"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-display text-sm font-extrabold shadow-md shadow-indigo-500/30">
                PM
              </div>
              <div className="leading-tight hidden sm:block">
                <div className="font-display font-bold text-slate-800 dark:text-white text-[15px] tracking-tight">
                  PM Internship Scheme
                </div>
                <div className="text-[9px] tracking-widest uppercase font-mono text-indigo-500 dark:text-indigo-400 font-semibold">
                  Smart Allocation Portal
                </div>
              </div>
            </Link>
          </div>

          {/* Search Bar Input */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search || ''}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                placeholder="Search internships, skills, companies..."
                className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/[0.06] text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 1. NOTIFICATIONS 🔔 */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setShowNotifs(!showNotifs);
                    setShowSettings(false);
                  }}
                  className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                  title="Notifications"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 px-1 min-w-[16px] h-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center border border-white dark:border-[#0C0A1D]">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel p-4 z-50 space-y-3">
                    <div className="font-display font-semibold text-sm text-slate-800 dark:text-white border-b border-slate-200/60 dark:border-white/10 pb-2 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-indigo-500/20 text-indigo-400 text-[11px] font-mono px-2 py-0.5 rounded-full font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => setUnreadCount(0)}
                          className="text-[11px] text-slate-400 hover:text-indigo-400 underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 space-y-1">
                          <p className="text-2xl">🔔</p>
                          <p className="text-xs">No notifications yet.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/50 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 space-y-1 transition-all hover:bg-slate-200/60 dark:hover:bg-white/10"
                          >
                            <p className="leading-snug">{n.message}</p>
                            <div className="text-[10px] font-mono text-slate-400">
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

            {/* 2. DIRECT THEME TOGGLE ☀️/🌙 */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* 3. SETTINGS ICON ⚙️ */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowNotifs(false);
                }}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Settings Dropdown */}
              {showSettings && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 glass-panel p-4 z-50 space-y-4">
                  <div className="font-display font-semibold text-sm text-slate-800 dark:text-white border-b border-slate-200/60 dark:border-white/10 pb-2 flex justify-between items-center">
                    <span>Preferences & Settings</span>
                    <span className="text-xs text-slate-400 font-mono">⚙️</span>
                  </div>

                  {/* Appearance Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Appearance
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-white/[0.05] rounded-xl border border-slate-200 dark:border-white/10">
                      <button
                        onClick={() => setTheme('light')}
                        className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                          theme === 'light'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                        }`}
                      >
                        <span>☀️</span> Light
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                          theme === 'dark'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>🌙</span> Dark
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                          theme === 'system'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>💻</span> System
                      </button>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="space-y-2 border-t border-slate-200/60 dark:border-white/10 pt-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Notifications
                    </label>
                    <div className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span>Application status notifications</span>
                        <input
                          type="checkbox"
                          checked={notifPrefs.appStatus}
                          onChange={() => toggleNotifPref('appStatus')}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-white/20"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span>New application notifications</span>
                        <input
                          type="checkbox"
                          checked={notifPrefs.newApps}
                          onChange={() => toggleNotifPref('newApps')}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-white/20"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Account */}
                  <div className="space-y-2 border-t border-slate-200/60 dark:border-white/10 pt-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Account
                    </label>
                    <div className="space-y-1 text-xs">
                      <button
                        onClick={handleProfileClick}
                        className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-white/10 text-slate-700 dark:text-slate-200 font-medium flex items-center justify-between"
                      >
                        <span>Profile & Details</span>
                        <span className="text-slate-400">→</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowSettings(false);
                          setShowPasswordModal(true);
                        }}
                        className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-white/10 text-slate-700 dark:text-slate-200 font-medium flex items-center justify-between"
                      >
                        <span>Change Password</span>
                        <span className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded">
                          Managed
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. USER PROFILE & AVATAR */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col text-right leading-tight">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                  <span className="chip text-[10px] capitalize self-end py-0 px-1.5 mt-0.5">
                    {user.role}
                  </span>
                </div>

                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md border border-white/30">
                    {initial}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#0C0A1D]" />
                </div>

                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="btn-secondary !px-3 !py-1 text-xs"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary !px-3.5 !py-1.5 text-xs">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary !px-3.5 !py-1.5 text-xs">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="glass-panel max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-lg text-white">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white text-xl font-bold">×</button>
            </div>
            <div className="p-3 bg-white/[0.05] rounded-xl text-xs text-slate-300 space-y-1 border border-white/10">
              <p className="font-semibold text-white">Security Note:</p>
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
