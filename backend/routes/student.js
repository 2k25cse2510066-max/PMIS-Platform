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
      name = ?, phone = ?, location = ?, preferred_type = ?, cgpa = ?,
      skills = ?, projects = ?, certificates = ?
    WHERE user_id = ?`).run(
    name || null, phone || null, location || null, preferred_type || null, cgpa !== undefined && cgpa !== null ? Number(cgpa) : null,
    JSON.stringify(skills || []),
    JSON.stringify(projects || []),
    JSON.stringify(certificates || []),
    req.user.id
  );
  res.json(loadProfile(req.user.id));
});

// AI Resume Parser: upload a PDF, extract structured fields + skills automatically
router.post('/resume', upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No resume file uploaded' });
  try {
    const existing = loadProfile(req.user.id);
    if (existing && existing.resume_filename) {
      const oldPath = path.join(__dirname, '..', 'uploads', existing.resume_filename);
      const fs = require('fs');
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (_) {}
      }
    }

    const parsed = await parseResumeFile(req.file.path);
    const mergedSkills = normalizeSkillList([...(existing?.skills || []), ...parsed.skills]);

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

const { generateLLMResponse } = require('../services/llmService');

// AI Chatbot - Multi-Provider Generative LLM Engine
router.post('/chatbot', async (req, res) => {
  const { message } = req.body;
  const profile = loadProfile(req.user.id);

  const applications = db.prepare(`
    SELECT a.status, a.match_score, i.title, c.name as company_name 
    FROM applications a 
    JOIN internships i ON i.id = a.internship_id 
    JOIN company_profiles c ON c.user_id = i.company_id 
    WHERE a.student_id = ?
    ORDER BY a.applied_at DESC
  `).all(req.user.id);

  const internships = db.prepare('SELECT required_skills FROM internships').all();
  const demand = internships.flatMap((i) => JSON.parse(i.required_skills || '[]'));
  const gaps = gapAnalysis(profile.skills, demand);

  try {
    const reply = await generateLLMResponse({
      message,
      profile,
      applications,
      gapAnalysis: gaps,
    });

    res.json({ reply });
  } catch (err) {
    console.error('Chatbot LLM Error:', err);
    res.status(500).json({ error: 'AI Assistant processing error' });
  }
});

module.exports = router;
