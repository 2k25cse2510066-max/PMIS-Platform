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
  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-navy-950 text-navy-800 dark:text-navy-100 transition-colors duration-200">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-5 py-8 space-y-6">
        {/* Admin Control Room Hero Banner */}
        <div className="glass-card p-6 border-navy-100/90 dark:border-navy-800 relative overflow-hidden bg-gradient-to-r from-navy-800 via-navy-700 to-navy-800 text-white shadow-md">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center font-display font-bold text-2xl shadow-inner shrink-0">
                🏛️
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">MCA Admin Control Room</h1>
                  <span className="bg-saffron-500/20 text-saffron-300 border border-saffron-400/30 text-xs font-semibold px-3 py-1 rounded-full">System Overseer</span>
                </div>
                <p className="text-navy-100/80 text-sm mt-1">Verify company & student entities, audit allocation seat utilization, and export system analytics.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1.5 bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 rounded-2xl shadow-sm overflow-x-auto">
          {['Overview', 'Companies', 'Students'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${
                tab === t
                  ? 'bg-navy-600 dark:bg-navy-500 text-white shadow-sm'
                  : 'text-navy-600 dark:text-navy-300 hover:text-navy-800 dark:hover:text-white hover:bg-navy-50 dark:hover:bg-navy-800'
              }`}
            >
              {t === 'Overview' ? '📊 System Analytics' : t === 'Companies' ? '🏢 Company Verification' : '🎓 Student Verification'}
            </button>
          ))}
        </div>

        {tab === 'Overview' && <Overview />}
        {tab === 'Companies' && <Companies />}
        {tab === 'Students' && <Students />}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="stub-card p-5">
      <div className={`font-display text-3xl font-bold ${accent || 'text-navy-800 dark:text-navy-100'}`}>{value}</div>
      <div className="text-xs uppercase tracking-wide text-navy-500 dark:text-navy-400 mt-1 font-mono">{label}</div>
    </div>
  );
}

function Overview() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/admin/analytics').then((r) => setData(r.data)); }, []);
  if (!data) return <div className="h-40 rounded-card bg-navy-50 dark:bg-navy-900 animate-pulse" />;

  const maxSkill = Math.max(...data.topSkills.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold text-navy-800 dark:text-navy-100">Platform metrics</h2>
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
        <Stat label="Verified cos." value={data.verifiedCompanies} accent="text-leaf-600 dark:text-leaf-400" />
        <Stat label="Internships" value={data.totalInternships} />
        <Stat label="Applications" value={data.totalApplications} />
        <Stat label="Seat utilization" value={`${data.seatUtilization}%`} accent="text-saffron-600 dark:text-saffron-400" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="stub-card p-5">
          <div className="font-display text-lg text-navy-800 dark:text-navy-100 font-semibold mb-3">Top skill demand</div>
          {data.topSkills.length === 0 ? <p className="text-sm text-navy-400 dark:text-navy-500">No student skill data yet.</p> : (
            <div className="space-y-2.5">
              {data.topSkills.map((s) => (
                <div key={s.skill} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 text-sm capitalize text-navy-700 dark:text-navy-200">{s.skill}</div>
                  <div className="flex-1 h-2.5 rounded-full bg-navy-50 dark:bg-navy-950 overflow-hidden">
                    <div className="h-full rounded-full bg-navy-600 dark:bg-navy-400" style={{ width: `${(s.count / maxSkill) * 100}%` }} />
                  </div>
                  <div className="w-6 text-right text-xs font-mono text-navy-500 dark:text-navy-400">{s.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stub-card p-5">
          <div className="font-display text-lg text-navy-800 dark:text-navy-100 font-semibold mb-3">Applications by status</div>
          {data.statusBreakdown.length === 0 ? <p className="text-sm text-navy-400 dark:text-navy-500">No applications yet.</p> : (
            <div className="space-y-2.5">
              {data.statusBreakdown.map((s) => (
                <div key={s.status} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-navy-600 dark:text-navy-300">{s.status}</span>
                  <span className="font-mono font-medium text-navy-800 dark:text-navy-100">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Companies() {
  const [companies, setCompanies] = useState(null);
  const load = useCallback(() => { api.get('/admin/companies').then((r) => setCompanies(r.data)); }, []);
  useEffect(() => { load(); }, [load]);

  async function verify(userId) {
    await api.put(`/admin/companies/${userId}/verify`);
    load();
  }

  if (!companies) return <div className="h-40 rounded-card bg-navy-50 dark:bg-navy-900 animate-pulse" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="font-display text-lg text-navy-800 dark:text-navy-100 font-semibold">Registered Companies ({companies.length})</h2>
        <button
          onClick={() => exportToCSV('pmis_companies.csv', companies.map((c) => ({ Name: c.name, Email: c.email, Description: c.description || '', Verified: c.verified ? 'Yes' : 'No' })))}
          className="btn-secondary text-xs !py-1.5 !px-3"
        >
          📥 Export Companies CSV
        </button>
      </div>
      <div className="stub-card divide-y divide-navy-100 dark:divide-navy-800">
        {companies.map((c) => (
          <div key={c.user_id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-medium text-navy-800 dark:text-navy-100">{c.name}</div>
              <div className="text-xs text-navy-500 dark:text-navy-400">{c.email}</div>
              {c.description && <div className="text-sm text-navy-600 dark:text-navy-300 mt-1 max-w-lg">{c.description}</div>}
            </div>
            {c.verified ? (
              <span className="chip">Verified</span>
            ) : (
              <button onClick={() => verify(c.user_id)} className="btn-saffron text-sm !px-4 !py-1.5 shrink-0">Verify</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Students() {
  const [students, setStudents] = useState(null);
  const load = useCallback(() => { api.get('/admin/students').then((r) => setStudents(r.data)); }, []);
  useEffect(() => { load(); }, [load]);

  async function verify(userId) {
    await api.put(`/admin/students/${userId}/verify`);
    load();
  }

  if (!students) return <div className="h-40 rounded-card bg-navy-50 dark:bg-navy-900 animate-pulse" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="font-display text-lg text-navy-800 dark:text-navy-100 font-semibold">Registered Students ({students.length})</h2>
        <button
          onClick={() => exportToCSV('pmis_students.csv', students.map((s) => ({ Name: s.name || '', Email: s.email, Phone: s.phone || '', Location: s.location || '', CGPA: s.cgpa || '', Verified: s.verified ? 'Yes' : 'No', Skills: (s.skills || []).join('; ') })))}
          className="btn-secondary text-xs !py-1.5 !px-3"
        >
          📥 Export Students CSV
        </button>
      </div>
      <div className="stub-card divide-y divide-navy-100 dark:divide-navy-800">
        {students.map((s) => (
          <div key={s.user_id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-medium text-navy-800 dark:text-navy-100">{s.name || 'Unnamed'}</div>
              <div className="text-xs text-navy-500 dark:text-navy-400">{s.email} {s.location && `· ${s.location}`}</div>
              <div className="flex flex-wrap gap-1 mt-1.5">{s.skills.slice(0, 6).map((sk) => <span key={sk} className="chip">{sk}</span>)}</div>
            </div>
            {s.verified ? (
              <span className="chip">Verified</span>
            ) : (
              <button onClick={() => verify(s.user_id)} className="btn-saffron text-sm !px-4 !py-1.5 shrink-0">Verify</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
