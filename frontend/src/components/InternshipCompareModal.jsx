import { useState } from 'react';

export default function InternshipCompareModal({ isOpen, onClose, internships = [], onApply }) {
  const [applyingId, setApplyingId] = useState(null);

  if (!isOpen || internships.length === 0) return null;

  async function handleApply(internship) {
    setApplyingId(internship.id);
    try {
      await onApply(internship);
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl glass-panel bg-white/95 dark:bg-[#0F0D25]/95 border-orange-200/90 dark:border-white/20 shadow-2xl overflow-hidden rounded-3xl space-y-6 my-auto">
        
        {/* Header Bar */}
        <div className="p-6 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 dark:from-blue-900/90 dark:via-indigo-900/90 dark:to-purple-900/90 text-white relative flex items-center justify-between border-b border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-mono font-bold uppercase tracking-wider border border-white/20">
              <span>⚖️ Side-by-Side Comparison</span>
              <span>•</span>
              <span>{internships.length} Internships Selected</span>
            </div>
            <h2 className="font-display text-2xl font-extrabold text-white tracking-tight">
              Internship Comparison Matrix
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Matrix Body */}
        <div className="p-6 overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10">
                <th className="p-3 text-xs font-mono font-bold uppercase text-slate-400 w-1/4">Criteria</th>
                {internships.map((item) => (
                  <th key={item.id} className="p-3 text-sm font-bold text-slate-900 dark:text-white text-center w-1/4">
                    <div className="space-y-1">
                      <div className="font-display text-base text-slate-900 dark:text-white font-extrabold">{item.title}</div>
                      <div className="text-xs text-orange-600 dark:text-amber-400 font-semibold">{item.company_name || 'TechNova'}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
              
              {/* Match Score */}
              <tr>
                <td className="p-3.5 font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span>🎯</span> Match Score
                </td>
                {internships.map((item) => (
                  <td key={item.id} className="p-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/15 to-amber-500/15 text-orange-800 dark:text-amber-300 font-mono font-black text-sm border border-orange-500/30">
                      {item.match.overall}% Match
                    </span>
                  </td>
                ))}
              </tr>

              {/* Stipend */}
              <tr>
                <td className="p-3.5 font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span>₹</span> Monthly Stipend
                </td>
                {internships.map((item) => (
                  <td key={item.id} className="p-3.5 text-center font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                    {item.stipend || '₹10,000 / month'}
                  </td>
                ))}
              </tr>

              {/* Location & Mode */}
              <tr>
                <td className="p-3.5 font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span>📍</span> Location & Mode
                </td>
                {internships.map((item) => (
                  <td key={item.id} className="p-3.5 text-center font-medium text-slate-800 dark:text-slate-200">
                    <div>{item.location}</div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 font-bold">
                      {item.type}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Duration */}
              <tr>
                <td className="p-3.5 font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span>⏱️</span> Duration
                </td>
                {internships.map((item) => (
                  <td key={item.id} className="p-3.5 text-center font-medium text-slate-800 dark:text-slate-200">
                    3 - 6 Months
                  </td>
                ))}
              </tr>

              {/* Skills Match Ratio */}
              <tr>
                <td className="p-3.5 font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span>⚡</span> Skills Match Ratio
                </td>
                {internships.map((item) => {
                  const matchedCount = item.match.matchedSkills.length;
                  const totalCount = item.required_skills.length || 1;
                  return (
                    <td key={item.id} className="p-3.5 text-center">
                      <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                        {matchedCount} / {totalCount} Matched
                      </div>
                      <div className="flex flex-wrap gap-1 justify-center mt-1">
                        {item.match.matchedSkills.map((s) => (
                          <span key={s} className="chip text-[10px] py-0 px-1.5">{s}</span>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Missing Skills */}
              <tr>
                <td className="p-3.5 font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span>⚠️</span> Missing Skills
                </td>
                {internships.map((item) => (
                  <td key={item.id} className="p-3.5 text-center">
                    {item.match.missingSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {item.match.missingSkills.map((s) => (
                          <span key={s} className="chip-missing text-[10px] py-0 px-1.5">{s}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-emerald-600 font-bold">✔ None! Perfect match</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Action Button */}
              <tr>
                <td className="p-3.5 font-bold text-slate-600 dark:text-slate-400">Action</td>
                {internships.map((item) => (
                  <td key={item.id} className="p-3.5 text-center">
                    {item.already_applied ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                        ✔ Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApply(item)}
                        disabled={applyingId === item.id}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                      >
                        {applyingId === item.id ? 'Applying…' : 'Apply Now'}
                      </button>
                    )}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100/80 dark:bg-white/[0.04] border-t border-slate-200 dark:border-white/10 flex justify-end">
          <button onClick={onClose} className="btn-secondary text-xs !py-2">
            Close Comparison
          </button>
        </div>

      </div>
    </div>
  );
}
