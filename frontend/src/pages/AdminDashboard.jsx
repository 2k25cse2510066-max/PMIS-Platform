import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/client';

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="max-w-6xl mx-auto px-5 py-8">
        <h1 className="font-display text-3xl text-navy-800 mb-1">Control room</h1>
        <p className="text-navy-500 text-sm mb-6">Verification queue and allocation analytics.</p>

        <div className="flex gap-1 border-b border-navy-100 mb-6">
          {['Overview', 'Companies', 'Students'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-navy-600 text-navy-800' : 'border-transparent text-navy-400 hover:text-navy-600'}`}>
              {t}
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
      <div className={`font-display text-3xl ${accent || 'text-navy-800'}`}>{value}</div>
      <div className="text-xs uppercase tracking-wide text-navy-400 mt-1">{label}</div>
    </div>
  );
}

function Overview() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/admin/analytics').then((r) => setData(r.data)); }, []);
  if (!data) return <div className="h-40 rounded-card bg-navy-50 animate-pulse" />;

  const maxSkill = Math.max(...data.topSkills.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Stat label="Students" value={data.totalStudents} />
        <Stat label="Companies" value={data.totalCompanies} />
        <Stat label="Verified cos." value={data.verifiedCompanies} accent="text-leaf-600" />
        <Stat label="Internships" value={data.totalInternships} />
        <Stat label="Applications" value={data.totalApplications} />
        <Stat label="Seat utilization" value={`${data.seatUtilization}%`} accent="text-saffron-600" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="stub-card p-5">
          <div className="font-display text-lg text-navy-800 mb-3">Top skill demand</div>
          {data.topSkills.length === 0 ? <p className="text-sm text-navy-400">No student skill data yet.</p> : (
            <div className="space-y-2.5">
              {data.topSkills.map((s) => (
                <div key={s.skill} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 text-sm capitalize text-navy-700">{s.skill}</div>
                  <div className="flex-1 h-2.5 rounded-full bg-navy-50 overflow-hidden">
                    <div className="h-full rounded-full bg-navy-600" style={{ width: `${(s.count / maxSkill) * 100}%` }} />
                  </div>
                  <div className="w-6 text-right text-xs font-mono text-navy-500">{s.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stub-card p-5">
          <div className="font-display text-lg text-navy-800 mb-3">Applications by status</div>
          {data.statusBreakdown.length === 0 ? <p className="text-sm text-navy-400">No applications yet.</p> : (
            <div className="space-y-2.5">
              {data.statusBreakdown.map((s) => (
                <div key={s.status} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-navy-600">{s.status}</span>
                  <span className="font-mono font-medium text-navy-800">{s.count}</span>
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

  if (!companies) return <div className="h-40 rounded-card bg-navy-50 animate-pulse" />;

  return (
    <div className="stub-card divide-y divide-navy-100">
      {companies.map((c) => (
        <div key={c.user_id} className="p-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-medium text-navy-800">{c.name}</div>
            <div className="text-xs text-navy-400">{c.email}</div>
            {c.description && <div className="text-sm text-navy-500 mt-1 max-w-lg">{c.description}</div>}
          </div>
          {c.verified ? (
            <span className="chip">Verified</span>
          ) : (
            <button onClick={() => verify(c.user_id)} className="btn-saffron text-sm !px-4 !py-1.5 shrink-0">Verify</button>
          )}
        </div>
      ))}
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

  if (!students) return <div className="h-40 rounded-card bg-navy-50 animate-pulse" />;

  return (
    <div className="stub-card divide-y divide-navy-100">
      {students.map((s) => (
        <div key={s.user_id} className="p-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-medium text-navy-800">{s.name || 'Unnamed'}</div>
            <div className="text-xs text-navy-400">{s.email} {s.location && `· ${s.location}`}</div>
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
  );
}
