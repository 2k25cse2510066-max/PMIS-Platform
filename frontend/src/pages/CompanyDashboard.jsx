import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import MatchSeal from '../components/MatchSeal';
import api from '../api/client';

export default function CompanyDashboard() {
  const [profile, setProfile] = useState(null);
  const [internships, setInternships] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

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
        <div className="glass-panel p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40 border-white/15">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-display font-bold text-2xl shadow-lg border border-white/20 shrink-0">
                🏢
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight">{profile?.name || 'Company Portal'}</h1>
                  {profile?.verified ? (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">✔ Verified Employer</span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">Pending Verification</span>
                  )}
                </div>
                <p className="text-slate-300 text-xs mt-1">Post internship seats, review candidate match breakdown, and manage status hiring pipelines.</p>
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
          <div className="glass-card p-4 text-xs text-amber-300 bg-amber-500/10 border-amber-500/30 flex items-center gap-3">
            <span className="text-base">⏳</span>
            <span>Your company profile is undergoing verification by an MCA Admin. You can manage your draft postings below.</span>
          </div>
        )}

        {showForm && <PostForm onCreated={() => { setShowForm(false); loadAll(); }} />}

        {internships === null ? (
          <SkeletonList />
        ) : internships.length === 0 ? (
          <EmptyState text="No postings yet — create your first internship above." />
        ) : (
          <div className="grid md:grid-cols-[280px,1fr] gap-6 mt-4">
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold px-1 mb-2">Your Postings</div>
              {internships.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setSelected(i.id)}
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition-all ${
                    selected === i.id
                      ? 'border-indigo-500/60 bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 text-white shadow-lg backdrop-blur-md'
                      : 'border-white/10 bg-white/[0.05] hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <div className="font-bold text-white text-sm">{i.title}</div>
                  <div className="text-xs text-slate-300 mt-0.5">{i.location} · {i.seats} seats</div>
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
    <form onSubmit={submit} className="glass-card p-6 mb-6 space-y-4 border-white/15">
      {error && <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{error}</div>}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className="label">Title</label><input className="input text-xs" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Full Stack Development Intern" /></div>
        <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input text-xs" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="sm:col-span-2"><label className="label">Required skills (comma separated)</label><input className="input text-xs" value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} placeholder="react, node.js, mongodb, rest apis" /></div>
        <div><label className="label">Location</label><input className="input text-xs" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Kanpur / Remote" /></div>
        <div>
          <label className="label">Type</label>
          <select className="input text-xs" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option className="bg-[#0C0A1D]">On-site</option><option className="bg-[#0C0A1D]">Remote</option><option className="bg-[#0C0A1D]">Hybrid</option>
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

  const activeQuery = search || query;

  const load = useCallback(() => { api.get(`/company/internships/${internshipId}/applicants`).then((r) => setApps(r.data)); }, [internshipId]);
  useEffect(() => { setApps(null); load(); }, [load]);

  async function updateStatus(appId, status) {
    setUpdating(appId);
    try {
      await api.put(`/company/applications/${appId}/status`, { status });
      load();
      if (selectedApplicant?.application_id === appId) {
        setSelectedApplicant((prev) => prev ? { ...prev, status } : null);
      }
    } finally {
      setUpdating(null);
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
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-mono uppercase tracking-widest text-indigo-300 font-bold">
          {filteredApps.length} applicant{filteredApps.length !== 1 && 's'} · ranked by match
        </p>
        <input
          type="text"
          placeholder="Filter applicants by name or skill..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input !py-1.5 !px-3 text-xs !w-60"
        />
      </div>

      {filteredApps.length === 0 ? (
        <EmptyState text="No applicants match your filter query." />
      ) : (
        filteredApps.map((a) => (
          <div key={a.application_id} className="glass-card p-4 flex items-center gap-4 border-white/15 cursor-pointer hover:border-indigo-400/50" onClick={() => setSelectedApplicant(a)}>
            <MatchSeal score={a.match.overall} size={52} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm hover:underline">{a.name}</span>
                {a.resume_filename && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono border border-indigo-500/30">📄 Resume attached</span>
                )}
              </div>
              <div className="text-xs text-slate-300 mt-0.5">{a.location || 'Location not set'} {a.cgpa ? `· CGPA ${a.cgpa}` : ''} {a.phone ? `· ${a.phone}` : ''}</div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {a.match.matchedSkills.slice(0, 6).map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
            </div>
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <select
                value={a.status}
                disabled={updating === a.application_id}
                onChange={(e) => updateStatus(a.application_id, e.target.value)}
                className="input !w-auto text-xs capitalize bg-[#0C0A1D]"
              >
                {statuses.map((s) => <option key={s} value={s} className="bg-[#0C0A1D]">{s}</option>)}
              </select>
            </div>
          </div>
        ))
      )}

      {selectedApplicant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelectedApplicant(null)}>
          <div className="glass-panel max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 border-white/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display text-2xl font-bold text-white">{selectedApplicant.name}</h3>
                <p className="text-xs text-slate-300">{selectedApplicant.location || 'Location not specified'} · Phone: {selectedApplicant.phone || 'N/A'}</p>
              </div>
              <button onClick={() => setSelectedApplicant(null)} className="text-slate-400 hover:text-white text-xl font-bold">×</button>
            </div>

            <div className="flex items-center gap-4 bg-white/[0.05] p-3.5 rounded-2xl border border-white/10">
              <MatchSeal score={selectedApplicant.match.overall} size={56} />
              <div>
                <div className="font-display font-semibold text-white text-sm">Match Score: {selectedApplicant.match.overall}%</div>
                <div className="text-xs text-slate-300">
                  Skill overlap: {selectedApplicant.match.breakdown.skill}% · CGPA: {selectedApplicant.cgpa || 'N/A'}
                </div>
              </div>
            </div>

            {selectedApplicant.resume_filename ? (
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl">
                <span className="text-xs font-semibold text-emerald-300">📄 PDF Resume Uploaded ({selectedApplicant.resume_filename})</span>
                {selectedApplicant.resume_url ? (
                  <a
                    href={selectedApplicant.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary text-xs !py-1.5 !px-3"
                  >
                    View / Download PDF
                  </a>
                ) : (
                  <span className="text-xs text-emerald-400">Resume link unavailable</span>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 bg-white/[0.05] p-3 rounded-2xl border border-white/10">No PDF resume uploaded by candidate yet.</div>
            )}

            <div>
              <h4 className="font-display text-xs font-bold text-white mb-1">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedApplicant.skills.map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
            </div>

            {selectedApplicant.projects && selectedApplicant.projects.length > 0 && (
              <div>
                <h4 className="font-display text-xs font-bold text-white mb-2">Projects</h4>
                <div className="space-y-2">
                  {selectedApplicant.projects.map((p, idx) => (
                    <div key={idx} className="border border-white/10 rounded-2xl p-3 text-xs bg-white/[0.04]">
                      <div className="font-bold text-white">{p.title}</div>
                      <p className="text-xs text-slate-300 mt-1">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button onClick={() => setSelectedApplicant(null)} className="btn-secondary text-xs">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonList() {
  return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse border border-white/10" />)}</div>;
}
function EmptyState({ text }) {
  return <div className="glass-card p-10 text-center text-slate-400 text-xs">{text}</div>;
}
