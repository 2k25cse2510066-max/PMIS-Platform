import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function PremiumModal({ isOpen, onClose, onStatusChange }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('none'); // 'none' | 'pending' | 'active' | 'rejected'
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [note, setNote] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSuccessMsg('');
    setErrorMsg('');
    if (user?.role === 'student') {
      setLoading(true);
      api.get('/student/premium/status')
        .then((res) => {
          setStatus(res.data?.status || 'none');
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  async function handleApply(e) {
    e.preventDefault();
    if (user?.role !== 'student') {
      setErrorMsg('Only registered student candidates can apply for PMIS Premium.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.post('/student/premium/request', {
        email: email || user?.email,
        note,
        plan: 'PMIS Early Access Pro',
      });
      setStatus('pending');
      setSuccessMsg('Your application has been submitted to MCA Admin for priority verification!');
      if (onStatusChange) onStatusChange('pending');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit premium request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-panel max-w-lg w-full p-6 sm:p-8 space-y-6 border-slate-200/90 dark:border-white/20 relative overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow spot */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg border border-white/20">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
                  PMIS Premium Tier
                </h3>
                {status === 'active' ? (
                  <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span>✔</span> Active Member
                  </span>
                ) : status === 'pending' ? (
                  <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <span>⏳</span> Review Pending
                  </span>
                ) : (
                  <span className="bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    Early Access
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                Supercharge your internship allocation with AI automation & verified priority.
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
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center justify-between">
            <span>What's Included in Premium:</span>
            {status === 'active' && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                ⭐ All Perks Unlocked
              </span>
            )}
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 transition-all hover:bg-slate-200/50">
              <span className="text-lg">🚀</span>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Priority Candidate Ranking</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">Top Placement</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium mt-0.5">
                  Get your application badge highlighted with a golden priority seal at the top of corporate recruiters' queues.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 transition-all hover:bg-slate-200/50">
              <span className="text-lg">🤖</span>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Unlimited AI Resume ATS Parser</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium mt-0.5">
                  Instant ATS score breakdown, missing keyword alerts, and live bullet-point recommendations.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 transition-all hover:bg-slate-200/50">
              <span className="text-lg">💬</span>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">24/7 AI Career Mentor & Mock Interviews</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium mt-0.5">
                  Real-time interactive mock technical drills and personalized project enhancement roadmaps.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 transition-all hover:bg-slate-200/50">
              <span className="text-lg">📊</span>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Deep Skill Gap Analytics</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-medium mt-0.5">
                  Custom curriculum suggestions tailored to national corporate scheme demand.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Status / Application Form Section */}
        <div className="pt-2">
          {errorMsg && (
            <div className="mb-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {status === 'active' ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/40 text-center space-y-2">
              <div className="text-emerald-700 dark:text-emerald-300 font-extrabold text-sm flex items-center justify-center gap-1.5">
                <span>🎉</span>
                <span>You are a Verified PMIS Premium Member</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Your profile is highlighted to recruiters with priority status, and all AI features are fully unlocked.
              </p>
            </div>
          ) : status === 'pending' ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/40 text-center space-y-2">
              <div className="text-amber-700 dark:text-amber-300 font-extrabold text-sm flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                <span>Application Under Admin Review</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Your request has been forwarded to the MCA Operations Admin. You will receive an instant in-app notification once approved!
              </p>
            </div>
          ) : (
            <form onSubmit={handleApply} className="space-y-3">
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  {successMsg}
                </div>
              )}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email..."
                    className="input text-xs flex-1"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs shrink-0 !px-5 font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                  >
                    {submitting ? 'Submitting...' : 'Apply for Premium'}
                  </button>
                </div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional: Why are you applying? (e.g. Seeking high-priority placement in AI/Web dev)"
                  className="input text-xs !py-2"
                />
              </div>
            </form>
          )}
        </div>

        <div className="pt-1 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">
            Scheme ID: PMIS-PRM-2026
          </span>
          <button onClick={onClose} className="btn-secondary text-xs !py-1.5">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
