import { useState, useEffect } from 'react';
import api from '../api/client';

export default function ScheduleInterviewModal({ isOpen, onClose, applicant, onScheduled }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('15:00');
  const [duration, setDuration] = useState('30');
  const [type, setType] = useState('Google Meet');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [googleStatus, setGoogleStatus] = useState({ connected: false });
  const [scheduledResult, setScheduledResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);

      // Check Google OAuth status
      api.get('/google/status')
        .then((r) => setGoogleStatus(r.data))
        .catch(() => setGoogleStatus({ connected: false }));

      setScheduledResult(null);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !applicant) return null;

  async function handleConnectGoogle() {
    try {
      const { data } = await api.get('/google/auth-url');
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      alert('Could not fetch Google authorization URL');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { data } = await api.post('/company/interviews/schedule', {
        application_id: applicant.application_id,
        date,
        start_time: time,
        duration: Number(duration),
        interview_type: type,
        notes,
      });

      setScheduledResult(data.interview);
      if (onScheduled) onScheduled();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to schedule interview. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl glass-panel bg-white/95 dark:bg-[#0F0D25]/95 border-orange-200/90 dark:border-white/20 shadow-2xl overflow-hidden rounded-3xl space-y-5 my-auto p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500/15 to-amber-500/15 text-orange-700 dark:text-amber-300 text-[10px] font-mono font-bold uppercase border border-orange-500/30">
              📅 Interview Scheduler
            </div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Schedule Interview
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {scheduledResult ? (
          /* Success Screen */
          <div className="space-y-5 py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto border-2 border-emerald-500/30">
              ✓
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Interview Scheduled Successfully!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                Candidate <strong className="text-slate-900 dark:text-white">{applicant.name}</strong> has been notified and calendar invite dispatched.
              </p>
            </div>

            {scheduledResult.meeting_url && (
              <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 space-y-2 text-left">
                <div className="text-xs font-mono font-bold text-indigo-600 dark:text-amber-400 flex items-center justify-between">
                  <span>🎥 {scheduledResult.interview_type} Link:</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">Active</span>
                </div>
                <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all font-bold">
                  {scheduledResult.meeting_url}
                </div>
                <a
                  href={scheduledResult.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-xs w-full justify-center !py-2.5 flex items-center gap-2 mt-2"
                >
                  <span>🎥 Join Meeting</span>
                </a>
              </div>
            )}

            <button onClick={onClose} className="btn-secondary text-xs w-full !py-2.5">
              Done & Return
            </button>
          </div>
        ) : (
          /* Schedule Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            {/* Candidate & Internship Display Cards */}
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-0.5">
                <span className="text-slate-500 font-mono text-[10px] uppercase font-bold">Candidate</span>
                <div className="font-extrabold text-slate-900 dark:text-white text-sm">{applicant.name || 'Candidate'}</div>
                <div className="text-slate-500 text-[11px] font-medium">{applicant.location || 'Applicant'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-0.5">
                <span className="text-slate-500 font-mono text-[10px] uppercase font-bold">Internship Role</span>
                <div className="font-extrabold text-slate-900 dark:text-white text-sm truncate">{applicant.title || 'Internship'}</div>
                <div className="text-slate-500 text-[11px] font-medium">Match: {applicant.match?.overall || 82}%</div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              
              {/* Interview Type Selector */}
              <div>
                <label className="label">Interview Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Google Meet', 'Phone', 'In-person'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        type === t
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md'
                          : 'bg-white/60 dark:bg-white/[0.05] border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t === 'Google Meet' ? '🎥 Google Meet' : t === 'Phone' ? '📞 Phone' : '🏢 In-person'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Google OAuth Banner */}
              {type === 'Google Meet' && (
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌐</span>
                    <span className="text-slate-700 dark:text-indigo-200 font-medium text-[11px]">
                      {googleStatus.connected ? '✔ Google Calendar API Connected' : 'Google Meet URL generated live via Calendar API.'}
                    </span>
                  </div>
                  {!googleStatus.connected && (
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shrink-0 shadow-sm"
                    >
                      Connect Google
                    </button>
                  )}
                </div>
              )}

              {/* Date & Time Grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Interview Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input text-xs"
                  />
                </div>

                <div>
                  <label className="label">Start Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="input text-xs"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="label">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="input text-xs bg-white text-slate-900 dark:bg-[#0C0A1D] dark:text-white"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes (1 hour)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Interview Notes / Instructions (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please bring code samples and portfolio links..."
                  className="input text-xs"
                />
              </div>

            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="btn-secondary text-xs !py-2.5">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs !py-2.5 !px-6"
              >
                {submitting ? 'Scheduling…' : 'Schedule Interview'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
