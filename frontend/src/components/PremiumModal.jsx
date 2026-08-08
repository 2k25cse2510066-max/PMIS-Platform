import { useState } from 'react';

export default function PremiumModal({ isOpen, onClose }) {
  const [joined, setJoined] = useState(false);
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  function handleJoin(e) {
    e.preventDefault();
    setJoined(true);
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-panel max-w-lg w-full p-6 sm:p-8 space-y-6 border-slate-200/90 dark:border-white/20 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow spot */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg border border-white/20">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
                  PMIS Premium Tier
                </h3>
                <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  Early Access
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                Supercharge your internship search with AI automation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-2xl font-bold transition-all"
          >
            ×
          </button>
        </div>

        {/* Features Comparison List */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
            What's Included in Premium:
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
              <span className="text-base">🤖</span>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Unlimited AI Resume Parser</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium">
                  Extract skills, projects, and certifications from any PDF resume instantly.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
              <span className="text-base">🚀</span>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Priority Candidate Ranking</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium">
                  Get your application highlighted at the top of corporate employer review queues.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
              <span className="text-base">📊</span>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Advanced Skill Gap Analytics</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium">
                  Personalized learning roadmaps to bridge missing skills for high-paying roles.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
              <span className="text-base">💬</span>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">24/7 AI Career Mentor</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium">
                  Unlimited mock technical interviews, resume line improvements, and career advice.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Join Early Access Form */}
        <div className="pt-2">
          {joined ? (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-1">
              <div className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                ✔ You're on the Premium Early Access Waitlist!
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                We will notify you as soon as Premium features become available.
              </p>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email for priority invite..."
                  className="input text-xs"
                />
                <button type="submit" className="btn-primary text-xs shrink-0 !px-5">
                  Request Invite
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="pt-1 flex justify-end">
          <button onClick={onClose} className="btn-secondary text-xs !py-1.5">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
