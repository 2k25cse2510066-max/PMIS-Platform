const express = require('express');
const { nanoid } = require('nanoid');
const supabase = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { computeMatch } = require('../services/matching');

const router = express.Router();
router.use(requireAuth, requireRole('company'));

router.get('/profile', async (req, res) => {
  try {
    const { data } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();
    res.json(data);
  } catch (err) {
    console.error('Company profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { name, description, website } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (website !== undefined) updates.website = website;

    await supabase
      .from('company_profiles')
      .update(updates)
      .eq('user_id', req.user.id);

    const { data } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();
    res.json(data);
  } catch (err) {
    console.error('Company profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/internships', async (req, res) => {
  try {
    const { data: company } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (!company?.verified) return res.status(403).json({ error: 'Your company must be verified by an admin before posting internships' });

    const { title, description, required_skills, location, type, seats, stipend } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const id = nanoid();

    await supabase.from('internships').insert({
      id,
      company_id: req.user.id,
      title,
      description: description || '',
      required_skills: required_skills || [],
      location: location || '',
      type: type || 'On-site',
      seats: seats || 1,
      stipend: stipend || '',
    });

    const { data } = await supabase.from('internships').select('*').eq('id', id).maybeSingle();
    res.json(data);
  } catch (err) {
    console.error('Post internship error:', err);
    res.status(500).json({ error: 'Failed to post internship' });
  }
});

router.get('/internships', async (req, res) => {
  try {
    const { data: rows } = await supabase
      .from('internships')
      .select('*')
      .eq('company_id', req.user.id)
      .order('created_at', { ascending: false });
    res.json((rows || []).map((r) => ({ ...r, required_skills: r.required_skills || [] })));
  } catch (err) {
    console.error('Company internships error:', err);
    res.status(500).json({ error: 'Failed to fetch internships' });
  }
});

// AI ranking of applicants for a given internship
router.get('/internships/:id/applicants', async (req, res) => {
  try {
    const { data: internship } = await supabase
      .from('internships')
      .select('*')
      .eq('id', req.params.id)
      .eq('company_id', req.user.id)
      .maybeSingle();
    if (!internship) return res.status(404).json({ error: 'Internship not found' });

    const { data: apps } = await supabase
      .from('applications')
      .select('*')
      .eq('internship_id', req.params.id);

    const studentIds = [...new Set((apps || []).map((a) => a.student_id).filter(Boolean))];
    const { data: students } = studentIds.length
      ? await supabase.from('student_profiles').select('*').in('user_id', studentIds)
      : { data: [] };
    const studentsById = new Map((students || []).map((s) => [s.user_id, s]));

    const resumeFiles = (students || []).map((s) => s.resume_filename).filter(Boolean);
    const resumeUrls = new Map();
    for (const filename of resumeFiles) {
      const { data } = await supabase.storage.from('resumes').createSignedUrl(filename, 60 * 60);
      if (data?.signedUrl) resumeUrls.set(filename, data.signedUrl);
    }

    const ranked = (apps || []).map((a) => {
      const s = studentsById.get(a.student_id) || {};
      const student = {
        skills: s.skills || [],
        projects: s.projects || [],
        certificates: s.certificates || [],
        location: s.location,
        cgpa: s.cgpa,
        resume_text: s.resume_text || '',
      };
      const match = computeMatch(student, { ...internship, required_skills: internship.required_skills || [] });
      return {
        application_id: a.id,
        student_id: a.student_id,
        name: s.name,
        phone: s.phone,
        location: s.location,
        cgpa: s.cgpa,
        skills: student.skills,
        projects: student.projects,
        certificates: student.certificates,
        resume_filename: s.resume_filename,
        resume_url: s.resume_filename ? resumeUrls.get(s.resume_filename) || null : null,
        status: a.status,
        applied_at: a.applied_at,
        match,
      };
    }).sort((x, y) => y.match.overall - x.match.overall);

    res.json(ranked);
  } catch (err) {
    console.error('Applicants error:', err);
    res.status(500).json({ error: 'Failed to fetch applicants' });
  }
});

router.put('/applications/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['applied', 'shortlisted', 'interview', 'offered', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get application with internship info
    const { data: app } = await supabase
      .from('applications')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    const { data: internship } = app
      ? await supabase.from('internships').select('company_id, title').eq('id', app.internship_id).maybeSingle()
      : { data: null };

    if (!app || internship?.company_id !== req.user.id) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await supabase
      .from('applications')
      .update({ status })
      .eq('id', req.params.id);

    await supabase.from('notifications').insert({
      id: nanoid(),
      user_id: app.student_id,
      message: `Your application for "${internship?.title}" is now: ${status}`,
    });

    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
