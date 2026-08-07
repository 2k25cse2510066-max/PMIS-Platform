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
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-3xl text-navy-800">{profile?.name || 'Company dashboard'}</h1>
          {profile?.verified ? <span className="chip">Verified employer</span> : <span className="chip-missing">Pending admin verification</span>}
        </div>
        <p className="text-navy-500 text-sm mb-6">Post internships and let the engine rank applicants for you.</p>

        {!profile?.verified && (
          <div className="stub-card p-4 mb-6 text-sm text-saffron-700 bg-saffron-50 border-saffron-200">
            Your company is awaiting verification by an MCA admin. You can still preview the dashboard, but posting is disabled until then.
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-navy-800">Your postings</h2>
          <button className="btn-saffron text-sm !px-4 !py-2" disabled={!profile?.verified} onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ Post internship'}
          </button>
        </div>

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
                    selected === i.id ? 'border-navy-600 bg-navy-50' : 'border-navy-100 hover:bg-navy-50/50'
                  }`}
                >
                  <div className="font-medium text-navy-800 text-sm">{i.title}</div>
                  <div className="text-xs text-navy-400">{i.location} · {i.seats} seats</div>
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
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2">{error}</div>}
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

  const load = useCallback(() => { api.get(`/company/internships/${internshipId}/applicants`).then((r) => setApps(r.data)); }, [internshipId]);
  useEffect(() => { setApps(null); load(); }, [load]);

  async function updateStatus(appId, status) {
    setUpdating(appId);
    try {
      await api.put(`/company/applications/${appId}/status`, { status });
      load();
    } finally {
      setUpdating(null);
    }
  }

  if (apps === null) return <SkeletonList />;
  if (apps.length === 0) return <EmptyState text="No applicants yet for this internship." />;

  const statuses = ['applied', 'shortlisted', 'interview', 'offered', 'rejected'];

  return (
    <div className="space-y-3">
      <p className="text-xs font-mono uppercase tracking-widest text-navy-400">{apps.length} applicant{apps.length !== 1 && 's'} · ranked by match</p>
      {apps.map((a) => (
        <div key={a.application_id} className="stub-card p-4 flex items-center gap-4">
          <MatchSeal score={a.match.overall} size={52} />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-navy-800">{a.name}</div>
            <div className="text-xs text-navy-400">{a.location || 'Location not set'} {a.cgpa ? `· CGPA ${a.cgpa}` : ''}</div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {a.match.matchedSkills.slice(0, 6).map((s) => <span key={s} className="chip">{s}</span>)}
            </div>
          </div>
          <select
            value={a.status}
            disabled={updating === a.application_id}
            onChange={(e) => updateStatus(a.application_id, e.target.value)}
            className="input !w-auto text-sm capitalize"
          >
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

function SkeletonList() {
  return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-card bg-navy-50 animate-pulse" />)}</div>;
}
function EmptyState({ text }) {
  return <div className="stub-card p-10 text-center text-navy-400 text-sm">{text}</div>;
}
