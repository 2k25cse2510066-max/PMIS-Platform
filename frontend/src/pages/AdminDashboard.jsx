import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/client';

function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) =>
        keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            if (typeof cell === 'object') cell = JSON.stringify(cell);
            cell = String(cell).replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
          })
          .join(separator)
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen relative z-10">
      <Navbar search={search} onSearchChange={setSearch} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Admin Control Room Hero Banner */}
        <div className="glass-panel p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-purple-900/80 text-white border-slate-200/90 dark:border-white/15">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-500 text-white flex items-center justify-center font-display font-bold text-2xl shadow-lg border border-white/20 shrink-0">
                🏛️
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight">Internship Operations Control Room[Developer]</h1>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">System Administrator</span>
                </div>
                <p className="text-slate-200 text-xs mt-1 font-medium">Verify company & student entities, audit allocation seat utilization, and export system analytics.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1.5 glass-panel !rounded-2xl border-slate-200/90 dark:border-white/15 overflow-x-auto">
          {['Overview', 'Companies', 'Students'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-200 ${tab === t
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
                }`}
            >
              {t === 'Overview' ? '📊 System Analytics' : t === 'Companies' ? '🏢 Company Verification' : '🎓 Student Verification'}
            </button>
          ))}
        </div>

        {tab === 'Overview' && <Overview />}
        {tab === 'Companies' && <Companies search={search} />}
        {tab === 'Students' && <Students search={search} />}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="glass-card p-5 border-slate-200/90 dark:border-white/15">
      <div className={`font-display text-3xl font-black ${accent || 'text-slate-900 dark:text-white'}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono mt-1 font-bold">{label}</div>
    </div>
  );
}

function Overview() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/admin/analytics').then((r) => setData(r.data)); }, []);
  if (!data) return <div className="h-40 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse border border-slate-300/60 dark:border-white/10" />;

  const maxSkill = Math.max(...data.topSkills.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Platform Metrics</h2>
        <button
          onClick={() => exportToCSV('pmis_platform_analytics.csv', [
            { Metric: 'Total Students', Value: data.totalStudents },
            { Metric: 'Total Companies', Value: data.totalCompanies },
            { Metric: 'Verified Companies', Value: data.verifiedCompanies },
            { Metric: 'Total Internships', Value: data.totalInternships },
            { Metric: 'Total Applications', Value: data.totalApplications },
            { Metric: 'Seat Utilization', Value: `${data.seatUtilization}%` }
          ])}
          className="btn-secondary text-xs !py-1.5 !px-3"
        >
          📥 Export Analytics CSV
        </button>
      </div>

      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Stat label="Students" value={data.totalStudents} />
        <Stat label="Companies" value={data.totalCompanies} />
        <Stat label="Verified cos." value={data.verifiedCompanies} accent="text-emerald-600 dark:text-emerald-400" />
        <Stat label="Internships" value={data.totalInternships} />
        <Stat label="Applications" value={data.totalApplications} />
        <Stat label="Seat utilization" value={`${data.seatUtilization}%`} accent="text-amber-600 dark:text-amber-400" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6 border-slate-200/90 dark:border-white/15 space-y-3">
          <div className="font-display text-base text-slate-900 dark:text-white font-bold">Top Skill Demand</div>
          {data.topSkills.length === 0 ? <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No student skill data yet.</p> : (
            <div className="space-y-2.5">
              {data.topSkills.map((s) => (
                <div key={s.skill} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 text-xs capitalize text-slate-800 dark:text-slate-200 font-medium">{s.skill}</div>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${(s.count / maxSkill) * 100}%` }} />
                  </div>
                  <div className="w-6 text-right text-xs font-mono text-indigo-700 dark:text-indigo-300 font-bold">{s.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6 border-slate-200/90 dark:border-white/15 space-y-3">
          <div className="font-display text-base text-slate-900 dark:text-white font-bold">Applications by Status</div>
          {data.statusBreakdown.length === 0 ? <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No applications yet.</p> : (
            <div className="space-y-2.5">
              {data.statusBreakdown.map((s) => (
                <div key={s.status} className="flex items-center justify-between text-xs">
                  <span className="capitalize text-slate-800 dark:text-slate-200 font-medium">{s.status}</span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Companies({ search }) {
  const [companies, setCompanies] = useState(null);
  const load = useCallback(() => { api.get('/admin/companies').then((r) => setCompanies(r.data)); }, []);
  useEffect(() => { load(); }, [load]);

  async function verify(userId) {
    await api.put(`/admin/companies/${userId}/verify`);
    load();
  }

  if (!companies) return <div className="h-40 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse border border-slate-300/60 dark:border-white/10" />;

  const filtered = companies.filter((c) => {
    const q = (search || '').toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="font-display text-lg text-slate-900 dark:text-white font-bold">Registered Companies ({filtered.length})</h2>
        <button
          onClick={() => exportToCSV('pmis_companies.csv', companies.map((c) => ({ Name: c.name, Email: c.email, Description: c.description || '', Verified: c.verified ? 'Yes' : 'No' })))}
          className="btn-secondary text-xs !py-1.5 !px-3"
        >
          📥 Export Companies CSV
        </button>
      </div>
      <div className="glass-card divide-y divide-slate-200 dark:divide-white/10 border-slate-200/90 dark:border-white/15">
        {filtered.map((c) => (
          <div key={c.user_id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">{c.email}</div>
              {c.description && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">{c.description}</div>}
            </div>
            {c.verified ? (
              <span className="chip font-bold">Verified</span>
            ) : (
              <button onClick={() => verify(c.user_id)} className="btn-saffron text-xs !px-4 !py-1.5 shrink-0">Verify</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Students({ search }) {
  const [students, setStudents] = useState(null);
  const load = useCallback(() => { api.get('/admin/students').then((r) => setStudents(r.data)); }, []);
  useEffect(() => { load(); }, [load]);

  async function verify(userId) {
    await api.put(`/admin/students/${userId}/verify`);
    load();
  }

  if (!students) return <div className="h-40 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse border border-slate-300/60 dark:border-white/10" />;

  const filtered = students.filter((s) => {
    const q = (search || '').toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="font-display text-lg text-slate-900 dark:text-white font-bold">Registered Students ({filtered.length})</h2>
        <button
          onClick={() => exportToCSV('pmis_students.csv', students.map((s) => ({ Name: s.name || '', Email: s.email, Phone: s.phone || '', Location: s.location || '', CGPA: s.cgpa || '', Verified: s.verified ? 'Yes' : 'No', Skills: (s.skills || []).join('; ') })))}
          className="btn-secondary text-xs !py-1.5 !px-3"
        >
          📥 Export Students CSV
        </button>
      </div>
      <div className="glass-card divide-y divide-slate-200 dark:divide-white/10 border-slate-200/90 dark:border-white/15">
        {filtered.map((s) => (
          <div key={s.user_id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">{s.name || 'Unnamed'}</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">{s.email} {s.location && `· ${s.location}`}</div>
              <div className="flex flex-wrap gap-1 mt-1.5">{s.skills.slice(0, 6).map((sk) => <span key={sk} className="chip">{sk}</span>)}</div>
            </div>
            {s.verified ? (
              <span className="chip font-bold">Verified</span>
            ) : (
              <button onClick={() => verify(s.user_id)} className="btn-saffron text-xs !px-4 !py-1.5 shrink-0">Verify</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
