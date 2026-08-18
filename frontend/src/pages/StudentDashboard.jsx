import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MatchSeal from '../components/MatchSeal';
import { useAuth } from '../context/AuthContext';
import ResumeReportModal from '../components/ResumeReportModal';
import InternshipCompareModal from '../components/InternshipCompareModal';
import api from '../api/client';

const TABS = ['Recommendations', 'Profile', 'Gap Analysis', 'Applications', 'Assistant'];

export function checkProfileCompletion(profile) {
  if (!profile) {
    return {
      complete: false,
      missingFields: ['Full Name', 'Phone Number', 'Preferred Location', 'CGPA', 'Skills', 'Resume Upload'],
    };
  }

  const missingFields = [];
  if (!profile.name || !profile.name.trim()) missingFields.push('Full Name');
  if (!profile.phone || !profile.phone.trim()) missingFields.push('Phone Number');
  if (!profile.location || !profile.location.trim()) missingFields.push('Preferred Location');
  if (profile.cgpa === null || profile.cgpa === undefined || profile.cgpa === '' || Number(profile.cgpa) <= 0) missingFields.push('CGPA');
  if (!profile.skills || profile.skills.length === 0) missingFields.push('Skills');
  if (!profile.resume_filename) missingFields.push('Resume Upload');

  return {
    complete: missingFields.length === 0,
    missingFields,
  };
}

function IncompleteProfileModal({ isOpen, onClose, missingFields = [], onGoToProfile }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="glass-panel max-w-md w-full p-6 space-y-5 border-amber-500/40 bg-white/95 dark:bg-[#0F0D25]/95 shadow-2xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
            ⚠️
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
              Application Locked
            </span>
            <h3 className="font-display text-xl font-black text-slate-900 dark:text-white">
              Profile Incomplete
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Without completing your profile, you cannot apply for any internship. Employers require complete profile details for allocation matching.
        </p>

        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 space-y-2.5">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Missing Profile Requirements ({missingFields.length}):
          </span>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {missingFields.map((field) => (
              <div key={field} className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                <span>❌</span>
                <span>{field}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onGoToProfile) onGoToProfile();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-extrabold text-xs shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Complete Profile Now</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState('Recommendations');
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ recommendationsCount: 0, appliedCount: 0 });
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isNewUser = Boolean(location.state?.isNewUser || sessionStorage.getItem('pmis_is_new_user') === 'true');

  const loadProfile = useCallback(() => {
    api.get('/student/profile').then((r) => setProfile(r.data));
    api.get('/student/recommendations').then((r) => setStats((s) => ({ ...s, recommendationsCount: r.data.length })));
    api.get('/student/applications').then((r) => setStats((s) => ({ ...s, appliedCount: r.data.length })));
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const displayName = profile?.name || user?.name || '';
  const firstName = displayName ? displayName.split(' ')[0] : '';
  const avatarInitial = displayName ? displayName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'S');
  const greetingPrefix = isNewUser ? 'Welcome' : 'Welcome back';

  return (
    <div className="min-h-screen relative z-10">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Main Content Layout with Left Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-6">
        {/* Left Glass Sidebar */}
        <Sidebar
          activeTab={tab}
          onSelectTab={setTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Panel */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Welcome Banner Card */}
          <div className="glass-panel p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 text-white border-slate-200/90 dark:border-white/15 shadow-xl">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-display font-black text-xl shadow-lg border border-white/20">
                    {avatarInitial}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {greetingPrefix}{firstName ? `, ${firstName}` : ''}! 👋
                      </h1>
                      {profile?.is_premium && (
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] tracking-wide uppercase flex items-center gap-1 shadow-md shadow-amber-500/30">
                          <span>👑</span>
                          <span>PMIS Premium</span>
                        </span>
                      )}
                      {profile?.premium_status === 'pending' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold text-[10px] tracking-wide flex items-center gap-1 animate-pulse">
                          <span>⏳</span>
                          <span>Premium Pending Review</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-100/90 mt-0.5 font-medium">
                      AI-powered internship matching, real-time application tracking, and skill gap analytics.
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-3 gap-3 shrink-0">
                <div className="glass-card p-3.5 text-center min-w-[100px] border-white/20 bg-white/10 text-white">
                  <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center text-sm font-bold">
                    💼
                  </div>
                  <div className="font-mono text-2xl font-black text-white">{stats.recommendationsCount || 3}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-200">Top Matches</div>
                </div>

                <div className="glass-card p-3.5 text-center min-w-[100px] border-white/20 bg-white/10 text-white">
                  <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-sm font-bold">
                    ✈️
                  </div>
                  <div className="font-mono text-2xl font-black text-white">{stats.appliedCount || 3}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-200">Applied</div>
                </div>

                <div className="glass-card p-3.5 text-center min-w-[100px] border-white/20 bg-white/10 text-white">
                  <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-sm font-bold">
                    {`</>`}
                  </div>
                  <div className="font-mono text-2xl font-black text-white">{(profile?.skills || []).length || 20}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-200">Skills</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 7: Profile Strength & Completion Score Card */}
          <div className="glass-card p-5 border-slate-200/90 dark:border-white/15 bg-gradient-to-r from-slate-900/90 via-indigo-950/90 to-slate-900/90 text-white rounded-3xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-sm text-white">Profile Strength</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
                    {Math.min(100, (profile?.name ? 15 : 0) + (profile?.phone ? 15 : 0) + (profile?.location ? 15 : 0) + (profile?.cgpa ? 15 : 0) + ((profile?.skills || []).length >= 3 ? 20 : 0) + ((profile?.projects || []).length >= 1 ? 10 : 0) + (profile?.resume_filename ? 10 : 0))}% Complete
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-64 h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (profile?.name ? 15 : 0) + (profile?.phone ? 15 : 0) + (profile?.location ? 15 : 0) + (profile?.cgpa ? 15 : 0) + ((profile?.skills || []).length >= 3 ? 20 : 0) + ((profile?.projects || []).length >= 1 ? 10 : 0) + (profile?.resume_filename ? 10 : 0))}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => setTab('Profile')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0 self-start sm:self-center"
              >
                Complete Profile →
              </button>
            </div>

            {/* Checklist */}
            <div className="flex flex-wrap gap-3 text-xs pt-1 border-t border-white/10">
              <span className={`flex items-center gap-1 font-semibold ${profile?.name && profile?.phone && profile?.location ? 'text-emerald-300' : 'text-amber-300'}`}>
                <span>{profile?.name && profile?.phone && profile?.location ? '✓' : '⚠'}</span>
                <span>Basic Information</span>
              </span>
              <span className={`flex items-center gap-1 font-semibold ${(profile?.skills || []).length >= 1 ? 'text-emerald-300' : 'text-amber-300'}`}>
                <span>{(profile?.skills || []).length >= 1 ? '✓' : '⚠'}</span>
                <span>Skills</span>
              </span>
              <span className={`flex items-center gap-1 font-semibold ${profile?.resume_filename ? 'text-emerald-300' : 'text-amber-300'}`}>
                <span>{profile?.resume_filename ? '✓' : '⚠'}</span>
                <span>Resume</span>
              </span>
              <span className={`flex items-center gap-1 font-semibold ${(profile?.projects || []).length >= 1 ? 'text-emerald-300' : 'text-amber-300'}`}>
                <span>{(profile?.projects || []).length >= 1 ? '✓' : '⚠'}</span>
                <span>Projects</span>
              </span>
              <span className={`flex items-center gap-1 font-semibold ${profile?.cgpa ? 'text-emerald-300' : 'text-amber-300'}`}>
                <span>{profile?.cgpa ? '✓' : '⚠'}</span>
                <span>CGPA</span>
              </span>
            </div>

            {!checkProfileCompletion(profile).complete && (
              <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-between flex-wrap gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span><strong>Applications Locked:</strong> You must complete all required profile details to apply for internships.</span>
                </div>
                <button onClick={() => setTab('Profile')} className="font-bold underline text-amber-100 hover:text-white">
                  Complete Details →
                </button>
              </div>
            )}
          </div>

          {/* Segmented Glass Tab Navigation */}
          <div className="flex gap-2 p-1.5 glass-panel !rounded-2xl border-slate-200/90 dark:border-white/15 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-200 ${
                  tab === t
                    ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 dark:from-blue-600 dark:via-indigo-600 dark:to-purple-600 text-white shadow-md shadow-orange-500/20 dark:shadow-indigo-500/30'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
                }`}
              >
                {t === 'Assistant' ? '✨ AI Assistant' : t}
              </button>
            ))}
          </div>

          {/* Active Tab View */}
          {tab === 'Recommendations' && <Recommendations profile={profile} onApplied={loadProfile} search={search} onGoToProfile={() => setTab('Profile')} />}
          {tab === 'Profile' && profile && <ProfileEditor profile={profile} onSaved={setProfile} />}
          {tab === 'Gap Analysis' && <GapAnalysis />}
          {tab === 'Applications' && <Applications />}
          {tab === 'Assistant' && <Assistant />}
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Recommendations({ profile, onApplied, search, onGoToProfile }) {
  const [items, setItems] = useState(null);
  const [applying, setApplying] = useState(null);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [localSearch, setLocalSearch] = useState('');

  // Incomplete profile modal state
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [incompleteFields, setIncompleteFields] = useState([]);

  // PMIS Filter States
  const [providerFilter, setProviderFilter] = useState('All');
  const [stipendFilter, setStipendFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [durationFilter, setDurationFilter] = useState('All');
  const [educationFilter, setEducationFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [minScore, setMinScore] = useState('0');
  const [showFilters, setShowFilters] = useState(true);
  // Comparison State
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  function handleApplyClick(internship) {
    const status = checkProfileCompletion(profile);
    if (!status.complete) {
      setIncompleteFields(status.missingFields);
      setShowIncompleteModal(true);
      return;
    }
    setSelectedInternship(internship);
    setCoverNote('');
  }

  function toggleCompare(item) {
    if (selectedForCompare.some((c) => c.id === item.id)) {
      setSelectedForCompare(selectedForCompare.filter((c) => c.id !== item.id));
    } else {
      if (selectedForCompare.length >= 3) {
        alert('You can compare up to 3 internships at a time.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, item]);
    }
  }

  const activeSearch = search || localSearch;

  const load = useCallback(() => { api.get('/student/recommendations').then((r) => setItems(r.data)); }, []);
  useEffect(() => { load(); }, [load]);

  async function submitApplication() {
    if (!selectedInternship) return;
    const status = checkProfileCompletion(profile);
    if (!status.complete) {
      setIncompleteFields(status.missingFields);
      setShowIncompleteModal(true);
      setSelectedInternship(null);
      return;
    }
    setApplying(selectedInternship.id);
    try {
      await api.post(`/student/apply/${selectedInternship.id}`);
      setSelectedInternship(null);
      setCoverNote('');
      load();
      if (onApplied) onApplied();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit application';
      alert(errorMsg);
      if (err.response?.data?.missingFields) {
        setIncompleteFields(err.response.data.missingFields);
        setShowIncompleteModal(true);
        setSelectedInternship(null);
      }
    } finally {
      setApplying(null);
    }
  }

  function resetFilters() {
    setLocalSearch('');
    setProviderFilter('All');
    setStipendFilter('All');
    setTypeFilter('All');
    setDurationFilter('All');
    setEducationFilter('All');
    setSectorFilter('All');
    setMinScore('0');
  }

  if (!items) return <SkeletonList />;
  if (items.length === 0) return <EmptyState text="No internships posted yet. Check back soon." />;

  // Unique Providers List
  const uniqueProviders = [...new Set(items.map((i) => i.company_name).filter(Boolean))];

  // Helper to parse numeric stipend amount
  function parseStipendVal(stipendStr) {
    if (!stipendStr) return 0;
    const num = stipendStr.replace(/[^0-9]/g, '');
    return num ? Number(num) : 0;
  }

  const filteredItems = items.filter((i) => {
    const q = activeSearch.toLowerCase();
    const matchesSearch =
      !q ||
      i.title.toLowerCase().includes(q) ||
      (i.company_name && i.company_name.toLowerCase().includes(q)) ||
      i.location.toLowerCase().includes(q) ||
      i.required_skills.some((s) => s.toLowerCase().includes(q));

    const matchesProvider = providerFilter === 'All' || i.company_name === providerFilter;
    const matchesType = typeFilter === 'All' || i.type === typeFilter;
    const matchesScore = i.match.overall >= Number(minScore);

    // Stipend Filter
    let matchesStipend = true;
    const val = parseStipendVal(i.stipend);
    if (stipendFilter === '10k+') matchesStipend = val >= 10000;
    else if (stipendFilter === '20k+') matchesStipend = val >= 20000;
    else if (stipendFilter === '30k+') matchesStipend = val >= 30000;

    // Duration Filter
    let matchesDuration = true;
    if (durationFilter !== 'All') {
      const durText = (i.description || '' + i.title).toLowerCase();
      if (durationFilter === '1 Month') matchesDuration = /1 month|4 week/i.test(durText);
      else if (durationFilter === '2-3 Months') matchesDuration = /2 month|3 month|8 week|12 week/i.test(durText);
      else if (durationFilter === '6 Months') matchesDuration = /6 month|24 week/i.test(durText);
    }

    // Educational Qualification Filter
    let matchesEducation = true;
    if (educationFilter !== 'All') {
      const reqText = (i.description || '' + i.title + ' ' + (i.required_skills || []).join(' ')).toLowerCase();
      if (educationFilter === 'B.Tech / B.E.') matchesEducation = !/diploma only/i.test(reqText);
      else if (educationFilter === 'BCA / MCA') matchesEducation = /bca|mca|computer|software|web/i.test(reqText);
      else if (educationFilter === 'Diploma') matchesEducation = /diploma|polytechnic|any degree/i.test(reqText);
    }

    // Sector / Industry Filter
    let matchesSector = true;
    if (sectorFilter !== 'All') {
      const sectorText = (i.title + ' ' + (i.required_skills || []).join(' ')).toLowerCase();
      if (sectorFilter === 'IT & Software') matchesSector = /web|software|frontend|backend|node|react|java|c\+\+/i.test(sectorText);
      else if (sectorFilter === 'AI & Data Science') matchesSector = /data|machine learning|python|ai|analytics/i.test(sectorText);
      else if (sectorFilter === 'E-Commerce & Mobile') matchesSector = /ecommerce|mobile|app|flutter|android|design/i.test(sectorText);
      else if (sectorFilter === 'Finance & Fintech') matchesSector = /finance|account|fintech|bank|analyst/i.test(sectorText);
    }

    return matchesSearch && matchesProvider && matchesType && matchesScore && matchesStipend && matchesDuration && matchesEducation && matchesSector;
  });

  const activeCount = [
    localSearch,
    providerFilter !== 'All',
    stipendFilter !== 'All',
    typeFilter !== 'All',
    durationFilter !== 'All',
    educationFilter !== 'All',
    sectorFilter !== 'All',
    minScore !== '0',
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search & Top Action Bar */}
      <div className="glass-card p-4 space-y-4 border-slate-200/90 dark:border-white/15">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by title, skills, location or company..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="input text-xs !pl-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <span>⚙️ Filter Options</span>
              {activeCount > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                  {activeCount}
                </span>
              )}
            </button>

            <button
              onClick={resetFilters}
              className="px-4 py-2.5 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
              title="Reset all active filters"
            >
              <span>🔄</span>
              <span>RESET</span>
            </button>
          </div>
        </div>

        {/* Detailed PMIS Filter Grid */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-fade-in">
            
            {/* Filter 1: Internship Provider */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>🏢</span> Internship Provider
              </label>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="input text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0C0A1D]"
              >
                <option value="All">All Providers (Companies)</option>
                {uniqueProviders.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Filter 2: Internship Fee / Stipend */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>₹</span> Internship Fee / Stipend
              </label>
              <select
                value={stipendFilter}
                onChange={(e) => setStipendFilter(e.target.value)}
                className="input text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0C0A1D]"
              >
                <option value="All">All Stipends / Fees</option>
                <option value="10k+">₹10,000 / month & above</option>
                <option value="20k+">₹20,000 / month & above</option>
                <option value="30k+">₹30,000 / month & above</option>
              </select>
            </div>

            {/* Filter 3: Mode of Internship */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>💼</span> Mode of Internship
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0C0A1D]"
              >
                <option value="All">All Modes (Remote / On-site / Hybrid)</option>
                <option value="Remote">Remote (Work from Home)</option>
                <option value="On-site">On-site (Office)</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            {/* Filter 4: Internship Duration */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>⏱️</span> Internship Duration
              </label>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="input text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0C0A1D]"
              >
                <option value="All">All Durations</option>
                <option value="1 Month">1 Month</option>
                <option value="2-3 Months">2 - 3 Months</option>
                <option value="6 Months">6 Months</option>
              </select>
            </div>

            {/* Filter 5: Educational Qualification */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>🎓</span> Educational Qualification
              </label>
              <select
                value={educationFilter}
                onChange={(e) => setEducationFilter(e.target.value)}
                className="input text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0C0A1D]"
              >
                <option value="All">All Qualifications</option>
                <option value="B.Tech / B.E.">B.Tech / B.E. (Engineering)</option>
                <option value="BCA / MCA">BCA / MCA / Computer Science</option>
                <option value="Diploma">Diploma / Polytechnic</option>
              </select>
            </div>

            {/* Filter 6: Sector / Industry */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>🔲</span> Sector / Industry
              </label>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="input text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0C0A1D]"
              >
                <option value="All">All Sectors</option>
                <option value="IT & Software">IT & Software Engineering</option>
                <option value="AI & Data Science">AI, Data Science & ML</option>
                <option value="E-Commerce & Mobile">E-Commerce & Apps</option>
                <option value="Finance & Fintech">Finance & Analytics</option>
              </select>
            </div>

            {/* Filter 7: AI Match Threshold */}
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>🎯</span> AI Skill Match Score
              </label>
              <select
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="input text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0C0A1D]"
              >
                <option value="0">All Match Scores</option>
                <option value="60">60%+ Match</option>
                <option value="75">75%+ Match</option>
                <option value="85">85%+ Match</option>
              </select>
            </div>

          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-widest text-indigo-700 dark:text-indigo-300 font-bold">
          Showing {filteredItems.length} of {items.length} recommendations
        </p>

        {activeCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-xs text-orange-600 dark:text-amber-400 font-bold hover:underline"
          >
            Clear {activeCount} filters
          </button>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState text="No internships match your filter criteria." />
      ) : (
        filteredItems.map((i) => (
          <div key={i.id} className="glass-card p-6 border-slate-200/90 dark:border-white/15 hover:border-indigo-500/40 transition-all rounded-3xl space-y-3">
            
            {/* Top Smart Recommendation Rationale Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-white/[0.06] text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[10px]">
                  🔥 Recommended for you
                </span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  You match <strong className="text-indigo-600 dark:text-amber-400 font-black">{i.match.overall}%</strong> of this internship. Your <strong className="text-slate-800 dark:text-white">{i.match.matchedSkills.slice(0, 2).join(' + ') || 'core'}</strong> skills match the requirements.
                </span>
              </div>

              {/* Urgency Badges & Compare Checkbox */}
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                  🔴 Only {i.seats || 2} seats left
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  🟠 Closes in 2 days
                </span>

                <label className="flex items-center gap-1.5 cursor-pointer ml-2 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/15">
                  <input
                    type="checkbox"
                    checked={selectedForCompare.some((c) => c.id === i.id)}
                    onChange={() => toggleCompare(i)}
                    className="w-3.5 h-3.5 rounded text-orange-500 focus:ring-orange-400"
                  />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    Compare
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-1">
              
              {/* Left & Main Info Column */}
              <div className="flex items-start sm:items-center gap-5 flex-1 min-w-0">
                {/* Match Score Gauge */}
                <MatchSeal score={i.match.overall} size={76} />

                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {i.title}
                    </h3>
                    {i.company_verified ? (
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1">
                        ✔ Verified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-500/15 text-slate-700 dark:text-slate-400 text-[10px] font-bold">
                        Company
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {i.company_name || 'TechNova Solutions'}
                  </p>

                  {/* Metadata line */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 flex-wrap">
                    <span>📍 {i.location}</span>
                    <span>•</span>
                    <span>₹ {i.stipend || '₹10,000/month'}</span>
                    <span>•</span>
                    <span>⏱️ {i.type}</span>
                  </div>

                  {/* Required Skills Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {i.required_skills.slice(0, 4).map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-xl bg-slate-200/80 dark:bg-white/[0.07] border border-slate-300/80 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                        {s}
                      </span>
                    ))}
                    {i.required_skills.length > 4 && (
                      <span className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        +{i.required_skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Right Column: Why this match & Missing Skills */}
              <div className="lg:w-72 space-y-2 border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-white/10 pt-3 lg:pt-0 lg:pl-6">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Why this match?</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium mt-0.5">
                    {i.match.reasons[0] || 'Strong match based on your technical skills & experience.'}
                  </p>
                </div>

                {i.match.missingSkills.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-amber-700 dark:text-amber-400 block">Missing Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {i.match.missingSkills.slice(0, 3).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Apply & Save Buttons */}
              <div className="flex flex-row lg:flex-col items-center gap-2 w-full lg:w-36 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-white/10">
                {i.already_applied ? (
                  <span className="w-full text-center py-2.5 px-4 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    ✔ Applied
                  </span>
                ) : (
                  <button
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    onClick={() => handleApplyClick(i)}
                  >
                    {!checkProfileCompletion(profile).complete && <span className="text-amber-300">🔒</span>}
                    <span>Apply Now</span>
                  </button>
                )}

                <button
                  type="button"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-white/15 bg-white/60 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/15 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>🔖</span>
                  <span>Save</span>
                </button>
              </div>

            </div>
          </div>
        ))
      )}

      {/* Floating Comparison Toolbar */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass-panel p-4 bg-slate-900/95 text-white border-white/20 shadow-2xl flex items-center gap-4 rounded-2xl animate-fade-in">
          <span className="text-xs font-mono font-bold text-amber-300">
            ⚖️ {selectedForCompare.length} / 3 Selected for Comparison
          </span>
          <button
            onClick={() => setShowCompareModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            Compare Internships ⚖️
          </button>
          <button
            onClick={() => setSelectedForCompare([])}
            className="text-xs text-slate-400 hover:text-white font-bold"
          >
            Clear
          </button>
        </div>
      )}

      {/* Internship Compare Modal */}
      <InternshipCompareModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        internships={selectedForCompare}
        onApply={(item) => {
          handleApplyClick(item);
          setShowCompareModal(false);
        }}
      />

      {/* Incomplete Profile Modal */}
      <IncompleteProfileModal
        isOpen={showIncompleteModal}
        onClose={() => setShowIncompleteModal(false)}
        missingFields={incompleteFields}
        onGoToProfile={onGoToProfile}
      />

      {/* APPLICATION DETAILS FORM MODAL */}
      {selectedInternship && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelectedInternship(null)}>
          <div className="glass-panel max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border-slate-200/90 dark:border-white/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-purple-600 dark:text-purple-400 font-bold">Application Details Form</span>
                <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{selectedInternship.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">{selectedInternship.company_name} · {selectedInternship.location} ({selectedInternship.type})</p>
              </div>
              <button onClick={() => setSelectedInternship(null)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white text-2xl font-bold">×</button>
            </div>

            <div className="p-4 bg-slate-100/90 dark:bg-white/[0.05] rounded-2xl border border-slate-200 dark:border-white/10 space-y-2">
              <div className="font-display font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                <span>Applicant Profile Summary</span>
                <span className="chip font-mono text-[10px]">Match: {selectedInternship.match.overall}%</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                <div><span className="text-slate-500 font-semibold">Name:</span> {profile?.name || 'Student'}</div>
                <div><span className="text-slate-500 font-semibold">CGPA:</span> {profile?.cgpa || 'N/A'} / 10</div>
                <div><span className="text-slate-500 font-semibold">Phone:</span> {profile?.phone || 'N/A'}</div>
                <div><span className="text-slate-500 font-semibold">Resume:</span> {profile?.resume_filename ? '📄 Attached' : 'Not uploaded'}</div>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 font-semibold text-xs block mb-1">Your Skills:</span>
                <div className="flex flex-wrap gap-1">
                  {(profile?.skills || []).map((s) => <span key={s} className="chip">{s}</span>)}
                </div>
              </div>
            </div>

            <div>
              <label className="label">Cover Note / Additional Comments (Optional)</label>
              <textarea
                className="input text-xs"
                rows={3}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Briefly mention why you're interested in this role or your availability..."
              />
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-200 dark:border-white/10">
              <button type="button" onClick={() => setSelectedInternship(null)} className="btn-secondary text-xs !py-2">
                Cancel
              </button>
              <button
                type="button"
                onClick={submitApplication}
                disabled={applying === selectedInternship.id}
                className="btn-primary text-xs !py-2 !px-5"
              >
                {applying === selectedInternship.id ? 'Submitting Application…' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
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
  const [showReportModal, setShowReportModal] = useState(false);

  const isDirty =
    form.name !== (profile.name || '') ||
    form.phone !== (profile.phone || '') ||
    form.location !== (profile.location || '') ||
    form.preferred_type !== (profile.preferred_type || 'Remote') ||
    String(form.cgpa) !== String(profile.cgpa || '') ||
    form.skills !== (profile.skills || []).join(', ') ||
    JSON.stringify(projects) !== JSON.stringify(profile.projects?.length ? profile.projects : [{ title: '', description: '' }]);

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
      setTimeout(() => setSaved(false), 2500);
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
      setShowReportModal(true);
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
      {/* Profile Editor Form */}
      <form onSubmit={save} className="glass-card p-6 sm:p-8 space-y-5 border-slate-200/90 dark:border-white/15">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">Student Profile</h2>
          </div>
          <div>
            {saved ? (
              <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">
                ✔ Saved
              </span>
            ) : isDirty ? (
              <span className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full">
                ⚠️ Unsaved changes
              </span>
            ) : (
              <span className="bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1 rounded-full">
                Up to date
              </span>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter your full name" /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Enter your phone number" /></div>
          <div><label className="label">Preferred Location</label><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Kanpur" /></div>
          <div>
            <label className="label">Internship Type</label>
            <select className="input text-slate-900 dark:text-white bg-white dark:bg-[#0C0A1D]" value={form.preferred_type} onChange={(e) => setForm({ ...form, preferred_type: e.target.value })}>
              <option value="Remote">Remote</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
          <div><label className="label">CGPA (Out of 10)</label><input className="input" type="number" step="0.1" min="0" max="10" value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })} placeholder="e.g. 8.5" /></div>
        </div>

        <div>
          <label className="label">{`</>`} Skills (comma separated)</label>
          <textarea className="input" rows={3} value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="react, javascript, html, css, node.js, mongodb, python, c++, dsa" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label !mb-0">📁 Projects</label>
            <button type="button" onClick={() => setProjects([...projects, { title: '', description: '' }])} className="text-xs text-indigo-600 dark:text-indigo-300 hover:underline font-bold">+ Add Project</button>
          </div>
          <div className="space-y-3">
            {projects.map((p, idx) => (
              <div key={idx} className="border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-2 bg-slate-100/60 dark:bg-white/[0.04]">
                <input className="input text-xs" placeholder="Project title" value={p.title} onChange={(e) => updateProject(idx, 'title', e.target.value)} />
                <textarea className="input text-xs" rows={2} placeholder="Describe it in your own words — e.g. 'Built a MERN e-commerce website'" value={p.description} onChange={(e) => updateProject(idx, 'description', e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <button className="btn-primary" disabled={saving}>
          {saving ? 'Saving Profile…' : saved ? 'Saved ✔' : '💾 Save Profile'}
        </button>
      </form>

      {/* Right Sidebar Cards */}
      <div className="space-y-6">
        {/* Card 1: AI Resume Parser */}
        <div className="glass-card p-6 border-slate-200/90 dark:border-white/15 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xl">
              📄
            </div>
            <div>
              <div className="font-display font-bold text-base text-slate-900 dark:text-white">AI Resume Parser</div>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Upload a PDF resume — we'll extract your skills & launch full AI Analysis automatically.
          </p>
          <form onSubmit={uploadResume} className="space-y-3">
            <input type="file" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files[0])} className="text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/15 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-500/25 cursor-pointer" />
            <button className="btn-primary w-full text-xs !py-2.5" disabled={!resumeFile || parsing}>
              {parsing ? 'Parsing Resume…' : 'Upload & Launch AI Analysis'}
            </button>
          </form>

          {(parsedInfo || profile?.resume_filename) && (
            <div className="form-rule mt-3 pt-3 space-y-3">
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="btn-saffron w-full text-xs !py-2.5 flex items-center justify-center gap-2 font-bold shadow-lg"
              >
                <span>✨ View AI Resume Analysis</span>
                <span>→</span>
              </button>
              {parsedInfo && (
                <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  {parsedInfo.name && <div><span className="text-slate-500">Name:</span> {parsedInfo.name}</div>}
                  {parsedInfo.email && <div><span className="text-slate-500">Email:</span> {parsedInfo.email}</div>}
                  <div className="flex flex-wrap gap-1 mt-1">{parsedInfo.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card 2: AI Resume Improvement */}
        <div className="glass-card p-6 border-slate-200/90 dark:border-white/15 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center justify-center text-xl">
              ✨
            </div>
            <div>
              <div className="font-display font-bold text-base text-slate-900 dark:text-white">AI Resume Improvement</div>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Get suggestions to strengthen your profile.
          </p>
          <button onClick={loadSuggestions} className="btn-primary w-full text-xs !py-2.5">
            Get Suggestions
          </button>
          {suggestions && (
            <ul className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {suggestions.map((s, i) => <li key={i}>☐ {s}</li>)}
            </ul>
          )}
        </div>
      </div>

      <ResumeReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportData={parsedInfo || {
          filename: profile?.resume_filename || 'Parsed_Resume.pdf',
          name: profile?.name,
          skills: profile?.skills || [],
          ai_analysis: {
            ats_score: Math.min(96, 60 + (profile?.skills?.length || 0) * 3),
            market_readiness: (profile?.skills?.length || 0) >= 5 ? 'Market Ready (Top 5%)' : 'Strong Candidate',
            executive_summary: `Candidate displays active technical competencies in ${(profile?.skills || []).slice(0, 5).join(', ') || 'software engineering'}.`,
            key_strengths: [
              `Verified ${profile?.skills?.length || 0} skills on candidate profile.`,
              'PDF formatting active in profile database.'
            ],
            actionable_recommendations: [
              'Add quantitative impact metrics to project descriptions.',
              'Ensure your GitHub portfolio link is present on resume header.'
            ],
            recommended_roles: ['Full Stack Developer', 'Software Engineering Intern']
          }
        }}
        onApplySkills={(newSkills) => setForm((f) => ({ ...f, skills: [...new Set([...f.skills.split(',').map((s) => s.trim()).filter(Boolean), ...newSkills])].join(', ') }))}
      />
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
    <div className="glass-card p-6 border-slate-200/90 dark:border-white/15 space-y-4">
      <div>
        <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">Skills vs. Market Demand</h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">Ranked by how often each skill appears across current internship postings.</p>
      </div>
      <div className="space-y-3 pt-2">
        {gaps.map((g) => (
          <div key={g.skill} className="flex items-center gap-3">
            <div className="w-32 shrink-0 text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">{g.skill}</div>
            <div className="flex-1 h-3 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full ${g.have ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} style={{ width: `${(g.demandCount / max) * 100}%` }} />
            </div>
            <div className="w-24 text-right text-xs font-mono">{g.have ? <span className="text-emerald-700 dark:text-emerald-400 font-bold">✔ Have</span> : <span className="text-amber-700 dark:text-amber-400 font-bold">Learn this</span>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationTimelineStepper({ status }) {
  const STAGES = [
    { key: 'applied', label: 'Applied', icon: '📝' },
    { key: 'under_review', label: 'Under Review', icon: '🔍' },
    { key: 'shortlisted', label: 'Shortlisted', icon: '⭐' },
    { key: 'interview', label: 'Interview', icon: '📅' },
    { key: 'offered', label: 'Selected', icon: '🎉' },
  ];

  const statusMap = {
    applied: 1,
    pending: 1,
    under_review: 2,
    shortlisted: 3,
    interview: 4,
    offered: 5,
    accepted: 5,
    rejected: -1,
  };

  const currentStep = statusMap[status?.toLowerCase()] || 1;
  const isRejected = status?.toLowerCase() === 'rejected';

  return (
    <div className="w-full pt-3 pb-1">
      <div className="flex items-center justify-between relative max-w-xl mx-auto">
        {/* Progress connecting line */}
        <div className="absolute left-6 right-6 top-4 h-1 bg-slate-200 dark:bg-white/10 z-0">
          <div
            className={`h-full transition-all duration-500 ${
              isRejected ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500'
            }`}
            style={{ width: isRejected ? '100%' : `${Math.max(0, (currentStep - 1) * 25)}%` }}
          />
        </div>

        {STAGES.map((s, idx) => {
          const stepNum = idx + 1;
          const isPassed = !isRejected && currentStep >= stepNum;
          const isCurrent = !isRejected && currentStep === stepNum;

          return (
            <div key={s.key} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                  isRejected && stepNum === 5
                    ? 'bg-rose-500 text-white border-rose-600 shadow-md'
                    : isPassed
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-white dark:bg-[#12142E] text-slate-400 border-slate-300 dark:border-white/20'
                }`}
              >
                {isPassed ? (isCurrent ? s.icon : '✓') : stepNum}
              </div>
              <span
                className={`text-[10px] font-bold mt-1.5 whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'text-indigo-600 dark:text-amber-400 font-black'
                    : isPassed
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {isRejected && stepNum === 5 ? 'Rejected' : s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Applications() {
  const [apps, setApps] = useState(null);
  useEffect(() => { api.get('/student/applications').then((r) => setApps(r.data)); }, []);

  const statusBadgeStyle = {
    applied: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    shortlisted: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    interview: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    offered: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    rejected: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
  };

  if (!apps) return <SkeletonList />;
  if (apps.length === 0) return <EmptyState text="You haven't applied to anything yet — check Recommendations." />;

  return (
    <div className="glass-card p-6 border-slate-200/90 dark:border-white/15 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">Your Applications & Status Timeline</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">Track real-time progress as companies review, shortlist, and interview your profile.</p>
        </div>
        <span className="chip font-mono font-bold text-xs">{apps.length} Applications</span>
      </div>

      <div className="space-y-6">
        {apps.map((a) => {
          const inv = a.interview;
          let scheduledDateStr = '';
          let scheduledTimeStr = '';
          if (inv && inv.scheduled_at) {
            const d = new Date(inv.scheduled_at);
            scheduledDateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            scheduledTimeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          }

          return (
            <div key={a.id} className="p-5 sm:p-6 rounded-3xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <MatchSeal score={a.match_score} size={56} />
                  <div>
                    <div className="font-display font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">{a.title}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                      <strong className="text-orange-600 dark:text-amber-400">{a.company_name}</strong> · {a.location} · applied {new Date(a.applied_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <span className={`px-3.5 py-1 rounded-full text-xs font-mono font-bold capitalize border backdrop-blur-md ${statusBadgeStyle[a.status] || 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/20'}`}>
                  Status: {a.status === 'interview' ? 'Interview Scheduled' : a.status}
                </span>
              </div>

              {/* 5-Stage Interactive Progress Timeline */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                <ApplicationTimelineStepper status={a.status} />
              </div>

              {/* Feature 5: Interview Scheduled Details Card */}
              {(a.status === 'interview' || inv) && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 text-white border border-white/20 shadow-xl space-y-3 animate-fade-in mt-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-mono font-bold text-amber-300 tracking-wider">
                        🎥 Official Interview Scheduled
                      </span>
                      <h4 className="font-display text-lg font-extrabold text-white">
                        {a.title}
                      </h4>
                      <p className="text-xs text-indigo-100">
                        Interview scheduled by <strong className="text-white">{a.company_name}</strong>
                      </p>
                    </div>

                    {inv?.meeting_url && (
                      <a
                        href={inv.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-saffron text-xs !py-2.5 !px-5 shadow-lg active:scale-95 transition-all self-start sm:self-center shrink-0 flex items-center gap-2"
                      >
                        <span>🎥 Join Google Meet</span>
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs text-center">
                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                      <span className="text-[10px] text-slate-300 uppercase font-bold block font-mono">📅 Date</span>
                      <span className="font-extrabold text-white text-xs">{scheduledDateStr || '14 August 2026'}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                      <span className="text-[10px] text-slate-300 uppercase font-bold block font-mono">🕐 Time</span>
                      <span className="font-extrabold text-white text-xs">{scheduledTimeStr || '3:00 PM'}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                      <span className="text-[10px] text-slate-300 uppercase font-bold block font-mono">⏱ Duration</span>
                      <span className="font-extrabold text-white text-xs">{inv?.duration || 30} minutes</span>
                    </div>
                  </div>

                  {inv?.notes && (
                    <div className="text-xs text-indigo-100 bg-white/10 p-3 rounded-xl border border-white/15">
                      <strong className="text-white">Interviewer Notes:</strong> {inv.notes}
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>
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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  async function sendMessage(text) {
    if (!text || !text.trim()) return;
    setMessages((m) => [...m, { from: 'user', text }]);
    setSending(true);
    try {
      const { data } = await api.post('/student/chatbot', { message: text });
      setMessages((m) => [...m, { from: 'bot', text: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { from: 'bot', text: "Sorry, I encountered an issue processing that. Please try again!" }]);
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
    <div className="glass-card p-6 border-slate-200/90 dark:border-white/15 max-w-3xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
        <div>
          <div className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>✨ AI Career Assistant</span>
            <span className="text-[10px] uppercase font-mono bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md font-bold">Generative LLM</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">Live career guidance based on your student profile and application history.</p>
        </div>
      </div>

      <div className="space-y-3 mb-4 max-h-[420px] overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-xs rounded-2xl px-4 py-3 max-w-[85%] shadow-md leading-relaxed font-medium ${
              m.from === 'bot'
                ? 'bg-slate-100/90 dark:bg-white/10 border border-slate-200 dark:border-white/15 text-slate-800 dark:text-slate-100 rounded-tl-xs backdrop-blur-md'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white ml-auto rounded-tr-xs shadow-lg'
            }`}
          >
            {m.text}
          </div>
        ))}
        {sending && <div className="text-xs text-indigo-600 dark:text-indigo-300 font-mono italic animate-pulse font-semibold">AI is thinking…</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Chips */}
      <div className="flex flex-wrap gap-1.5 pt-2">
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={sending}
            onClick={() => sendMessage(chip.replace(/^[✨💡🎯📄⚡]\s*/, ''))}
            className="text-xs bg-slate-200/70 dark:bg-white/10 hover:bg-slate-300/80 dark:hover:bg-white/20 text-slate-800 dark:text-slate-200 font-bold px-3 py-1.5 rounded-xl border border-slate-300/80 dark:border-white/15 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      <form onSubmit={send} className="flex gap-2 pt-2">
        <input
          className="input !rounded-xl text-xs"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask any question (e.g. 'What skills to learn?', 'Code a binary search', 'Interview tips')..."
        />
        <button className="btn-primary shrink-0 !rounded-xl !px-6 text-xs" disabled={sending}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
function SkeletonList() {
  return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse border border-slate-300/60 dark:border-white/10" />)}</div>;
}
function EmptyState({ text }) {
  return <div className="glass-card p-10 text-center text-slate-500 dark:text-slate-400 text-xs font-semibold">{text}</div>;
}
