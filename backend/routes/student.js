const express = require('express');
const multer = require('multer');
const path = require('path');
const { nanoid } = require('nanoid');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { computeMatch, gapAnalysis, extractSkillsFromText, normalizeSkillList } = require('../services/matching');
const { parseResumeFile } = require('../services/resumeParser');

const router = express.Router();
router.use(requireAuth, requireRole('student'));

const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF resumes are supported'));
    cb(null, true);
  },
});

function loadProfile(userId) {
  const row = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(userId);
  if (!row) return null;
  return {
    ...row,
    skills: JSON.parse(row.skills || '[]'),
    projects: JSON.parse(row.projects || '[]'),
    certificates: JSON.parse(row.certificates || '[]'),
  };
}

router.get('/profile', (req, res) => {
  const profile = loadProfile(req.user.id);
  res.json(profile);
});

router.put('/profile', (req, res) => {
  const { name, phone, location, preferred_type, cgpa, skills, projects, certificates } = req.body;
  db.prepare(`UPDATE student_profiles SET
      name = COALESCE(?, name), phone = COALESCE(?, phone), location = COALESCE(?, location),
      preferred_type = COALESCE(?, preferred_type), cgpa = COALESCE(?, cgpa),
      skills = COALESCE(?, skills), projects = COALESCE(?, projects), certificates = COALESCE(?, certificates)
    WHERE user_id = ?`).run(
    name ?? null, phone ?? null, location ?? null, preferred_type ?? null, cgpa ?? null,
    skills ? JSON.stringify(skills) : null,
    projects ? JSON.stringify(projects) : null,
    certificates ? JSON.stringify(certificates) : null,
    req.user.id
  );
  res.json(loadProfile(req.user.id));
});

// AI Resume Parser: upload a PDF, extract structured fields + skills automatically
router.post('/resume', upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No resume file uploaded' });
  try {
    const parsed = await parseResumeFile(req.file.path);
    const existing = loadProfile(req.user.id);
    const mergedSkills = normalizeSkillList([...(existing.skills || []), ...parsed.skills]);

    db.prepare(`UPDATE student_profiles SET
        resume_filename = ?, resume_text = ?, skills = ?,
        name = COALESCE(name, ?)
      WHERE user_id = ?`).run(
      req.file.filename, parsed.raw_text, JSON.stringify(mergedSkills), parsed.name, req.user.id
    );

    res.json({
      message: 'Resume parsed successfully',
      extracted: { name: parsed.name, email: parsed.email, phone: parsed.phone, skills: parsed.skills, certifications: parsed.certifications },
      profile: loadProfile(req.user.id),
    });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Could not parse resume' });
  }
});

// AI Skill Extraction from free text, e.g. a project description
router.post('/extract-skills', (req, res) => {
  const { text } = req.body;
  res.json({ skills: extractSkillsFromText(text || '') });
});

// AI Internship Recommendation - "Top N internships for you" with match %
router.get('/recommendations', (req, res) => {
  const profile = loadProfile(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const internships = db.prepare(`
    SELECT i.*, c.name as company_name, c.verified as company_verified
    FROM internships i JOIN company_profiles c ON c.user_id = i.company_id
  `).all();

  const applied = new Set(
    db.prepare('SELECT internship_id FROM applications WHERE student_id = ?').all(req.user.id).map((r) => r.internship_id)
  );

  const ranked = internships.map((i) => {
    const match = computeMatch(profile, { ...i, required_skills: JSON.parse(i.required_skills || '[]') });
    return {
      ...i,
      required_skills: JSON.parse(i.required_skills || '[]'),
      already_applied: applied.has(i.id),
      match,
    };
  }).sort((a, b) => b.match.overall - a.match.overall);

  res.json(ranked.slice(0, 10));
});

// AI Gap Analysis - student's skills vs what the market is asking for
router.get('/gap-analysis', (req, res) => {
  const profile = loadProfile(req.user.id);
  const internships = db.prepare('SELECT required_skills FROM internships').all();
  const demand = internships.flatMap((i) => JSON.parse(i.required_skills || '[]'));
  res.json(gapAnalysis(profile.skills, demand));
});

// AI Resume Improvement suggestions (heuristic-based)
router.get('/resume-suggestions', (req, res) => {
  const profile = loadProfile(req.user.id);
  const suggestions = [];
  if (!profile.resume_text) suggestions.push('Upload a resume so we can tailor suggestions to it.');
  if ((profile.projects || []).length < 2) suggestions.push('Add at least 2-3 projects with measurable outcomes (e.g. "reduced load time by 40%").');
  if ((profile.skills || []).length < 5) suggestions.push('List more of your technical skills - aim for at least 5-8 relevant ones.');
  if (profile.resume_text && !/github/i.test(profile.resume_text)) suggestions.push('Add a link to your GitHub profile so recruiters can see your code.');
  if (profile.resume_text && !/summary|objective/i.test(profile.resume_text)) suggestions.push('Add a 2-3 line professional summary at the top of your resume.');
  if (suggestions.length === 0) suggestions.push('Your profile looks solid! Keep it updated as you gain new skills.');
  res.json({ suggestions });
});

// Applications
router.post('/apply/:internshipId', (req, res) => {
  const internship = db.prepare('SELECT * FROM internships WHERE id = ?').get(req.params.internshipId);
  if (!internship) return res.status(404).json({ error: 'Internship not found' });
  const profile = loadProfile(req.user.id);
  const match = computeMatch(profile, { ...internship, required_skills: JSON.parse(internship.required_skills || '[]') });

  try {
    const id = nanoid();
    db.prepare('INSERT INTO applications (id, student_id, internship_id, match_score, match_breakdown) VALUES (?,?,?,?,?)')
      .run(id, req.user.id, req.params.internshipId, match.overall, JSON.stringify(match));
    db.prepare('INSERT INTO notifications (id, user_id, message) VALUES (?,?,?)')
      .run(nanoid(), req.user.id, `Application submitted for "${internship.title}"`);
    res.json({ message: 'Applied successfully', match_score: match.overall });
  } catch (e) {
    res.status(409).json({ error: 'You have already applied to this internship' });
  }
});

router.get('/applications', (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, i.title, i.location, i.type, c.name as company_name
    FROM applications a
    JOIN internships i ON i.id = a.internship_id
    JOIN company_profiles c ON c.user_id = i.company_id
    WHERE a.student_id = ?
    ORDER BY a.applied_at DESC
  `).all(req.user.id);
  res.json(rows.map((r) => ({ ...r, match_breakdown: JSON.parse(r.match_breakdown || '{}') })));
});

router.get('/notifications', (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  res.json(rows);
});

// AI Chatbot - simple rule-based assistant over the student's own data
router.post('/chatbot', (req, res) => {
  const { message } = req.body;
  const m = (message || '').toLowerCase();
  const profile = loadProfile(req.user.id);
  let reply;

  if (/why (was(n'?t)?|wasn t) i (selected|shortlisted|rejected)/.test(m) || /not selected|rejected/.test(m)) {
    const rejected = db.prepare(`
      SELECT a.*, i.title FROM applications a JOIN internships i ON i.id = a.internship_id
      WHERE a.student_id = ? AND a.status = 'rejected' ORDER BY a.applied_at DESC LIMIT 1
    `).get(req.user.id);
    if (rejected) {
      const breakdown = JSON.parse(rejected.match_breakdown || '{}');
      reply = `For "${rejected.title}", your match score was ${rejected.match_score}%. `
        + (breakdown.missingSkills?.length
          ? `The main gap was missing skills: ${breakdown.missingSkills.join(', ')}. Consider building a small project with those.`
          : 'It looks close on paper - selection may have come down to other applicants, interview performance, or limited seats.');
    } else {
      reply = "I don't see any rejected applications on your account yet. Once a company updates your status, I can explain the outcome.";
    }
  } else if (/best internship|recommend|suggest/.test(m)) {
    const internships = db.prepare('SELECT i.*, c.name as company_name FROM internships i JOIN company_profiles c ON c.user_id = i.company_id').all();
    const ranked = internships.map((i) => ({ i, match: computeMatch(profile, { ...i, required_skills: JSON.parse(i.required_skills || '[]') }) }))
      .sort((a, b) => b.match.overall - a.match.overall).slice(0, 3);
    reply = ranked.length
      ? `Based on your profile, your top matches are: ${ranked.map((r) => `${r.i.title} at ${r.i.company_name} (${r.match.overall}%)`).join('; ')}.`
      : 'There are no internships posted yet - check back soon!';
  } else if (/skill|learn|improve/.test(m)) {
    const internships = db.prepare('SELECT required_skills FROM internships').all();
    const demand = internships.flatMap((i) => JSON.parse(i.required_skills || '[]'));
    const gaps = gapAnalysis(profile.skills, demand).filter((g) => !g.have).slice(0, 3);
    reply = gaps.length
      ? `The most in-demand skills you're missing right now are: ${gaps.map((g) => g.skill).join(', ')}. Adding a project using these would boost your match scores.`
      : "You're covering the most in-demand skills well. Consider deepening one area with a capstone project.";
  } else {
    reply = "I can help with: 'Best internships for me?', 'What skills should I learn?', or 'Why wasn't I selected for X?'. Try asking one of those!";
  }

  res.json({ reply });
});

module.exports = router;
