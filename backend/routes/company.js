const express = require('express');
const { nanoid } = require('nanoid');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { computeMatch } = require('../services/matching');

const router = express.Router();
router.use(requireAuth, requireRole('company'));

router.get('/profile', (req, res) => {
  res.json(db.prepare('SELECT * FROM company_profiles WHERE user_id = ?').get(req.user.id));
});

router.put('/profile', (req, res) => {
  const { name, description, website } = req.body;
  db.prepare('UPDATE company_profiles SET name = COALESCE(?,name), description = COALESCE(?,description), website = COALESCE(?,website) WHERE user_id = ?')
    .run(name ?? null, description ?? null, website ?? null, req.user.id);
  res.json(db.prepare('SELECT * FROM company_profiles WHERE user_id = ?').get(req.user.id));
});

router.post('/internships', (req, res) => {
  const company = db.prepare('SELECT * FROM company_profiles WHERE user_id = ?').get(req.user.id);
  if (!company?.verified) return res.status(403).json({ error: 'Your company must be verified by an admin before posting internships' });

  const { title, description, required_skills, location, type, seats, stipend } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const id = nanoid();
  db.prepare(`INSERT INTO internships (id, company_id, title, description, required_skills, location, type, seats, stipend)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
    id, req.user.id, title, description || '', JSON.stringify(required_skills || []),
    location || '', type || 'On-site', seats || 1, stipend || ''
  );
  res.json(db.prepare('SELECT * FROM internships WHERE id = ?').get(id));
});

router.get('/internships', (req, res) => {
  const rows = db.prepare('SELECT * FROM internships WHERE company_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows.map((r) => ({ ...r, required_skills: JSON.parse(r.required_skills || '[]') })));
});

// AI ranking of applicants for a given internship
router.get('/internships/:id/applicants', (req, res) => {
  const internship = db.prepare('SELECT * FROM internships WHERE id = ? AND company_id = ?').get(req.params.id, req.user.id);
  if (!internship) return res.status(404).json({ error: 'Internship not found' });

  const apps = db.prepare(`
    SELECT a.*, s.name, s.location, s.cgpa, s.skills, s.projects, s.resume_filename
    FROM applications a JOIN student_profiles s ON s.user_id = a.student_id
    WHERE a.internship_id = ?
  `).all(req.params.id);

  const ranked = apps.map((a) => {
    const student = {
      skills: JSON.parse(a.skills || '[]'),
      projects: JSON.parse(a.projects || '[]'),
      location: a.location,
      cgpa: a.cgpa,
    };
    const match = computeMatch(student, { ...internship, required_skills: JSON.parse(internship.required_skills || '[]') });
    return {
      application_id: a.id,
      student_id: a.student_id,
      name: a.name,
      location: a.location,
      cgpa: a.cgpa,
      skills: student.skills,
      resume_filename: a.resume_filename,
      status: a.status,
      applied_at: a.applied_at,
      match,
    };
  }).sort((x, y) => y.match.overall - x.match.overall);

  res.json(ranked);
});

router.put('/applications/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['applied', 'shortlisted', 'interview', 'offered', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const app = db.prepare(`
    SELECT a.*, i.company_id, i.title FROM applications a JOIN internships i ON i.id = a.internship_id WHERE a.id = ?
  `).get(req.params.id);
  if (!app || app.company_id !== req.user.id) return res.status(404).json({ error: 'Application not found' });

  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);
  db.prepare('INSERT INTO notifications (id, user_id, message) VALUES (?,?,?)')
    .run(nanoid(), app.student_id, `Your application for "${app.title}" is now: ${status}`);
  res.json({ message: 'Status updated' });
});

module.exports = router;
