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
    <div className="min-h-screen bg-paper">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-navy-100">
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-20 grid md:grid-cols-[1.2fr,1fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-navy-500 border border-navy-200 rounded-full px-3 py-1 mb-6">
              Ministry of Corporate Affairs · Smart Automation
            </div>
            <h1 className="font-display text-[2.75rem] leading-[1.05] sm:text-6xl sm:leading-[1.03] text-navy-800 font-semibold">
              Every internship seat, matched to the student who actually fits it.
            </h1>
            <p className="mt-6 text-lg text-navy-600 max-w-xl">
              Not just CGPA. The allocation engine reads skills out of your projects and resume,
              weighs them against real requirements, and explains every recommendation — so nobody
              gets an internship that doesn't make sense.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-saffron">Register as a student</Link>
              <Link to="/register" className="btn-secondary">Register a company</Link>
            </div>
            <p className="mt-4 text-xs text-navy-400 font-mono">
              Demo logins — student: rahul.sharma@example.com / student123 · company: hr@technova.com / company123 · admin: admin@mca.gov.in / admin123
            </p>
          </div>

          {/* Signature element: a "match seal" specimen card, like a filled-in government form */}
          <div className="stub-card p-6 shadow-sm">
            <div className="text-[11px] font-mono uppercase tracking-widest text-navy-400 mb-4">Sample allocation record</div>
            <div className="flex items-center gap-4">
              <div className="seal text-leaf-600 border-leaf-500" style={{ width: 72, height: 72, fontSize: 22 }}>
                92<span className="ml-0.5 text-xs opacity-70">%</span>
              </div>
              <div>
                <div className="font-display text-lg text-navy-800">Full Stack Development Intern</div>
                <div className="text-sm text-navy-500">TechNova Solutions · Kanpur</div>
              </div>
            </div>
            <div className="form-rule my-4" />
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-navy-400">Skill match</span><span className="text-right font-mono text-navy-700">90%</span>
              <span className="text-navy-400">Location fit</span><span className="text-right font-mono text-navy-700">100%</span>
              <span className="text-navy-400">Academic record</span><span className="text-right font-mono text-navy-700">84%</span>
              <span className="text-navy-400">Project depth</span><span className="text-right font-mono text-navy-700">100%</span>
            </div>
            <div className="form-rule my-4" />
            <ul className="text-sm text-navy-600 space-y-1.5">
              <li>✔ React, Node.js and MongoDB match the requirement</li>
              <li>✔ Nearby preferred location</li>
              <li>✔ Strong DSA profile</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <h2 className="font-display text-3xl text-navy-800 mb-2">How allocation works</h2>
        <p className="text-navy-500 mb-10 max-w-2xl">Four steps replace weeks of manual resume screening.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="stub-card p-5">
              <div className="font-mono text-saffron-500 text-sm mb-3">{s.n}</div>
              <div className="font-display text-navy-800 text-lg mb-2">{s.title}</div>
              <div className="text-sm text-navy-500">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="bg-navy-800 text-white">
        <div className="max-w-6xl mx-auto px-5 py-16 grid md:grid-cols-3 gap-8">
          {[
            { role: 'Student', body: 'Build a profile, get ranked recommendations with match %, and track every application.', cta: 'Find internships' },
            { role: 'Company', body: 'Post roles once verified, and see applicants automatically ranked with an explainable score.', cta: 'Post an internship' },
            { role: 'Admin', body: 'Verify companies and students, monitor allocation, and watch skill-demand analytics.', cta: 'Open control room' },
          ].map((r) => (
            <div key={r.role} className="border border-white/15 rounded-card p-6">
              <div className="font-display text-2xl mb-2">{r.role}</div>
              <p className="text-navy-200 text-sm mb-5">{r.body}</p>
              <Link to="/register" className="text-saffron-400 text-sm font-medium hover:text-saffron-300">{r.cta} →</Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-5 py-8 text-xs text-navy-400 font-mono">
        Prototype built for the PM Internship Scheme · Smart Automation theme · Not an official Government of India deployment
      </footer>
    </div>
  );
}
