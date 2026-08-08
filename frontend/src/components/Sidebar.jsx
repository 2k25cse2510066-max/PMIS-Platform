import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, onSelectTab, isOpen, onClose }) {
  const { user } = useAuth();

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { id: 'Recommendations', label: 'Recommendations', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    )},
    { id: 'Profile', label: 'Profile', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    { id: 'Applications', label: 'Applications', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
    { id: 'Gap Analysis', label: 'Gap Analysis', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    )},
    { id: 'Assistant', label: '✨ AI Assistant', icon: (
      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )},
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:sticky top-20 left-4 z-40 w-64 h-[calc(100vh-6rem)] transition-all duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full glass-panel p-4 flex flex-col justify-between overflow-y-auto">
          {/* Navigation Links */}
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-400 font-semibold">
              Portal Menu
            </div>
            {menuItems.map((item) => {
              const isActive = activeTab === item.id || (activeTab === 'Dashboard' && item.id === 'Recommendations');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id === 'Dashboard' ? 'Recommendations' : item.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90 text-white shadow-lg shadow-indigo-500/25 border border-white/20'
                      : 'text-slate-700 dark:text-slate-300 hover:text-white hover:bg-white/10 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Premium Upgrade Card at Bottom */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-slate-900/60 border border-white/15 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base">👑</span>
              <span className="font-display text-xs font-bold text-white">Upgrade to Premium</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Unlock advanced insights and AI recommendations.
            </p>
            <button
              onClick={() => alert('Premium tier features coming soon!')}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
