import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import MatchSeal from '../components/MatchSeal';
import api from '../api/client';

const TABS = ['Recommendations', 'Profile', 'Gap Analysis', 'Applications', 'Assistant'];

export default function StudentDashboard() {
  const [tab, setTab] = useState('Recommendations');
  const [profile, setProfile] = useState(null);

  const loadProfile = useCallback(() => {
    api.get('/student/profile').then((r) => setProfile(r.data));
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="max-w-6xl mx-auto px-5 py-8">
        <h1 className="font-display text-3xl text-navy-800 mb-1">
          {profile?.name ? `Welcome, ${profile.name.split(' ')[0]}` : 'Your dashboard'}
        </h1>
        <p className="text-navy-500 text-sm mb-6">Track matches, applications and skill gaps in one place.</p>

        <div className="flex gap-1 border-b border-navy-100 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-navy-600 text-navy-800' : 'border-transparent text-navy-400 hover:text-navy-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Recommendations' && <Recommendations />}
        {tab === 'Profile' && profile && <ProfileEditor profile={profile} onSaved={setProfile} />}
        {tab === 'Gap Analysis' && <GapAnalysis />}
        {tab === 'Applications' && <Applications />}
        {tab === 'Assistant' && <Assistant />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Recommendations() {
  const [items, setItems] = useState(null);
  const [applying, setApplying] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(() => { api.get('/student/recommendations').then((r) => setItems(r.data)); }, []);
  useEffect(() => { load(); }, [load]);

  async function apply(id) {
    setApplying(id);
    try {
      await api.post(`/student/apply/${id}`);
      load();
    } finally {
      setApplying(null);
    }
  }

  if (!items) return <SkeletonList />;
  if (items.length === 0) return <EmptyState text="No internships posted yet. Check back soon." />;

  return (
    <div className="space-y-4">
      <p className="text-xs font-mono uppercase tracking-widest text-navy-400">Top {items.length} internships for you</p>
      {items.map((i) => (
        <div key={i.id} className="stub-card p-5">
          <div className="flex items-start gap-4">
            <MatchSeal score={i.match.overall} size={64} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl text-navy-800">{i.title}</h3>
                {i.company_verified ? <span className="chip">Verified employer</span> : <span className="chip-missing">Pending verification</span>}
              </div>
              <div className="text-sm text-navy-500 mt-0.5">{i.company_name} · {i.location} · {i.type} {i.stipend && `· ${i.stipend}`}</div>
              <p className="text-sm text-navy-600 mt-2">{i.description}</p>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {i.match.matchedSkills.map((s) => <span key={s} className="chip">{s}</span>)}
                {i.match.missingSkills.map((s) => <span key={s} className="chip-missing">missing: {s}</span>)}
              </div>

              <button
                onClick={() => setExpanded(expanded === i.id ? null : i.id)}
                className="text-xs text-navy-500 underline mt-3"
              >
                {expanded === i.id ? 'Hide match breakdown' : 'Why this recommendation?'}
              </button>

              {expanded === i.id && (
                <div className="form-rule mt-3 pt-3 grid sm:grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 gap-y-1.5 text-sm font-mono">
                    <span className="text-navy-400">Skill</span><span className="text-right">{i.match.breakdown.skill}%</span>
                    <span className="text-navy-400">Location</span><span className="text-right">{i.match.breakdown.location}%</span>
                    <span className="text-navy-400">Type</span><span className="text-right">{i.match.breakdown.type}%</span>
                    <span className="text-navy-400">CGPA</span><span className="text-right">{i.match.breakdown.cgpa}%</span>
                    <span className="text-navy-400">Projects</span><span className="text-right">{i.match.breakdown.projects}%</span>
                  </div>
                  <ul className="text-sm text-navy-600 space-y-1">
                    {i.match.reasons.map((r, idx) => <li key={idx}>✔ {r}</li>)}
                  </ul>
                </div>
              )}

              <div className="mt-4">
                {i.already_applied ? (
                  <span className="text-sm text-leaf-600 font-medium">✔ Already applied</span>
                ) : (
                  <button className="btn-primary !px-4 !py-2 text-sm" disabled={applying === i.id} onClick={() => apply(i.id)}>
                    {applying === i.id ? 'Applying…' : 'Apply now'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
function ProfileEditor({ profile, onSaved }) {
  const [form, setForm] = useState({
    name: profile.name || '', phone: profile.phone || '', location: profile.location || '',
    preferred_type: profile.preferred_type || 'Remote', cgpa: profile.cgpa || '',
    skills: (profile.skills || []).join(', '),
  });
  const [projects, setProjects] = useState(profile.projects?.length ? profile.projects : [{ title: '', description: '' }]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedInfo, setParsedInfo] = useState(null);
  const [suggestions, setSuggestions] = useState(null);

  function updateProject(idx, field, value) {
    setProjects((p) => p.map((proj, i) => (i === idx ? { ...proj, [field]: value } : proj)));
  }

  async function save(e) {
    e?.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.put('/student/profile', {
        ...form,
        cgpa: form.cgpa ? Number(form.cgpa) : null,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        projects: projects.filter((p) => p.title || p.description),
      });
      onSaved(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function uploadResume(e) {
    e.preventDefault();
    if (!resumeFile) return;
    setParsing(true);
    setParsedInfo(null);
    try {
      const fd = new FormData();
      fd.append('resume', resumeFile);
      const { data } = await api.post('/student/resume', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setParsedInfo(data.extracted);
      onSaved(data.profile);
      setForm((f) => ({ ...f, skills: data.profile.skills.join(', ') }));
    } catch (err) {
      alert(err.response?.data?.error || 'Could not parse resume');
    } finally {
      setParsing(false);
    }
  }

  function loadSuggestions() {
    api.get('/student/resume-suggestions').then((r) => setSuggestions(r.data.suggestions));
  }

  return (
    <div className="grid lg:grid-cols-[1fr,340px] gap-6">
      <form onSubmit={save} className="stub-card p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Full name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Preferred location</label><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Kanpur" /></div>
          <div>
            <label className="label">Internship type</label>
            <select className="input" value={form.preferred_type} onChange={(e) => setForm({ ...form, preferred_type: e.target.value })}>
              <option>Remote</option><option>On-site</option><option>Hybrid</option>
            </select>
          </div>
          <div><label className="label">CGPA (out of 10)</label><input className="input" type="number" step="0.1" min="0" max="10" value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })} /></div>
        </div>

        <div>
          <label className="label">Skills (comma separated)</label>
          <textarea className="input" rows={2} value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="react, node.js, mongodb, dsa" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label !mb-0">Projects</label>
            <button type="button" onClick={() => setProjects([...projects, { title: '', description: '' }])} className="text-xs text-navy-600 underline">+ add project</button>
          </div>
          <div className="space-y-3">
            {projects.map((p, idx) => (
              <div key={idx} className="border border-navy-100 rounded-card p-3 space-y-2">
                <input className="input" placeholder="Project title" value={p.title} onChange={(e) => updateProject(idx, 'title', e.target.value)} />
                <textarea className="input" rows={2} placeholder="Describe it in your own words — e.g. 'Built a MERN e-commerce website'" value={p.description} onChange={(e) => updateProject(idx, 'description', e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : saved ? 'Saved ✔' : 'Save profile'}</button>
      </form>

      <div className="space-y-6">
        <div className="stub-card p-5">
          <div className="font-display text-lg text-navy-800 mb-1">AI Resume Parser</div>
          <p className="text-sm text-navy-500 mb-3">Upload a PDF resume — we'll extract your skills automatically.</p>
          <form onSubmit={uploadResume} className="space-y-3">
            <input type="file" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files[0])} className="text-sm" />
            <button className="btn-secondary w-full text-sm" disabled={!resumeFile || parsing}>{parsing ? 'Parsing…' : 'Upload & parse'}</button>
          </form>
          {parsedInfo && (
            <div className="form-rule mt-3 pt-3 text-sm space-y-1">
              {parsedInfo.name && <div><span className="text-navy-400">Name:</span> {parsedInfo.name}</div>}
              {parsedInfo.email && <div><span className="text-navy-400">Email:</span> {parsedInfo.email}</div>}
              <div className="flex flex-wrap gap-1 mt-1">{parsedInfo.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
            </div>
          )}
        </div>

        <div className="stub-card p-5">
          <div className="font-display text-lg text-navy-800 mb-1">AI Resume Improvement</div>
          <p className="text-sm text-navy-500 mb-3">Get suggestions to strengthen your profile.</p>
          <button onClick={loadSuggestions} className="btn-secondary w-full text-sm">Get suggestions</button>
          {suggestions && (
            <ul className="mt-3 space-y-2 text-sm text-navy-600">
              {suggestions.map((s, i) => <li key={i}>☐ {s}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function GapAnalysis() {
  const [gaps, setGaps] = useState(null);
  useEffect(() => { api.get('/student/gap-analysis').then((r) => setGaps(r.data)); }, []);

  if (!gaps) return <SkeletonList />;
  if (gaps.length === 0) return <EmptyState text="No demand data yet — once internships are posted, your gap analysis appears here." />;

  const max = Math.max(...gaps.map((g) => g.demandCount), 1);

  return (
    <div className="stub-card p-6">
      <div className="font-display text-lg text-navy-800 mb-1">Skills vs. market demand</div>
      <p className="text-sm text-navy-500 mb-5">Ranked by how often each skill appears across current internship postings.</p>
      <div className="space-y-3">
        {gaps.map((g) => (
          <div key={g.skill} className="flex items-center gap-3">
            <div className="w-32 shrink-0 text-sm font-medium text-navy-700 capitalize">{g.skill}</div>
            <div className="flex-1 h-2.5 rounded-full bg-navy-50 overflow-hidden">
              <div className={`h-full rounded-full ${g.have ? 'bg-leaf-500' : 'bg-saffron-500'}`} style={{ width: `${(g.demandCount / max) * 100}%` }} />
            </div>
            <div className="w-20 text-right text-xs font-mono">{g.have ? <span className="text-leaf-600">✔ have</span> : <span className="text-saffron-600">learn this</span>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Applications() {
  const [apps, setApps] = useState(null);
  useEffect(() => { api.get('/student/applications').then((r) => setApps(r.data)); }, []);

  const statusColor = { applied: 'bg-navy-100 text-navy-700', shortlisted: 'bg-saffron-100 text-saffron-700', interview: 'bg-saffron-400/20 text-saffron-700', offered: 'bg-leaf-100 text-leaf-700', rejected: 'bg-red-50 text-red-600' };

  if (!apps) return <SkeletonList />;
  if (apps.length === 0) return <EmptyState text="You haven't applied to anything yet — check Recommendations." />;

  return (
    <div className="stub-card divide-y divide-navy-100">
      {apps.map((a) => (
        <div key={a.id} className="p-5 flex items-center gap-4">
          <MatchSeal score={a.match_score} size={48} />
          <div className="flex-1">
            <div className="font-display text-navy-800">{a.title}</div>
            <div className="text-sm text-navy-500">{a.company_name} · {a.location} · applied {new Date(a.applied_at).toLocaleDateString()}</div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColor[a.status] || 'bg-navy-100 text-navy-700'}`}>{a.status}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
function Assistant() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! Ask me things like \"Best internships for me?\", \"What skills should I learn?\", or \"Why wasn't I selected for X?\"" },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  async function send(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setMessages((m) => [...m, { from: 'user', text }]);
    setInput('');
    setSending(true);
    try {
      const { data } = await api.post('/student/chatbot', { message: text });
      setMessages((m) => [...m, { from: 'bot', text: data.reply }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="stub-card p-5 max-w-2xl">
      <div className="font-display text-lg text-navy-800 mb-1">AI Assistant</div>
      <p className="text-sm text-navy-500 mb-4">Guidance based on your live profile and application history.</p>
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`text-sm rounded-card px-3.5 py-2.5 max-w-[85%] ${m.from === 'bot' ? 'bg-navy-50 text-navy-700' : 'bg-navy-600 text-white ml-auto'}`}>
            {m.text}
          </div>
        ))}
        {sending && <div className="text-sm text-navy-400 italic">thinking…</div>}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…" />
        <button className="btn-primary shrink-0" disabled={sending}>Send</button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
function SkeletonList() {
  return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-card bg-navy-50 animate-pulse" />)}</div>;
}
function EmptyState({ text }) {
  return <div className="stub-card p-10 text-center text-navy-400 text-sm">{text}</div>;
}
