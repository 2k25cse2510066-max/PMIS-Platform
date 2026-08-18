import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const STEPS = [
  { n: '01', title: 'Register & build your profile', body: 'Students add skills, projects and certificates. Companies register and get verified by MCA admins.' },
  { n: '02', title: 'AI reads between the lines', body: 'Upload a resume or describe a project in your own words — the engine extracts real, matchable skills automatically.' },
  { n: '03', title: 'Get a scored, explainable match', body: 'Every internship comes with a match seal — skill, location, CGPA and project fit, broken down transparently.' },
  { n: '04', title: 'Apply, track, get placed', body: 'Companies rank applicants instantly. Students track status from applied to offer in real time.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen relative z-10">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-5 pt-16 pb-20 grid md:grid-cols-[1.2fr,1fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2.5 text-xs font-mono uppercase tracking-widest text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md rounded-full pl-2 pr-4 py-1.5 mb-6 font-bold shadow-sm">
              <img src="/favicon.png" alt="PMIS Emblem" className="w-5 h-5 object-contain rounded-full" />
              <span>Ministry of Corporate Affairs · Smart Automation</span>
            </div>
            <h1 className="font-display text-[2.75rem] leading-[1.05] sm:text-6xl sm:leading-[1.03] text-slate-900 dark:text-white font-extrabold tracking-tight">
              Every internship seat, matched to the student who actually fits it.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-xl leading-relaxed font-medium">
              Not just CGPA. The allocation engine reads skills out of your projects and resume,
              weighs them against real requirements, and explains every recommendation — so nobody
              gets an internship that doesn't make sense.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-saffron">Register as a student</Link>
              <Link to="/register" className="btn-secondary">Register a company</Link>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
              Demo logins — student: rahul.sharma@example.com / student123 · company: hr@technova.com / company123 · admin: admin@mca.gov.in / admin123
            </p>
          </div>

          {/* Sample Allocation Record Glass Card */}
          <div className="glass-panel p-6 shadow-2xl space-y-4 border-slate-200/90 dark:border-white/20">
            <div className="text-[11px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">Sample allocation record</div>
            <div className="flex items-center gap-4">
              <div className="seal text-emerald-600 dark:text-emerald-400 border-emerald-500" style={{ width: 72, height: 72, fontSize: 22 }}>
                92<span className="ml-0.5 text-xs opacity-70">%</span>
              </div>
              <div>
                <div className="font-display text-lg text-slate-900 dark:text-white font-bold">Full Stack Development Intern</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">TechNova Solutions · Kanpur</div>
              </div>
            </div>
            <div className="form-rule my-4" />
            <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 font-semibold">Skill match</span><span className="text-right font-mono font-bold text-indigo-700 dark:text-indigo-300">90%</span>
              <span className="text-slate-500 font-semibold">Location fit</span><span className="text-right font-mono font-bold text-indigo-700 dark:text-indigo-300">100%</span>
              <span className="text-slate-500 font-semibold">Academic record</span><span className="text-right font-mono font-bold text-indigo-700 dark:text-indigo-300">84%</span>
              <span className="text-slate-500 font-semibold">Project depth</span><span className="text-right font-mono font-bold text-indigo-700 dark:text-indigo-300">100%</span>
            </div>
            <div className="form-rule my-4" />
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 font-medium">
              <li>✔ React, Node.js and MongoDB match the requirement</li>
              <li>✔ Nearby preferred location</li>
              <li>✔ Strong DSA profile</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-5 py-20">
        <h2 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white mb-2">How allocation works</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-10 max-w-2xl text-xs sm:text-sm font-medium">Four steps replace weeks of manual resume screening.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="glass-card p-6 border-slate-200/90 dark:border-white/15 space-y-3">
              <div className="font-mono text-amber-600 dark:text-amber-400 text-sm font-black">{s.n}</div>
              <div className="font-display text-slate-900 dark:text-white font-bold text-base">{s.title}</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="border-t border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-white/[0.03] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-5 py-16 grid md:grid-cols-3 gap-8">
          {[
            { role: 'Student', body: 'Build a profile, get ranked recommendations with match %, and track every application.', cta: 'Find internships' },
            { role: 'Company', body: 'Post roles once verified, and see applicants automatically ranked with an explainable score.', cta: 'Post an internship' },
            { role: 'Admin', body: 'Verify companies and students, monitor allocation, and watch skill-demand analytics.', cta: 'Open control room' },
          ].map((r) => (
            <div key={r.role} className="glass-card p-6 border-slate-200/90 dark:border-white/15 space-y-3">
              <div className="font-display text-2xl font-bold text-slate-900 dark:text-white">{r.role}</div>
              <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-medium">{r.body}</p>
              <Link to="/register" className="text-amber-600 dark:text-amber-400 text-xs font-bold hover:underline inline-block pt-2">
                {r.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-5 py-8 text-xs text-slate-500 dark:text-slate-400 font-mono">
        Prototype built for the PM Internship Scheme · Smart Automation theme · Not an official Government of India deployment
      </footer>
    </div>
  );
}
