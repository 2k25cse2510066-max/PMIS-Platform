import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PremiumModal from './PremiumModal';

export default function Sidebar({ activeTab, onSelectTab, isOpen, onClose }) {
  const { user } = useAuth();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

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
      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        className={`fixed lg:sticky top-24 left-4 z-40 w-64 h-[calc(100vh-7rem)] transition-all duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full glass-panel p-4 flex flex-col justify-between overflow-y-auto">
          {/* Navigation Links */}
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
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
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 dark:from-blue-600 dark:via-indigo-600 dark:to-purple-600 text-white shadow-md shadow-orange-500/20 dark:shadow-indigo-500/25 border border-white/20'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Premium Feature Card with Interactive Early Access Preview */}
          <div
            onClick={() => setShowPremiumModal(true)}
            className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/10 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-blue-500/10 border border-amber-500/20 dark:border-white/15 backdrop-blur-md space-y-2.5 cursor-pointer hover:border-amber-500/40 dark:hover:border-indigo-500/40 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base group-hover:scale-110 transition-transform">👑</span>
                <span className="font-display text-xs font-bold text-slate-900 dark:text-white">Premium Features</span>
              </div>
              <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">
                Early Access
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Advanced AI insights, personalized recommendations and career analytics are coming soon.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPremiumModal(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 dark:from-blue-600 dark:via-indigo-600 dark:to-purple-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 dark:shadow-indigo-500/25 hover:from-orange-400 hover:to-amber-500 dark:hover:from-blue-500 dark:hover:to-purple-500 transition-all active:scale-95 flex items-center justify-center gap-1"
            >
              <span>Explore Features</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Premium Feature Preview Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </>
  );
}
