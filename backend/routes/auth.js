const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const db = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { email, password, role, name } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'email, password and role are required' });
  if (!['student', 'company', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

  const id = nanoid();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, email, password, role) VALUES (?,?,?,?)').run(id, email, hash, role);

  if (role === 'student') {
    db.prepare('INSERT INTO student_profiles (user_id, name) VALUES (?,?)').run(id, name || email.split('@')[0]);
  } else if (role === 'company') {
    db.prepare('INSERT INTO company_profiles (user_id, name) VALUES (?,?)').run(id, name || email.split('@')[0]);
  }

  const token = jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id, email, role, name } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  let profile = null;
  if (user.role === 'student') profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
  if (user.role === 'company') profile = db.prepare('SELECT * FROM company_profiles WHERE user_id = ?').get(user.id);

  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: profile?.name || null } });
});

router.get('/notifications', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  res.json(rows);
});

module.exports = router;
