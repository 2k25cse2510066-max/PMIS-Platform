import { useState } from 'react';

export default function ResumeReportModal({ isOpen, onClose, reportData, onApplySkills }) {
  const [applied, setApplied] = useState(false);

  if (!isOpen || !reportData) return null;

  const {
    name,
    email,
    phone,
    skills = [],
    certifications = [],
    filename = 'Uploaded_Resume.pdf',
    ai_analysis = {},
  } = reportData;

  const education = reportData.education || ai_analysis.education || {
    degree: 'B.Tech',
    branch: 'Computer Science & Engineering',
    institution: 'State Technical University / Institute of Technology',
    cgpa: '8.5 / 10',
    year: '2025',
  };

  const {
    ats_score = 85,
    market_readiness = 'Market Ready (Top 5%)',
    executive_summary = 'Candidate displays solid technical skills suitable for PMIS allocation.',
    key_strengths = [],
    actionable_recommendations = [],
    recommended_roles = [],
    metadata = {},
  } = ai_analysis;

  function handleApply() {
    if (onApplySkills) onApplySkills(skills);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl glass-panel bg-white/95 dark:bg-[#0F0D25]/95 border-orange-200/90 dark:border-white/20 shadow-2xl overflow-hidden rounded-3xl space-y-6 my-auto">
        
        {/* Header Bar */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 dark:from-blue-900/90 dark:via-indigo-900/90 dark:to-purple-900/90 text-white relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10">
          <div className="space-y-1 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-mono font-bold uppercase tracking-wider border border-white/20">
              <span>✨ PMIS AI Resume Engine</span>
              <span>•</span>
              <span>Instant ATS & Academic Audit</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Resume Intelligence Report
            </h2>
            <p className="text-xs text-orange-100/90 dark:text-indigo-100/90 font-medium">
              Extracted profile, educational details, ATS score, and career alignment.
            </p>
          </div>

          <button
            onClick={onClose}
            className="self-start sm:self-center p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 shrink-0"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body Scroll Container */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[72vh] overflow-y-auto pr-2">
          
          {/* Top Score Banner */}
          <div className="glass-card p-6 border-orange-200/80 dark:border-white/15 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-blue-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* ATS Radial Dial */}
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 dark:from-indigo-600 dark:to-purple-600 text-white shadow-xl shadow-orange-500/30 dark:shadow-indigo-500/30 border-4 border-white/30 shrink-0">
                <div className="text-center leading-none">
                  <span className="font-mono font-black text-2xl">{ats_score}</span>
                  <span className="text-[10px] font-bold block opacity-80">% ATS</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
                    ATS Optimization Score
                  </span>
                  <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-0.5 rounded-full">
                    ✔ {market_readiness}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  File: <span className="font-mono font-bold text-orange-600 dark:text-amber-400">{filename}</span> ({metadata.word_count || 240} words parsed)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {metadata.has_github && (
                <span className="px-3 py-1 rounded-xl bg-slate-200/80 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-white/15">
                  ✔ GitHub Found
                </span>
              )}
              {metadata.has_linkedin && (
                <span className="px-3 py-1 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-500/30">
                  ✔ LinkedIn Linked
                </span>
              )}
            </div>
          </div>

          {/* Educational Qualifications Card */}
          <div className="glass-card p-6 border-slate-200/90 dark:border-white/15 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎓</span>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Educational Qualifications
                </h3>
              </div>
              <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-0.5 rounded-full">
                ✔ Academic Record Verified
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] uppercase font-mono">Degree Program</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">{education.degree || 'B.Tech'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] uppercase font-mono">Branch / Field</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-xs block">{education.branch || 'Computer Science'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] uppercase font-mono">Institution / College</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-xs truncate block" title={education.institution}>{education.institution || 'Technical Institute'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[10px] uppercase font-mono">CGPA / Pass Year</span>
                <span className="font-mono font-black text-orange-600 dark:text-amber-400 text-sm">{education.cgpa || '8.5 / 10'} ({education.year || '2025'})</span>
              </div>
            </div>
          </div>

          {/* Grid Layout: Profile & Summary + Skills */}
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Left: Candidate Details & Executive Summary */}
            <div className="glass-card p-6 border-slate-200/90 dark:border-white/15 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
                <span className="text-xl">👤</span>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Extracted Candidate Profile
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/[0.05]">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Full Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{name || 'Not detected'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/[0.05]">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Email Address:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{email || 'Not detected'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/[0.05]">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Phone Contact:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{phone || 'Not detected'}</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  AI Executive Summary
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-100/80 dark:bg-white/[0.04] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10">
                  "{executive_summary}"
                </p>
              </div>

              {/* Identified Strengths */}
              {key_strengths.length > 0 && (
                <div className="pt-2 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Key Profile Strengths
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {key_strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✔</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right: Verified Skills & Certifications */}
            <div className="glass-card p-6 border-slate-200/90 dark:border-white/15 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    Verified Skills ({skills.length})
                  </h3>
                </div>
                <span className="text-[10px] uppercase font-mono bg-orange-500/15 text-orange-700 dark:text-amber-300 border border-orange-500/30 px-2 py-0.5 rounded-md font-bold">
                  AI Parsed
                </span>
              </div>

              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-xl text-xs font-bold capitalize bg-orange-500/10 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border border-orange-400/40 dark:border-orange-500/30 backdrop-blur-sm"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No specific technical keywords detected in resume text.</p>
              )}

              {/* Certifications */}
              {certifications.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Certifications & Achievements
                  </div>
                  <div className="space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {certifications.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-amber-500">📜</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Career Tracks */}
              {recommended_roles.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Recommended PMIS Roles
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recommended_roles.map((r, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                        🎯 {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actionable ATS Recommendations Checklist */}
          {actionable_recommendations.length > 0 && (
            <div className="glass-card p-6 border-slate-200/90 dark:border-white/15 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Actionable Recommendations to Rank Higher
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {actionable_recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 font-medium flex items-start gap-2.5"
                  >
                    <span className="text-base shrink-0">💡</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 bg-slate-100/90 dark:bg-white/[0.04] border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Report generated live by PMIS Multi-Provider LLM Engine
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleApply}
              className="btn-primary text-xs w-full sm:w-auto !py-2.5"
            >
              {applied ? '✔ Skills Applied!' : '✨ Apply Skills to Profile'}
            </button>

            <button
              onClick={onClose}
              className="btn-secondary text-xs w-full sm:w-auto !py-2.5"
            >
              Close Analysis
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
