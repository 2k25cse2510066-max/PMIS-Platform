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
          {[
            { id: 'Overview', label: '📊 System Analytics' },
            { id: 'Companies', label: '🏢 Company Verification' },
            { id: 'Students', label: '🎓 Student Verification' },
            { id: 'Premium', label: '👑 Premium Approvals' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-200 ${tab === t.id
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'Overview' && <Overview />}
        {tab === 'Companies' && <Companies search={search} />}
        {tab === 'Students' && <Students search={search} />}
        {tab === 'Premium' && <PremiumApprovals search={search} />}
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

function PremiumApprovals({ search }) {
  const [requests, setRequests] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'active' | 'rejected'
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectPromptUserId, setRejectPromptUserId] = useState(null);
  const [rejectReason, setRejectReason] = useState('Incomplete skill or project portfolio');

  const load = useCallback(() => {
    api.get('/admin/premium-requests')
      .then((r) => setRequests(r.data))
      .catch(() => setRequests([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approve(userId) {
    setActionLoading(userId);
    try {
      await api.put(`/admin/premium-requests/${userId}/approve`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve premium');
    } finally {
      setActionLoading(null);
    }
  }

  async function reject(userId) {
    setActionLoading(userId);
    try {
      await api.put(`/admin/premium-requests/${userId}/reject`, { reason: rejectReason });
      setRejectPromptUserId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to decline request');
    } finally {
      setActionLoading(null);
    }
  }

  async function revoke(userId) {
    if (!window.confirm('Are you sure you want to revoke Premium access for this candidate?')) return;
    setActionLoading(userId);
    try {
      await api.put(`/admin/premium-requests/${userId}/revoke`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to revoke premium');
    } finally {
      setActionLoading(null);
    }
  }

  if (!requests) {
    return <div className="h-40 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse border border-slate-300/60 dark:border-white/10" />;
  }

  const q = (search || '').toLowerCase();
  const filtered = requests.filter((r) => {
    const matchesSearch = (r.name || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const activeCount = requests.filter((r) => r.status === 'active').length;

  return (
    <div className="space-y-4">
      {/* Header with Stats & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg text-slate-900 dark:text-white font-bold">
              👑 Premium Candidate Approvals ({filtered.length})
            </h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-mono font-bold animate-pulse">
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
            Verify and activate scheme premium tier privileges (priority ranking, unlimited ATS parser, and AI Career Mentor).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-200/70 dark:bg-white/10 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg transition-all ${filterStatus === 'all' ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 rounded-lg transition-all ${filterStatus === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1 rounded-lg transition-all ${filterStatus === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Active ({activeCount})
            </button>
          </div>

          <button
            onClick={() => exportToCSV('pmis_premium_candidates.csv', requests.map((r) => ({
              Name: r.name,
              Email: r.email,
              Phone: r.phone || '',
              Location: r.location || '',
              CGPA: r.cgpa || '',
              Plan: r.plan || 'PMIS Early Access Pro',
              Status: r.status,
              RequestedAt: r.requested_at || '',
              ActivatedAt: r.activated_at || '',
              Note: r.note || '',
            })))}
            className="btn-secondary text-xs !py-1.5 !px-3"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Requests List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          No premium requests found matching your filter.
        </div>
      ) : (
        <div className="glass-card divide-y divide-slate-200 dark:divide-white/10 border-slate-200/90 dark:border-white/15">
          {filtered.map((r) => (
            <div key={r.id || r.user_id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-display font-extrabold text-slate-900 dark:text-white text-base">
                    {r.name || 'Candidate'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">({r.email})</span>
                  
                  {r.status === 'active' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <span>✔</span> Active Premium
                    </span>
                  )}
                  {r.status === 'pending' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                      <span>⏳</span> Verification Pending
                    </span>
                  )}
                  {r.status === 'rejected' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wider">
                      ✕ Declined
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                  {r.cgpa && <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">CGPA: {r.cgpa}</span>}
                  {r.location && <span>📍 {r.location}</span>}
                  {r.phone && <span>📞 {r.phone}</span>}
                  <span className="text-slate-400 font-mono text-[11px]">
                    Requested: {r.requested_at ? new Date(r.requested_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>

                {r.note && (
                  <div className="text-xs bg-slate-100 dark:bg-white/5 p-2 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 max-w-xl">
                    <span className="font-bold text-slate-500">Applicant Note: </span>
                    <span>"{r.note}"</span>
                  </div>
                )}

                {r.skills && r.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {r.skills.slice(0, 5).map((sk) => (
                      <span key={sk} className="chip text-[10px] !py-0.5">{sk}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {r.status === 'pending' && (
                  <>
                    <button
                      onClick={() => approve(r.user_id)}
                      disabled={actionLoading === r.user_id}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs font-black shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <span>👑</span>
                      <span>{actionLoading === r.user_id ? 'Activating...' : 'Approve & Activate'}</span>
                    </button>
                    
                    <button
                      onClick={() => setRejectPromptUserId(r.user_id)}
                      disabled={actionLoading === r.user_id}
                      className="btn-secondary text-xs !py-2 !px-3 text-rose-600 hover:bg-rose-500/10"
                    >
                      Decline
                    </button>
                  </>
                )}

                {r.status === 'active' && (
                  <button
                    onClick={() => revoke(r.user_id)}
                    disabled={actionLoading === r.user_id}
                    className="btn-secondary text-xs !py-1.5 !px-3 text-slate-500 hover:text-rose-600"
                  >
                    Revoke Status
                  </button>
                )}

                {r.status === 'rejected' && (
                  <button
                    onClick={() => approve(r.user_id)}
                    disabled={actionLoading === r.user_id}
                    className="btn-secondary text-xs !py-1.5 !px-3 text-amber-600"
                  >
                    Re-Approve
                  </button>
                )}
              </div>

              {/* Quick Decline Reason Modal / Form */}
              {rejectPromptUserId === r.user_id && (
                <div className="w-full mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for declining..."
                    className="input text-xs flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => reject(r.user_id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow"
                    >
                      Confirm Decline
                    </button>
                    <button
                      onClick={() => setRejectPromptUserId(null)}
                      className="btn-secondary text-xs !py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

