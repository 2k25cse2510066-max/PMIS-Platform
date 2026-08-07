import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import MatchSeal from '../components/MatchSeal';
import api from '../api/client';

const TABS = ['Recommendations', 'Profile', 'Gap Analysis', 'Applications', 'Assistant'];

export default function StudentDashboard() {
  const [tab, setTab] = useState('Recommendations');
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ recommendationsCount: 0, appliedCount: 0 });

  const loadProfile = useCallback(() => {
    api.get('/student/profile').then((r) => setProfile(r.data));
    api.get('/student/recommendations').then((r) => setStats((s) => ({ ...s, recommendationsCount: r.data.length })));
    api.get('/student/applications').then((r) => setStats((s) => ({ ...s, appliedCount: r.data.length })));
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-5 py-8 space-y-6">
        {/* Hero Banner */}
        <div className="glass-card p-6 border-navy-100/90 relative overflow-hidden bg-gradient-to-r from-navy-800 to-navy-700 text-white">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center font-display font-bold text-2xl shadow-inner">
                {profile?.name ? profile.name[0] : 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                    {profile?.name ? `Welcome back, ${profile.name.split(' ')[0]}` : 'Your Allocation Dashboard'}
                  </h1>
                  {profile?.verified ? (
                    <span className="bg-leaf-500/20 text-leaf-300 border border-leaf-400/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">✔ Verified</span>
                  ) : null}
                </div>
                <p className="text-navy-100/80 text-sm mt-1">AI-powered internship matching, real-time application tracking, and skill gap analytics.</p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl px-4 py-2.5 text-center">
                <div className="font-mono text-xl font-bold text-saffron-400">{stats.recommendationsCount}</div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-navy-100">Top Matches</div>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl px-4 py-2.5 text-center">
                <div className="font-mono text-xl font-bold text-leaf-400">{stats.appliedCount}</div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-navy-100">Applied</div>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl px-4 py-2.5 text-center">
                <div className="font-mono text-xl font-bold text-white">{(profile?.skills || []).length}</div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-navy-100">Skills</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1.5 bg-white border border-navy-100 rounded-2xl shadow-sm overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${
                tab === t
                  ? 'bg-navy-600 text-white shadow-sm'
                  : 'text-navy-600 hover:text-navy-800 hover:bg-navy-50'
              }`}
            >
              {t === 'Assistant' ? '✨ AI Assistant' : t}
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
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [minScore, setMinScore] = useState('0');

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

  const filteredItems = items.filter((i) => {
    const q = search.toLowerCase();
    const matchesSearch =
      i.title.toLowerCase().includes(q) ||
      i.company_name.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q) ||
      i.required_skills.some((s) => s.toLowerCase().includes(q));

    const matchesType = typeFilter === 'All' || i.type === typeFilter;
    const matchesScore = i.match.overall >= Number(minScore);

    return matchesSearch && matchesType && matchesScore;
  });

  return (
    <div className="space-y-4">
      <div className="stub-card p-4 grid sm:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Search by title, skill, company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input text-xs"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input text-xs"
        >
          <option value="All">All Types (Remote / On-site / Hybrid)</option>
          <option value="Remote">Remote</option>
          <option value="On-site">On-site</option>
          <option value="Hybrid">Hybrid</option>
        </select>
        <select
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
          className="input text-xs"
        >
          <option value="0">All Match Scores</option>
          <option value="60">60%+ Match</option>
          <option value="75">75%+ Match</option>
          <option value="85">85%+ Match</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-widest text-navy-400">
          Showing {filteredItems.length} of {items.length} recommendations
        </p>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState text="No internships match your filter criteria." />
      ) : (
        filteredItems.map((i) => (
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
        ))
      )}
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
    { from: 'bot', text: "Hi! Ask me anything about your internship search, skill gaps, resume tips, or general knowledge!" },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  async function sendMessage(text) {
    if (!text || !text.trim()) return;
    setMessages((m) => [...m, { from: 'user', text }]);
    setSending(true);
    try {
      const { data } = await api.post('/student/chatbot', { message: text });
      setMessages((m) => [...m, { from: 'bot', text: data.reply }]);
    } finally {
      setSending(false);
    }
  }

  function send(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input;
    setInput('');
    sendMessage(text);
  }

  const promptChips = [
    '✨ Best internships for me?',
    '💡 What skills should I learn?',
    '🎯 Technical interview tips',
    '📄 My resume status',
    '⚡ Who are you?'
  ];

  return (
    <div className="glass-card p-6 max-w-3xl space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <div className="font-display text-xl font-bold text-navy-800 flex items-center gap-2">
            <span>✨ AI Career Assistant</span>
            <span className="text-[10px] uppercase font-mono bg-saffron-100 text-saffron-700 px-2 py-0.5 rounded-md font-semibold">Generative LLM</span>
          </div>
          <p className="text-xs text-navy-500 mt-0.5">Live career guidance based on your student profile and application history.</p>
        </div>
      </div>

      <div className="space-y-3 mb-4 max-h-[420px] overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm rounded-2xl px-4 py-3 max-w-[85%] shadow-sm leading-relaxed ${
              m.from === 'bot'
                ? 'bg-navy-50/90 border border-navy-100/80 text-navy-800 rounded-tl-xs'
                : 'bg-gradient-to-r from-navy-700 to-navy-600 text-white ml-auto rounded-tr-xs'
            }`}
          >
            {m.text}
          </div>
        ))}
        {sending && <div className="text-xs text-navy-400 font-mono italic animate-pulse">AI is thinking…</div>}
      </div>

      {/* Prompt Chips */}
      <div className="flex flex-wrap gap-1.5 pt-2">
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={sending}
            onClick={() => sendMessage(chip.replace(/^[✨💡🎯📄⚡]\s*/, ''))}
            className="text-xs bg-navy-50 hover:bg-navy-100 text-navy-700 font-medium px-3 py-1.5 rounded-xl border border-navy-200/60 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      <form onSubmit={send} className="flex gap-2 pt-2">
        <input
          className="input !rounded-xl text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask any question (e.g. 'What skills to learn?', 'Code a binary search', 'Interview tips')..."
        />
        <button className="btn-primary shrink-0 !rounded-xl !px-6" disabled={sending}>
          {sending ? 'Sending…' : 'Send'}
        </button>
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
