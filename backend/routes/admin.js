const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/companies', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, u.email FROM company_profiles c JOIN users u ON u.id = c.user_id ORDER BY c.verified ASC
  `).all();
  res.json(rows);
});

router.put('/companies/:userId/verify', (req, res) => {
  db.prepare('UPDATE company_profiles SET verified = 1 WHERE user_id = ?').run(req.params.userId);
  res.json({ message: 'Company verified' });
});

router.get('/students', (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, u.email FROM student_profiles s JOIN users u ON u.id = s.user_id ORDER BY s.verified ASC
  `).all();
  res.json(rows.map((r) => ({ ...r, skills: JSON.parse(r.skills || '[]') })));
});

router.put('/students/:userId/verify', (req, res) => {
  db.prepare('UPDATE student_profiles SET verified = 1 WHERE user_id = ?').run(req.params.userId);
  res.json({ message: 'Student verified' });
});

// Analytics Dashboard
router.get('/analytics', (req, res) => {
  const totalStudents = db.prepare("SELECT COUNT(*) c FROM users WHERE role='student'").get().c;
  const totalCompanies = db.prepare("SELECT COUNT(*) c FROM users WHERE role='company'").get().c;
  const verifiedCompanies = db.prepare('SELECT COUNT(*) c FROM company_profiles WHERE verified = 1').get().c;
  const totalInternships = db.prepare('SELECT COUNT(*) c FROM internships').get().c;
  const totalApplications = db.prepare('SELECT COUNT(*) c FROM applications').get().c;
  const totalSeats = db.prepare('SELECT COALESCE(SUM(seats),0) c FROM internships').get().c;
  const offered = db.prepare("SELECT COUNT(*) c FROM applications WHERE status='offered'").get().c;

  const byLocation = db.prepare(`
    SELECT COALESCE(location,'Unspecified') as location, COUNT(*) as count
    FROM student_profiles GROUP BY location ORDER BY count DESC
  `).all();

  const statusBreakdown = db.prepare(`
    SELECT status, COUNT(*) as count FROM applications GROUP BY status
  `).all();

  const allSkills = db.prepare('SELECT skills FROM student_profiles').all()
    .flatMap((r) => JSON.parse(r.skills || '[]'));
  const skillCounts = {};
  allSkills.forEach((s) => { skillCounts[s] = (skillCounts[s] || 0) + 1; });
  const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([skill, count]) => ({ skill, count }));

  res.json({
    totalStudents, totalCompanies, verifiedCompanies, totalInternships,
    totalApplications, totalSeats, offered,
    seatUtilization: totalSeats ? Math.round((offered / totalSeats) * 100) : 0,
    byLocation, statusBreakdown, topSkills,
  });
});

module.exports = router;
