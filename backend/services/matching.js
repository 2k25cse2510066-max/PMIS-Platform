// ---------------------------------------------------------------------------
// Matching / "AI" engine for the PM Internship Scheme platform.
//
// Real deployments would call an LLM (Gemini/OpenAI) + embeddings for
// semantic skill matching. This environment has no outbound access to those
// APIs, so this module implements the same *behaviour* algorithmically:
//   - a skill dictionary + alias map (so "MERN" expands to react/node/express/mongodb)
//   - free-text skill extraction (regex/keyword based NLP)
//   - a weighted, explainable match score (skills / location / type / CGPA / projects)
//
// Swapping this out for a real embeddings-based matcher later only requires
// changing `extractSkillsFromText` and `skillOverlapScore` - every route
// consumes this module through the same functions.
// ---------------------------------------------------------------------------

// Canonical skill list + common aliases / stack bundles a student or JD might mention.
const SKILL_ALIASES = {
  mern: ['react', 'node.js', 'express.js', 'mongodb'],
  mean: ['angular', 'node.js', 'express.js', 'mongodb'],
  'full stack': ['frontend', 'backend', 'database'],
  'rest api': ['rest apis'],
  'restful api': ['rest apis'],
  js: ['javascript'],
  ts: ['typescript'],
  reactjs: ['react'],
  'react.js': ['react'],
  nodejs: ['node.js'],
  'node js': ['node.js'],
  expressjs: ['express.js'],
  'express js': ['express.js'],
  py: ['python'],
  ml: ['machine learning'],
  ai: ['artificial intelligence'],
  dsa: ['data structures', 'algorithms'],
  db: ['database'],
  postgres: ['postgresql'],
  aws: ['amazon web services'],
  gcp: ['google cloud'],
  nextjs: ['next.js'],
  vuejs: ['vue.js'],
};

const KNOWN_SKILLS = [
  'react', 'next.js', 'vue.js', 'angular', 'javascript', 'typescript', 'html', 'css',
  'tailwind css', 'bootstrap', 'redux',
  'node.js', 'express.js', 'django', 'flask', 'spring boot', 'rest apis', 'graphql',
  'mongodb', 'mysql', 'postgresql', 'sqlite', 'firebase', 'redis', 'database',
  'python', 'java', 'c++', 'c', 'c#', 'go', 'rust',
  'data structures', 'algorithms', 'oop', 'system design',
  'machine learning', 'deep learning', 'nlp', 'artificial intelligence', 'data science',
  'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn',
  'docker', 'kubernetes', 'aws', 'amazon web services', 'azure', 'google cloud', 'ci/cd',
  'git', 'github', 'linux',
  'android', 'ios', 'flutter', 'react native', 'kotlin', 'swift',
  'excel', 'power bi', 'tableau', 'sql',
  'ui/ux', 'figma', 'photoshop',
  'communication', 'leadership', 'digital marketing', 'seo', 'content writing',
];

function normalize(str) {
  return String(str || '').toLowerCase().trim();
}

/** Expand aliases/stack bundles (e.g. "MERN") into individual canonical skills. */
function expandSkill(raw) {
  const s = normalize(raw);
  if (SKILL_ALIASES[s]) return SKILL_ALIASES[s];
  return [s];
}

/** Clean + de-duplicate a list of skill strings the user typed in directly. */
function normalizeSkillList(list) {
  const out = new Set();
  (list || []).forEach((s) => expandSkill(s).forEach((x) => out.add(x)));
  return Array.from(out);
}

/**
 * "AI Skill Extraction" - pulls known skills out of free text such as a
 * project description ("Built a MERN e-commerce website") or parsed resume text.
 */
function extractSkillsFromText(text) {
  const t = normalize(text);
  if (!t) return [];
  const found = new Set();

  // direct dictionary matches
  for (const skill of KNOWN_SKILLS) {
    const pattern = new RegExp(`(?:^|[^a-z0-9])${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^a-z0-9])`, 'i');
    if (pattern.test(` ${t} `)) found.add(skill);
  }
  // alias / stack-bundle matches (MERN, MEAN, JS, DSA, ...)
  for (const alias of Object.keys(SKILL_ALIASES)) {
    const pattern = new RegExp(`(?:^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^a-z0-9])`, 'i');
    if (pattern.test(` ${t} `)) SKILL_ALIASES[alias].forEach((s) => found.add(s));
  }
  return Array.from(found);
}

/** Overlap score between a student's skills and a job's required skills, 0-100. */
function skillOverlapScore(studentSkills, requiredSkills) {
  const s = new Set(normalizeSkillList(studentSkills));
  const r = normalizeSkillList(requiredSkills);
  if (r.length === 0) return 100;
  const matched = r.filter((skill) => s.has(skill));
  return Math.round((matched.length / r.length) * 100);
}

function locationScore(studentLocation, jobLocation) {
  if (!jobLocation || normalize(jobLocation) === 'remote') return 100;
  if (!studentLocation) return 50;
  return normalize(studentLocation) === normalize(jobLocation) ? 100 : 40;
}

function typeScore(studentPreferredType, jobType) {
  if (!studentPreferredType || !jobType) return 70;
  return normalize(studentPreferredType) === normalize(jobType) ? 100 : 55;
}

function cgpaScore(cgpa) {
  if (cgpa === null || cgpa === undefined || Number.isNaN(Number(cgpa))) return 70;
  return Math.max(0, Math.min(100, Math.round((Number(cgpa) / 10) * 100)));
}

function projectsScore(projects) {
  const n = Array.isArray(projects) ? projects.length : 0;
  return Math.min(100, n * 34); // 3 solid projects = full marks
}

/**
 * Full explainable match between a student profile and an internship.
 * Returns overall score + component breakdown + human-readable reasons,
 * mirroring the "Smart Matching Score" + "AI Explainability" spec.
 */
function computeMatch(student, internship) {
  const studentSkills = normalizeSkillList([
    ...(student.skills || []),
    ...extractSkillsFromText((student.projects || []).map((p) => p.description || p).join(' ')),
    ...extractSkillsFromText(student.resume_text || ''),
  ]);
  const requiredSkills = normalizeSkillList(internship.required_skills || []);

  const skill = skillOverlapScore(studentSkills, requiredSkills);
  const location = locationScore(student.location, internship.location);
  const type = typeScore(student.preferred_type, internship.type);
  const cgpa = cgpaScore(student.cgpa);
  const projects = projectsScore(student.projects);

  const weights = { skill: 0.45, location: 0.15, type: 0.1, cgpa: 0.15, projects: 0.15 };
  const overall = Math.round(
    skill * weights.skill + location * weights.location + type * weights.type +
    cgpa * weights.cgpa + projects * weights.projects
  );

  const matchedSkills = requiredSkills.filter((s) => studentSkills.includes(s));
  const missingSkills = requiredSkills.filter((s) => !studentSkills.includes(s));

  const reasons = [];
  matchedSkills.forEach((s) => reasons.push(`${s} matches the requirement`));
  if (location === 100 && internship.location) reasons.push(`Located in / open to ${internship.location}`);
  if (type === 100) reasons.push(`Preferred internship type (${internship.type}) matches`);
  if (cgpa >= 80) reasons.push('Strong academic record');
  if (projects >= 68) reasons.push('Solid project portfolio');
  if (reasons.length === 0) reasons.push('Limited overlap with this role - consider it a stretch application');

  return {
    overall,
    breakdown: { skill, location, type, cgpa, projects },
    matchedSkills,
    missingSkills,
    reasons,
  };
}

/** "AI Gap Analysis" - what the student has vs. what's commonly demanded. */
function gapAnalysis(studentSkills, demandSkills) {
  const s = new Set(normalizeSkillList(studentSkills));
  const demand = normalizeSkillList(demandSkills);
  const counts = {};
  demand.forEach((sk) => { counts[sk] = (counts[sk] || 0) + 1; });
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return ranked.map(([skill, demandCount]) => ({
    skill,
    have: s.has(skill),
    demandCount,
  }));
}

module.exports = {
  KNOWN_SKILLS,
  normalizeSkillList,
  extractSkillsFromText,
  computeMatch,
  gapAnalysis,
};
