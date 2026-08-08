const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const supabase = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, role, name } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: 'email, password and role are required' });
    if (!['student', 'company', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const id = nanoid();
    const hash = bcrypt.hashSync(password, 10);
    const { error: insertError } = await supabase.from('users').insert({ id, email, password: hash, role });
    if (insertError) throw insertError;

    if (role === 'student') {
      await supabase.from('student_profiles').insert({ user_id: id, name: name || email.split('@')[0] });
    } else if (role === 'company') {
      await supabase.from('company_profiles').insert({ user_id: id, name: name || email.split('@')[0] });
    }

    const token = jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, email, role, name } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    let profile = null;
    if (user.role === 'student') {
      const { data } = await supabase.from('student_profiles').select('*').eq('user_id', user.id).maybeSingle();
      profile = data;
    }
    if (user.role === 'company') {
      const { data } = await supabase.from('company_profiles').select('*').eq('user_id', user.id).maybeSingle();
      profile = data;
    }

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: profile?.name || null } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const { data: rows } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    res.json(rows || []);
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;
