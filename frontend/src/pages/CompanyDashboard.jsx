import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import MatchSeal from '../components/MatchSeal';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';
import api from '../api/client';

export default function CompanyDashboard() {
  const [profile, setProfile] = useState(null);
  const [internships, setInternships] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Applicants'); // 'Applicants' | 'Interviews'

  const loadAll = useCallback(() => {
    api.get('/company/profile').then((r) => setProfile(r.data));
    api.get('/company/internships').then((r) => {
      setInternships(r.data);
      if (r.data.length && !selected) setSelected(r.data[0].id);
    });
  }, [selected]);

  useEffect(() => { loadAll(); }, []); // eslint-disable-line

  return (
    <div className="min-h-screen relative z-10">
      <Navbar search={search} onSearchChange={setSearch} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Employer Hero Header */}
        <div className="glass-panel p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-purple-900/80 text-white border-slate-200/90 dark:border-white/15">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-display font-bold text-2xl shadow-lg border border-white/20 shrink-0">
                🏢
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight">{profile?.name || 'Company Portal'}</h1>
                  {profile?.verified ? (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">✔ Verified Employer</span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">Pending Verification</span>
                  )}
                </div>
                <p className="text-slate-200 text-xs mt-1 font-medium">Post internship seats, review candidate match breakdown, shortlist applicants, and schedule Google Meet interviews.</p>
              </div>
            </div>

            <button
              className="btn-saffron text-xs !px-5 !py-2.5 shrink-0 shadow-md"
              disabled={!profile?.verified}
              onClick={() => setShowForm((s) => !s)}
            >
              {showForm ? 'Cancel Form' : '+ Post New Internship'}
            </button>
          </div>
        </div>

        {!profile?.verified && (
          <div className="glass-card p-4 text-xs text-amber-800 dark:text-amber-300 bg-amber-500/15 border-amber-500/30 flex items-center gap-3 font-semibold">
            <span className="text-base">⏳</span>
            <span>Your company profile is undergoing verification by an MCA Admin. You can manage your draft postings below.</span>
          </div>
        )}

        {showForm && <PostForm onCreated={() => { setShowForm(false); loadAll(); }} />}

        {/* Tab Selector: Candidates vs Scheduled Interviews */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('Applicants')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'Applicants'
                ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-md'
                : 'bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300'
            }`}
          >
            📋 Candidate Applications
          </button>
          <button
            onClick={() => setActiveTab('Interviews')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'Interviews'
                ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-md'
                : 'bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300'
            }`}
          >
            📅 Scheduled Interviews
          </button>
        </div>

        {activeTab === 'Interviews' ? (
          <CompanyInterviewList search={search} />
        ) : internships === null ? (
          <SkeletonList />
        ) : internships.length === 0 ? (
          <EmptyState text="No postings yet — create your first internship above." />
        ) : (
          <div className="grid md:grid-cols-[280px,1fr] gap-6 mt-4">
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-600 dark:text-slate-400 font-bold px-1 mb-2">Your Postings</div>
              {internships.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setSelected(i.id)}
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition-all ${
                    selected === i.id
                      ? 'border-indigo-500/60 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg backdrop-blur-md font-bold'
                      : 'border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-white/[0.05] hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-800 dark:text-slate-300 font-medium'
                  }`}
                >
                  <div className="font-bold text-sm">{i.title}</div>
                  <div className="text-xs opacity-90 mt-0.5">{i.location} · {i.seats} seats</div>
                </button>
              ))}
            </div>
            {selected && <Applicants internshipId={selected} search={search} />}
          </div>
        )}
      </div>
    </div>
  );
}

function PostForm({ onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', required_skills: '', location: '', type: 'On-site', seats: 1, stipend: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/company/internships', {
        ...form,
        required_skills: form.required_skills.split(',').map((s) => s.trim()).filter(Boolean),
        seats: Number(form.seats) || 1,
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not post internship');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass-card p-6 mb-6 space-y-4 border-slate-200/90 dark:border-white/15">
      {error && <div className="text-xs text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2 font-semibold">{error}</div>}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className="label">Title</label><input className="input text-xs" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Full Stack Development Intern" /></div>
        <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input text-xs" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="sm:col-span-2"><label className="label">Required skills (comma separated)</label><input className="input text-xs" value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} placeholder="react, node.js, mongodb, rest apis" /></div>
        <div><label className="label">Location</label><input className="input text-xs" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Kanpur / Remote" /></div>
        <div>
          <label className="label">Type</label>
          <select className="input text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0C0A1D]" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="On-site">On-site</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option>
          </select>
        </div>
        <div><label className="label">Seats</label><input className="input text-xs" type="number" min="1" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} /></div>
        <div><label className="label">Stipend</label><input className="input text-xs" value={form.stipend} onChange={(e) => setForm({ ...form, stipend: e.target.value })} placeholder="₹15,000/month" /></div>
      </div>
      <button className="btn-primary text-xs" disabled={saving}>{saving ? 'Posting…' : 'Post Internship'}</button>
    </form>
  );
}

function Applicants({ internshipId, search }) {
  const [apps, setApps] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [scheduleApplicant, setScheduleApplicant] = useState(null);
  const [selectedBulk, setSelectedBulk] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const activeQuery = search || query;

  const load = useCallback(() => {
    api.get(`/company/internships/${internshipId}/applicants`).then((r) => setApps(r.data));
  }, [internshipId]);

  useEffect(() => {
    setApps(null);
    setSelectedBulk([]);
    load();
  }, [load]);

  async function updateStatus(appId, status) {
    setUpdating(appId);
    try {
      await api.put(`/company/applications/${appId}/status`, { status });
      load();
      if (selectedApplicant?.application_id === appId) {
        setSelectedApplicant((prev) => (prev ? { ...prev, status } : null));
      }
    } finally {
      setUpdating(null);
    }
  }

  async function handleBulkAction(status) {
    if (selectedBulk.length === 0) return;
    setBulkProcessing(true);
    try {
      await api.put('/company/applications/bulk-status', {
        application_ids: selectedBulk,
        status,
      });
      setSelectedBulk([]);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Bulk update failed');
    } finally {
      setBulkProcessing(false);
    }
  }

  function toggleSelectAll(filteredApps) {
    if (selectedBulk.length === filteredApps.length) {
      setSelectedBulk([]);
    } else {
      setSelectedBulk(filteredApps.map((a) => a.application_id));
    }
  }

  function toggleSelectCandidate(appId) {
    if (selectedBulk.includes(appId)) {
      setSelectedBulk(selectedBulk.filter((id) => id !== appId));
    } else {
      setSelectedBulk([...selectedBulk, appId]);
    }
  }

  if (apps === null) return <SkeletonList />;
  if (apps.length === 0) return <EmptyState text="No applicants yet for this internship." />;

  const filteredApps = apps.filter((a) => {
    const q = activeQuery.toLowerCase();
    return (
      a.name?.toLowerCase().includes(q) ||
      a.skills?.some((s) => s.toLowerCase().includes(q)) ||
      a.location?.toLowerCase().includes(q)
    );
  });

  const statuses = ['applied', 'shortlisted', 'interview', 'offered', 'rejected'];

  return (
    <div className="space-y-4">
      {/* Feature 1: Candidate AI Ranking Header & Bulk Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100/80 dark:bg-white/[0.04] p-4 rounded-2xl border border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={filteredApps.length > 0 && selectedBulk.length === filteredApps.length}
              onChange={() => toggleSelectAll(filteredApps)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Select All ({filteredApps.length})</span>
          </label>

          <p className="text-xs font-mono uppercase tracking-widest text-indigo-700 dark:text-indigo-300 font-bold border-l border-slate-300 dark:border-white/20 pl-3">
            🏆 Candidates Ranked by AI Match
          </p>
        </div>

        <input
          type="text"
          placeholder="Filter candidates..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input !py-1.5 !px-3 text-xs !w-52"
        />
      </div>

      {/* Feature 1: Bulk Actions Bar */}
      {selectedBulk.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/90 to-purple-900/90 text-white flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fade-in border border-white/20">
          <span className="text-xs font-mono font-bold text-amber-300">
            📋 {selectedBulk.length} Candidate{selectedBulk.length > 1 && 's'} Selected
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBulkAction('shortlisted')}
              disabled={bulkProcessing}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow transition-all active:scale-95"
            >
              ⭐ Shortlist Selected
            </button>
            <button
              onClick={() => handleBulkAction('interview')}
              disabled={bulkProcessing}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow transition-all active:scale-95"
            >
              📅 Schedule Interview
            </button>
            <button
              onClick={() => handleBulkAction('rejected')}
              disabled={bulkProcessing}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition-all active:scale-95"
            >
              ✕ Reject Selected
            </button>
          </div>
        </div>
      )}

      {/* Applicant Cards Ranked by AI Match */}
      {filteredApps.length === 0 ? (
        <EmptyState text="No applicants match your filter query." />
      ) : (
        filteredApps.map((a, rankIdx) => (
          <div
            key={a.application_id}
            className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-200/90 dark:border-white/15 hover:border-indigo-500/50 transition-all rounded-3xl"
          >
            <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
              <input
                type="checkbox"
                checked={selectedBulk.includes(a.application_id)}
                onChange={() => toggleSelectCandidate(a.application_id)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-1 sm:mt-0"
              />

              <MatchSeal score={a.match.overall} size={56} />

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-black text-indigo-600 dark:text-amber-400">
                    #{rankIdx + 1}
                  </span>
                  <span
                    onClick={() => setSelectedApplicant(a)}
                    className="font-display font-extrabold text-slate-900 dark:text-white text-base hover:underline cursor-pointer"
                  >
                    {a.name || 'Candidate'}
                  </span>
                  {rankIdx === 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      ⭐ #1 Top Match
                    </span>
                  )}
                  {a.status === 'shortlisted' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      ✔ Shortlisted
                    </span>
                  )}
                  {a.status === 'interview' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                      🎥 Interview Scheduled
                    </span>
                  )}
                  {a.resume_filename && (
                    <span className="text-[10px] bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-mono border border-indigo-500/30 font-bold">
                      📄 Resume
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2 flex-wrap">
                  <span>📍 {a.location || 'Location not set'}</span>
                  {a.cgpa ? <span>• CGPA {a.cgpa}</span> : null}
                  {a.phone ? <span>• 📞 {a.phone}</span> : null}
                  {a.email ? <span>• ✉️ {a.email}</span> : null}
                </div>

                <div className="flex flex-wrap gap-1 pt-0.5">
                  {a.match.matchedSkills.slice(0, 5).map((s) => (
                    <span key={s} className="chip text-[11px] py-0 px-2">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions & Status Dropdown */}
            <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
              {a.resume_url && (
                <a
                  href={a.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs shadow hover:shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-1.5"
                  title="View Candidate PDF Resume / CV"
                >
                  <span>📄</span>
                  <span>View CV</span>
                </a>
              )}

              {a.status === 'applied' && (
                <button
                  onClick={() => updateStatus(a.application_id, 'shortlisted')}
                  disabled={updating === a.application_id}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow hover:from-orange-400 active:scale-95 transition-all"
                >
                  ⭐ Shortlist Candidate
                </button>
              )}

              {(a.status === 'shortlisted' || a.status === 'interview') && (
                <button
                  onClick={() => setScheduleApplicant(a)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow hover:from-indigo-500 active:scale-95 transition-all flex items-center gap-1"
                >
                  <span>📅</span>
                  <span>Schedule Interview</span>
                </button>
              )}

              <button
                onClick={() => setSelectedApplicant(a)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white/60 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/15 transition-all"
              >
                Breakdown →
              </button>

              <select
                value={a.status}
                disabled={updating === a.application_id}
                onChange={(e) => updateStatus(a.application_id, e.target.value)}
                className="input !w-auto text-xs capitalize bg-white text-slate-900 dark:bg-[#0C0A1D] dark:text-white font-bold"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        ))
      )}

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={Boolean(scheduleApplicant)}
        onClose={() => setScheduleApplicant(null)}
        applicant={scheduleApplicant}
        onScheduled={load}
      />

      {/* Match Breakdown Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelectedApplicant(null)}>
          <div className="glass-panel max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 border-slate-200/90 dark:border-white/20 rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-amber-500">Candidate Profile & CV Details</span>
                <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{selectedApplicant.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3 flex-wrap mt-0.5">
                  <span>📍 {selectedApplicant.location || 'Location not specified'}</span>
                  {selectedApplicant.phone && <span>• 📞 {selectedApplicant.phone}</span>}
                  {selectedApplicant.email && <span>• ✉️ {selectedApplicant.email}</span>}
                </p>
              </div>
              <button onClick={() => setSelectedApplicant(null)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white text-xl font-bold">×</button>
            </div>

            <div className="flex items-center gap-4 bg-slate-100/90 dark:bg-white/[0.05] p-4 rounded-2xl border border-slate-200 dark:border-white/10">
              <MatchSeal score={selectedApplicant.match.overall} size={64} />
              <div className="space-y-1">
                <div className="font-display font-extrabold text-slate-900 dark:text-white text-base">
                  AI Match Score: {selectedApplicant.match.overall}%
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Skill overlap: {selectedApplicant.match.breakdown.skill}% · Location score: {selectedApplicant.match.breakdown.location}% · CGPA: {selectedApplicant.cgpa || 'N/A'}
                </div>
              </div>
            </div>

            {selectedApplicant.resume_filename ? (
              <div className="space-y-3 bg-emerald-500/15 border border-emerald-500/30 p-4 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <span>📄</span>
                      <span>Candidate CV / Resume: {selectedApplicant.resume_filename}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">
                      Uploaded by candidate — verified for AI skill parsing & matching.
                    </div>
                  </div>
                  {selectedApplicant.resume_url ? (
                    <a
                      href={selectedApplicant.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary text-xs !py-2 !px-4 shrink-0 shadow-md flex items-center gap-1.5"
                    >
                      <span>📄 View / Download PDF Resume</span>
                      <span>↗</span>
                    </a>
                  ) : (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">PDF Active</span>
                  )}
                </div>

                {selectedApplicant.resume_text && (
                  <div className="pt-2 border-t border-emerald-500/20">
                    <span className="text-[10px] uppercase font-mono font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                      Extracted Resume Content Summary:
                    </span>
                    <div className="p-3 bg-white/80 dark:bg-black/40 rounded-xl text-xs text-slate-800 dark:text-slate-200 max-h-36 overflow-y-auto leading-relaxed font-sans border border-emerald-500/20 whitespace-pre-wrap">
                      {selectedApplicant.resume_text}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.05] p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center gap-2">
                <span>⚠️</span>
                <span>No PDF resume uploaded by candidate yet.</span>
              </div>
            )}

            <div>
              <h4 className="font-display text-xs font-bold text-slate-900 dark:text-white mb-1.5">Extracted Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedApplicant.skills.map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
            </div>

            {selectedApplicant.projects && selectedApplicant.projects.length > 0 && (
              <div>
                <h4 className="font-display text-xs font-bold text-slate-900 dark:text-white mb-2">Projects</h4>
                <div className="space-y-2">
                  {selectedApplicant.projects.map((p, idx) => (
                    <div key={idx} className="border border-slate-200 dark:border-white/10 rounded-2xl p-3 text-xs bg-slate-100/60 dark:bg-white/[0.04]">
                      <div className="font-bold text-slate-900 dark:text-white">{p.title}</div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
              {(selectedApplicant.status === 'shortlisted' || selectedApplicant.status === 'interview') && (
                <button
                  onClick={() => {
                    const app = selectedApplicant;
                    setSelectedApplicant(null);
                    setScheduleApplicant(app);
                  }}
                  className="btn-primary text-xs !py-2"
                >
                  Schedule Interview 📅
                </button>
              )}
              <button onClick={() => setSelectedApplicant(null)} className="btn-secondary text-xs">Close Breakdown</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CompanyInterviewList({ search }) {
  const [interviews, setInterviews] = useState(null);
  const [updating, setUpdating] = useState(false);

  const loadInterviews = useCallback(() => {
    api.get('/company/interviews').then((r) => setInterviews(r.data));
  }, []);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  async function handleCancel(id) {
    if (!confirm('Are you sure you want to cancel this interview?')) return;
    setUpdating(true);
    try {
      await api.put(`/company/interviews/${id}/cancel`);
      loadInterviews();
    } finally {
      setUpdating(false);
    }
  }

  async function handleComplete(id) {
    setUpdating(true);
    try {
      await api.put(`/company/interviews/${id}/status`, { status: 'completed' });
      loadInterviews();
    } finally {
      setUpdating(false);
    }
  }

  if (interviews === null) return <SkeletonList />;
  if (interviews.length === 0) return <EmptyState text="No scheduled interviews yet. Shortlist applicants and click Schedule Interview." />;

  const filtered = interviews.filter((inv) => {
    const q = (search || '').toLowerCase();
    return (
      !q ||
      inv.student_name?.toLowerCase().includes(q) ||
      inv.internship_title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Upcoming & Scheduled Interviews</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">Manage video meetings, join live Google Meet calls, or reschedule interviews.</p>
        </div>
        <span className="chip font-mono font-bold text-xs">{filtered.length} Scheduled</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((inv) => {
          const dateObj = new Date(inv.scheduled_at);
          const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={inv.id} className="glass-card p-5 border-slate-200/90 dark:border-white/15 space-y-4 rounded-3xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display font-extrabold text-base text-slate-900 dark:text-white">
                    {inv.student_name}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-amber-400 font-bold mt-0.5">
                    {inv.internship_title}
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase border ${
                    inv.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : inv.status === 'cancelled'
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30'
                      : 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30'
                  }`}
                >
                  {inv.status}
                </span>
              </div>

              {/* Date, Time & Duration Card */}
              <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 grid grid-cols-3 gap-2 text-xs text-center font-medium">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Date</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{dateStr}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Time</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{timeStr}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Duration</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{inv.duration} mins</span>
                </div>
              </div>

              {/* Actions Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {inv.meeting_url && inv.status !== 'cancelled' && (
                  <a
                    href={inv.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary text-xs !py-2 !px-4 flex items-center gap-1.5 shadow-md"
                  >
                    <span>🎥</span>
                    <span>Join Meeting</span>
                  </a>
                )}

                {inv.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => handleComplete(inv.id)}
                      disabled={updating}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      ✔ Mark Completed
                    </button>

                    <button
                      onClick={() => handleCancel(inv.id)}
                      disabled={updating}
                      className="px-3 py-2 rounded-xl border border-rose-400/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-all"
                    >
                      ✕ Cancel
                    </button>
                  </>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkeletonList() {
  return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse border border-slate-300/60 dark:border-white/10" />)}</div>;
}
function EmptyState({ text }) {
  return <div className="glass-card p-10 text-center text-slate-500 dark:text-slate-400 text-xs font-semibold">{text}</div>;
}
