const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');
const supabase = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { computeMatch, gapAnalysis, extractSkillsFromText, normalizeSkillList } = require('../services/matching');
const { parseResumeBuffer } = require('../services/resumeParser');
const interviewStore = require('../services/interviewStore');

const router = express.Router();
router.use(requireAuth, requireRole('student'));

// Use memory storage so we get the buffer directly (no local filesystem needed in serverless)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF resumes are supported'));
    cb(null, true);
  },
});

async function loadProfile(userId) {
  const { data: row } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (!row) return null;
  return {
    ...row,
    skills: row.skills || [],
    projects: row.projects || [],
    certificates: row.certificates || [],
  };
}

router.get('/profile', async (req, res) => {
  try {
    const profile = await loadProfile(req.user.id);
    res.json(profile);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { name, phone, location, preferred_type, cgpa, skills, projects, certificates } = req.body;
    await supabase
      .from('student_profiles')
      .update({
        name: name || null,
        phone: phone || null,
        location: location || null,
        preferred_type: preferred_type || null,
        cgpa: cgpa !== undefined && cgpa !== null ? Number(cgpa) : null,
        skills: skills || [],
        projects: projects || [],
        certificates: certificates || [],
      })
      .eq('user_id', req.user.id);

    const profile = await loadProfile(req.user.id);
    res.json(profile);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// AI Resume Parser: upload a PDF, extract structured fields + skills automatically
router.post('/resume', upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No resume file uploaded' });
  try {
    const existing = await loadProfile(req.user.id);

    // Delete old resume from Supabase Storage if exists
    if (existing && existing.resume_filename) {
      await supabase.storage.from('resumes').remove([existing.resume_filename]);
    }

    // Upload new resume to Supabase Storage
    const filename = `${req.user.id}_${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filename, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (uploadError) throw uploadError;

    // Parse the resume from the buffer
    const parsed = await parseResumeBuffer(req.file.buffer);
    const mergedSkills = normalizeSkillList([...(existing?.skills || []), ...parsed.skills]);

    await supabase
      .from('student_profiles')
      .update({
        resume_filename: filename,
        resume_text: parsed.raw_text,
        skills: mergedSkills,
        name: existing?.name || parsed.name,
      })
      .eq('user_id', req.user.id);

    res.json({
      message: 'Resume parsed successfully',
      extracted: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        skills: parsed.skills,
        certifications: parsed.certifications,
        education: parsed.education,
        ai_analysis: parsed.ai_analysis,
        filename,
      },
      profile: await loadProfile(req.user.id),
    });
  } catch (e) {
    console.error('Resume upload error:', e);
    res.status(400).json({ error: e.message || 'Could not parse resume' });
  }
});

// AI Skill Extraction from free text, e.g. a project description
router.post('/extract-skills', (req, res) => {
  const { text } = req.body;
  res.json({ skills: extractSkillsFromText(text || '') });
});

// AI Internship Recommendation - "Top N internships for you" with match %
router.get('/recommendations', async (req, res) => {
  try {
    const profile = await loadProfile(req.user.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const { data: internships } = await supabase
      .from('internships')
      .select('*')
      .order('created_at', { ascending: false });

    const companyIds = [...new Set((internships || []).map((i) => i.company_id).filter(Boolean))];
    const { data: companies } = companyIds.length
      ? await supabase.from('company_profiles').select('user_id, name, verified').in('user_id', companyIds)
      : { data: [] };
    const companiesById = new Map((companies || []).map((c) => [c.user_id, c]));

    const { data: appRows } = await supabase
      .from('applications')
      .select('internship_id')
      .eq('student_id', req.user.id);
    const applied = new Set((appRows || []).map((r) => r.internship_id));

    const ranked = (internships || []).map((i) => {
      const requiredSkills = i.required_skills || [];
      const match = computeMatch(profile, { ...i, required_skills: requiredSkills });
      return {
        ...i,
        company_name: companiesById.get(i.company_id)?.name,
        company_verified: companiesById.get(i.company_id)?.verified,
        required_skills: requiredSkills,
        already_applied: applied.has(i.id),
        match,
      };
    }).sort((a, b) => b.match.overall - a.match.overall);

    res.json(ranked.slice(0, 10));
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// AI Gap Analysis - student's skills vs what the market is asking for
router.get('/gap-analysis', async (req, res) => {
  try {
    const profile = await loadProfile(req.user.id);
    const { data: internships } = await supabase.from('internships').select('required_skills');
    const demand = (internships || []).flatMap((i) => i.required_skills || []);
    res.json(gapAnalysis(profile.skills, demand));
  } catch (err) {
    console.error('Gap analysis error:', err);
    res.status(500).json({ error: 'Failed to compute gap analysis' });
  }
});

// AI Resume Improvement suggestions (heuristic-based)
router.get('/resume-suggestions', async (req, res) => {
  try {
    const profile = await loadProfile(req.user.id);
    const suggestions = [];
    if (!profile.resume_text) suggestions.push('Upload a resume so we can tailor suggestions to it.');
    if ((profile.projects || []).length < 2) suggestions.push('Add at least 2-3 projects with measurable outcomes (e.g. "reduced load time by 40%").');
    if ((profile.skills || []).length < 5) suggestions.push('List more of your technical skills - aim for at least 5-8 relevant ones.');
    if (profile.resume_text && !/github/i.test(profile.resume_text)) suggestions.push('Add a link to your GitHub profile so recruiters can see your code.');
    if (profile.resume_text && !/summary|objective/i.test(profile.resume_text)) suggestions.push('Add a 2-3 line professional summary at the top of your resume.');
    if (suggestions.length === 0) suggestions.push('Your profile looks solid! Keep it updated as you gain new skills.');
    res.json({ suggestions });
  } catch (err) {
    console.error('Resume suggestions error:', err);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

function checkProfileCompletion(profile) {
  if (!profile) return { complete: false, missingFields: ['Full Name', 'Phone Number', 'Location', 'CGPA', 'Skills', 'Resume Upload'] };
  const missingFields = [];
  if (!profile.name || !profile.name.trim()) missingFields.push('Full Name');
  if (!profile.phone || !profile.phone.trim()) missingFields.push('Phone Number');
  if (!profile.location || !profile.location.trim()) missingFields.push('Preferred Location');
  if (profile.cgpa === null || profile.cgpa === undefined || profile.cgpa === '' || Number(profile.cgpa) <= 0) missingFields.push('CGPA');
  if (!profile.skills || profile.skills.length === 0) missingFields.push('Skills');
  if (!profile.resume_filename) missingFields.push('Resume Upload');

  return {
    complete: missingFields.length === 0,
    missingFields,
  };
}

// Applications
router.post('/apply/:internshipId', async (req, res) => {
  try {
    const { data: internship } = await supabase
      .from('internships')
      .select('*')
      .eq('id', req.params.internshipId)
      .maybeSingle();
    if (!internship) return res.status(404).json({ error: 'Internship not found' });

    const profile = await loadProfile(req.user.id);
    const profileStatus = checkProfileCompletion(profile);
    if (!profileStatus.complete) {
      return res.status(400).json({
        error: `Incomplete Profile: Please complete your profile (${profileStatus.missingFields.join(', ')}) before applying for internships.`,
        missingFields: profileStatus.missingFields,
      });
    }

    const match = computeMatch(profile, { ...internship, required_skills: internship.required_skills || [] });

    const id = nanoid();
    const { error: insertError } = await supabase.from('applications').insert({
      id,
      student_id: req.user.id,
      internship_id: req.params.internshipId,
      match_score: match.overall,
      match_breakdown: match,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(409).json({ error: 'You have already applied to this internship' });
      }
      throw insertError;
    }

    await supabase.from('notifications').insert({
      id: nanoid(),
      user_id: req.user.id,
      message: `Application submitted for "${internship.title}"`,
    });

    res.json({ message: 'Applied successfully', match_score: match.overall });
  } catch (err) {
    console.error('Apply error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to apply' });
  }
});

router.get('/applications', async (req, res) => {
  try {
    const { data: rows } = await supabase
      .from('applications')
      .select('*')
      .eq('student_id', req.user.id)
      .order('applied_at', { ascending: false });

    const internshipIds = [...new Set((rows || []).map((r) => r.internship_id).filter(Boolean))];
    const { data: internships } = internshipIds.length
      ? await supabase.from('internships').select('id, title, location, type, company_id').in('id', internshipIds)
      : { data: [] };
    const internshipsById = new Map((internships || []).map((i) => [i.id, i]));

    const companyIds = [...new Set((internships || []).map((i) => i.company_id).filter(Boolean))];
    const { data: companies } = companyIds.length
      ? await supabase.from('company_profiles').select('user_id, name').in('user_id', companyIds)
      : { data: [] };
    const companiesById = new Map((companies || []).map((c) => [c.user_id, c]));

    const studentInterviews = await interviewStore.getByStudent(req.user.id);
    const interviewMap = new Map(studentInterviews.map((inv) => [inv.application_id, inv]));

    const results = (rows || []).map((r) => {
      const internship = internshipsById.get(r.internship_id);
      return {
        id: r.id,
        student_id: r.student_id,
        internship_id: r.internship_id,
        status: r.status,
        match_score: r.match_score,
        match_breakdown: r.match_breakdown || {},
        applied_at: r.applied_at,
        updated_at: r.updated_at || r.applied_at,
        title: internship?.title,
        location: internship?.location,
        type: internship?.type,
        company_name: companiesById.get(internship?.company_id)?.name || 'TechNova Solutions',
        interview: interviewMap.get(r.id) || null,
      };
    });

    res.json(results);
  } catch (err) {
    console.error('Applications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

router.get('/interviews', async (req, res) => {
  try {
    const interviews = await interviewStore.getByStudent(req.user.id);
    const internshipIds = [...new Set(interviews.map((i) => i.internship_id).filter(Boolean))];
    const companyIds = [...new Set(interviews.map((i) => i.company_id).filter(Boolean))];

    const { data: internships } = internshipIds.length
      ? await supabase.from('internships').select('id, title, location').in('id', internshipIds)
      : { data: [] };
    const { data: companies } = companyIds.length
      ? await supabase.from('company_profiles').select('user_id, name').in('user_id', companyIds)
      : { data: [] };

    const internshipMap = new Map((internships || []).map((i) => [i.id, i]));
    const companyMap = new Map((companies || []).map((c) => [c.user_id, c.name]));

    const enriched = interviews.map((inv) => ({
      ...inv,
      title: internshipMap.get(inv.internship_id)?.title || 'Internship',
      company_name: companyMap.get(inv.company_id) || 'Company',
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Fetch student interviews error:', err);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

router.get('/notifications', async (req, res) => {
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

const { generateLLMResponse } = require('../services/llmService');

// AI Chatbot - Multi-Provider Generative LLM Engine
router.post('/chatbot', async (req, res) => {
  const { message } = req.body;
  const profile = await loadProfile(req.user.id);

  const { data: applications } = await supabase
    .from('applications')
    .select('status, match_score, internship_id')
    .eq('student_id', req.user.id)
    .order('applied_at', { ascending: false });

  const internshipIds = [...new Set((applications || []).map((a) => a.internship_id).filter(Boolean))];
  const { data: appInternships } = internshipIds.length
    ? await supabase.from('internships').select('id, title, company_id').in('id', internshipIds)
    : { data: [] };
  const appInternshipsById = new Map((appInternships || []).map((i) => [i.id, i]));

  const companyIds = [...new Set((appInternships || []).map((i) => i.company_id).filter(Boolean))];
  const { data: appCompanies } = companyIds.length
    ? await supabase.from('company_profiles').select('user_id, name').in('user_id', companyIds)
    : { data: [] };
  const appCompaniesById = new Map((appCompanies || []).map((c) => [c.user_id, c]));

  const enrichedApps = (applications || []).map((a) => {
    const internship = appInternshipsById.get(a.internship_id);
    return {
      status: a.status,
      match_score: a.match_score,
      title: internship?.title,
      company_name: appCompaniesById.get(internship?.company_id)?.name || '',
    };
  });

  const { data: allInternships } = await supabase.from('internships').select('*');
  const demand = (allInternships || []).flatMap((i) => i.required_skills || []);
  const gaps = gapAnalysis(profile ? profile.skills : [], demand);

  // Compute top recommended internships for AI context
  const companyIdsAll = [...new Set((allInternships || []).map((i) => i.company_id).filter(Boolean))];
  const { data: allCompanies } = companyIdsAll.length
    ? await supabase.from('company_profiles').select('user_id, name').in('user_id', companyIdsAll)
    : { data: [] };
  const allCompaniesById = new Map((allCompanies || []).map((c) => [c.user_id, c]));

  const rankedInternships = (allInternships || []).map((i) => {
    const match = computeMatch(profile || {}, i);
    return {
      title: i.title,
      company_name: allCompaniesById.get(i.company_id)?.name || 'Verified Company',
      match,
    };
  }).sort((a, b) => b.match.overall - a.match.overall).slice(0, 5);

  try {
    const reply = await generateLLMResponse({
      message,
      profile: profile || {},
      applications: enrichedApps,
      gapAnalysis: gaps,
      internships: rankedInternships,
    });
    res.json({ reply });
  } catch (err) {
    console.error('Chatbot LLM Error:', err);
    res.status(500).json({ error: 'AI Assistant processing error' });
  }
});

module.exports = router;
