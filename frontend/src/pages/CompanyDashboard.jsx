import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import MatchSeal from '../components/MatchSeal';
import api from '../api/client';

export default function CompanyDashboard() {
  const [profile, setProfile] = useState(null);
  const [internships, setInternships] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadAll = useCallback(() => {
    api.get('/company/profile').then((r) => setProfile(r.data));
    api.get('/company/internships').then((r) => {
      setInternships(r.data);
      if (r.data.length && !selected) setSelected(r.data[0].id);
    });
  }, [selected]);

  useEffect(() => { loadAll(); }, []); // eslint-disable-line

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-navy-950 text-navy-800 dark:text-navy-100 transition-colors duration-200">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-5 py-8 space-y-6">
        {/* Employer Hero Header */}
        <div className="glass-card p-6 border-navy-100/90 dark:border-navy-800 relative overflow-hidden bg-gradient-to-r from-navy-800 via-navy-700 to-navy-800 text-white shadow-md">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center font-display font-bold text-2xl shadow-inner shrink-0">
                🏢
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{profile?.name || 'Company Portal'}</h1>
                  {profile?.verified ? (
                    <span className="bg-leaf-500/20 text-leaf-300 border border-leaf-400/30 text-xs font-semibold px-3 py-1 rounded-full">✔ Verified Employer</span>
                  ) : (
                    <span className="bg-saffron-500/20 text-saffron-300 border border-saffron-400/30 text-xs font-semibold px-3 py-1 rounded-full">Pending Verification</span>
                  )}
                </div>
                <p className="text-navy-100/80 text-sm mt-1">Post internship seats, review candidate match breakdown, and manage status hiring pipelines.</p>
              </div>
            </div>

            <button
              className="btn-saffron text-sm !px-5 !py-2.5 shrink-0 shadow-md"
              disabled={!profile?.verified}
              onClick={() => setShowForm((s) => !s)}
            >
              {showForm ? 'Cancel Form' : '+ Post New Internship'}
            </button>
          </div>
        </div>

        {!profile?.verified && (
          <div className="glass-card p-4 text-sm text-saffron-800 dark:text-saffron-300 bg-saffron-50 dark:bg-saffron-950/40 border-saffron-200/80 dark:border-saffron-800/80 flex items-center gap-3">
            <span className="text-lg">⏳</span>
            <span>Your company profile is undergoing verification by an MCA Admin. You can manage your draft postings below.</span>
          </div>
        )}

        {showForm && <PostForm onCreated={() => { setShowForm(false); loadAll(); }} />}

        {internships === null ? (
          <SkeletonList />
        ) : internships.length === 0 ? (
          <EmptyState text="No postings yet — create your first internship above." />
        ) : (
          <div className="grid md:grid-cols-[260px,1fr] gap-6 mt-4">
            <div className="space-y-2">
              {internships.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setSelected(i.id)}
                  className={`w-full text-left rounded-card border px-4 py-3 transition-colors ${
                    selected === i.id
                      ? 'border-navy-600 dark:border-navy-400 bg-navy-50 dark:bg-navy-800'
                      : 'border-navy-100 dark:border-navy-800/80 hover:bg-navy-50/50 dark:hover:bg-navy-900/60'
                  }`}
                >
                  <div className="font-medium text-navy-800 dark:text-navy-100 text-sm">{i.title}</div>
                  <div className="text-xs text-navy-500 dark:text-navy-400">{i.location} · {i.seats} seats</div>
                </button>
              ))}
            </div>
            {selected && <Applicants internshipId={selected} />}
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
    <form onSubmit={submit} className="stub-card p-6 mb-6 space-y-4">
      {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-card px-3 py-2">{error}</div>}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className="label">Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Full Stack Development Intern" /></div>
        <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="sm:col-span-2"><label className="label">Required skills (comma separated)</label><input className="input" value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} placeholder="react, node.js, mongodb, rest apis" /></div>
        <div><label className="label">Location</label><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Kanpur / Remote" /></div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option>On-site</option><option>Remote</option><option>Hybrid</option>
          </select>
        </div>
        <div><label className="label">Seats</label><input className="input" type="number" min="1" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} /></div>
        <div><label className="label">Stipend</label><input className="input" value={form.stipend} onChange={(e) => setForm({ ...form, stipend: e.target.value })} placeholder="₹15,000/month" /></div>
      </div>
      <button className="btn-primary" disabled={saving}>{saving ? 'Posting…' : 'Post internship'}</button>
    </form>
  );
}

function Applicants({ internshipId }) {
  const [apps, setApps] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState(null);

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
    const q = query.toLowerCase();
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
        <p className="text-xs font-mono uppercase tracking-widest text-navy-500 dark:text-navy-400">
          {filteredApps.length} applicant{filteredApps.length !== 1 && 's'} · ranked by match
        </p>
        <input
          type="text"
          placeholder="Filter applicants by name or skill..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input !py-1 !px-3 text-xs !w-60"
        />
      </div>

      {filteredApps.length === 0 ? (
        <EmptyState text="No applicants match your filter query." />
      ) : (
        filteredApps.map((a) => (
          <div key={a.application_id} className="stub-card p-4 flex items-center gap-4 hover:border-navy-300 dark:hover:border-navy-600 transition-colors cursor-pointer" onClick={() => setSelectedApplicant(a)}>
            <MatchSeal score={a.match.overall} size={52} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-navy-800 dark:text-navy-100 hover:underline">{a.name}</span>
                {a.resume_filename && (
                  <span className="text-[10px] bg-navy-50 dark:bg-navy-800 text-navy-600 dark:text-navy-300 px-1.5 py-0.5 rounded font-mono">📄 Resume attached</span>
                )}
              </div>
              <div className="text-xs text-navy-500 dark:text-navy-400">{a.location || 'Location not set'} {a.cgpa ? `· CGPA ${a.cgpa}` : ''} {a.phone ? `· ${a.phone}` : ''}</div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {a.match.matchedSkills.slice(0, 6).map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
            </div>
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <select
                value={a.status}
                disabled={updating === a.application_id}
                onChange={(e) => updateStatus(a.application_id, e.target.value)}
                className="input !w-auto text-sm capitalize"
              >
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))
      )}

      {selectedApplicant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedApplicant(null)}>
          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 border border-navy-100 dark:border-navy-800 text-navy-800 dark:text-navy-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-navy-100 dark:border-navy-800 pb-3">
              <div>
                <h3 className="font-display text-2xl font-bold text-navy-800 dark:text-navy-100">{selectedApplicant.name}</h3>
                <p className="text-sm text-navy-500 dark:text-navy-400">{selectedApplicant.location || 'Location not specified'} · Phone: {selectedApplicant.phone || 'N/A'}</p>
              </div>
              <button onClick={() => setSelectedApplicant(null)} className="text-navy-400 hover:text-navy-600 text-xl font-bold">×</button>
            </div>

            <div className="flex items-center gap-4 bg-navy-50 dark:bg-navy-950 p-3 rounded-card border border-navy-100 dark:border-navy-800">
              <MatchSeal score={selectedApplicant.match.overall} size={56} />
              <div>
                <div className="font-display font-semibold text-navy-800 dark:text-navy-100">Match Score: {selectedApplicant.match.overall}%</div>
                <div className="text-xs text-navy-600 dark:text-navy-300">
                  Skill overlap: {selectedApplicant.match.breakdown.skill}% · CGPA: {selectedApplicant.cgpa || 'N/A'}
                </div>
              </div>
            </div>

            {selectedApplicant.resume_filename ? (
              <div className="flex items-center justify-between bg-leaf-50 dark:bg-leaf-950/40 border border-leaf-200 dark:border-leaf-800/80 p-3 rounded-card">
                <span className="text-xs font-medium text-leaf-800 dark:text-leaf-300">📄 PDF Resume Uploaded ({selectedApplicant.resume_filename})</span>
                {selectedApplicant.resume_url ? (
                  <a
                    href={selectedApplicant.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary text-xs !py-1.5 !px-3"
                  >
                    View / Download Resume PDF
                  </a>
                ) : (
                  <span className="text-xs text-leaf-700 dark:text-leaf-400">Resume link unavailable</span>
                )}
              </div>
            ) : (
              <div className="text-xs text-navy-400 dark:text-navy-500 bg-navy-50 dark:bg-navy-950 p-3 rounded-card">No PDF resume uploaded by candidate yet.</div>
            )}

            <div>
              <h4 className="font-display text-sm font-semibold text-navy-800 dark:text-navy-100 mb-1">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedApplicant.skills.map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
            </div>

            {selectedApplicant.projects && selectedApplicant.projects.length > 0 && (
              <div>
                <h4 className="font-display text-sm font-semibold text-navy-800 dark:text-navy-100 mb-2">Projects</h4>
                <div className="space-y-2">
                  {selectedApplicant.projects.map((p, idx) => (
                    <div key={idx} className="border border-navy-100 dark:border-navy-800 rounded-card p-3 text-sm bg-navy-50/40 dark:bg-navy-950/40">
                      <div className="font-medium text-navy-800 dark:text-navy-100">{p.title}</div>
                      <p className="text-xs text-navy-600 dark:text-navy-300 mt-1">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-navy-100 dark:border-navy-800 flex justify-end">
              <button onClick={() => setSelectedApplicant(null)} className="btn-secondary text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonList() {
  return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-card bg-navy-50 dark:bg-navy-900 animate-pulse" />)}</div>;
}
function EmptyState({ text }) {
  return <div className="stub-card p-10 text-center text-navy-400 dark:text-navy-500 text-sm">{text}</div>;
}
