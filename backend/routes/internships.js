const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT i.*, c.name as company_name, c.verified as company_verified
    FROM internships i JOIN company_profiles c ON c.user_id = i.company_id
    ORDER BY i.created_at DESC
  `).all();
  res.json(rows.map((r) => ({ ...r, required_skills: JSON.parse(r.required_skills || '[]') })));
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT i.*, c.name as company_name, c.verified as company_verified, c.description as company_description
    FROM internships i JOIN company_profiles c ON c.user_id = i.company_id WHERE i.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Internship not found' });
  res.json({ ...row, required_skills: JSON.parse(row.required_skills || '[]') });
});

module.exports = router;
