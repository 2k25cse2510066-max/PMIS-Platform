const express = require('express');
const { nanoid } = require('nanoid');
const supabase = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { computeMatch } = require('../services/matching');
const interviewStore = require('../services/interviewStore');
const googleCalendarService = require('../services/googleCalendarService');

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

    const oldStatus = app.status;
    await supabase
      .from('applications')
      .update({ status })
      .eq('id', req.params.id);

    // Get company profile name
    const { data: companyProfile } = await supabase
      .from('company_profiles')
      .select('name')
      .eq('user_id', req.user.id)
      .maybeSingle();
    const companyName = companyProfile?.name || 'the recruiter';

    // Only create notification if status changed and not a duplicate
    if (oldStatus !== status) {
      let notifMsg = `Your application for "${internship?.title}" is now: ${status}`;
      if (status === 'shortlisted') {
        notifMsg = `You have been shortlisted for ${internship?.title} at ${companyName}.`;
      }

      const { data: existingNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', app.student_id)
        .eq('message', notifMsg)
        .maybeSingle();

      if (!existingNotif) {
        await supabase.from('notifications').insert({
          id: nanoid(),
          user_id: app.student_id,
          message: notifMsg,
        });
      }
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.put('/applications/bulk-status', async (req, res) => {
  try {
    const { application_ids, status } = req.body;
    if (!Array.isArray(application_ids) || application_ids.length === 0) {
      return res.status(400).json({ error: 'application_ids must be a non-empty array' });
    }
    if (!['applied', 'shortlisted', 'interview', 'offered', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify applications belong to company's posted internships
    const { data: apps } = await supabase
      .from('applications')
      .select('id, student_id, internship_id, status')
      .in('id', application_ids);

    const internshipIds = [...new Set((apps || []).map((a) => a.internship_id))];
    const { data: companyInternships } = await supabase
      .from('internships')
      .select('id, title, company_id')
      .in('id', internshipIds)
      .eq('company_id', req.user.id);

    const internshipMap = new Map((companyInternships || []).map((i) => [i.id, i.title]));
    const validApps = (apps || []).filter((a) => internshipMap.has(a.internship_id));
    const validAppIds = validApps.map((a) => a.id);

    // Get company profile name
    const { data: companyProfile } = await supabase
      .from('company_profiles')
      .select('name')
      .eq('user_id', req.user.id)
      .maybeSingle();
    const companyName = companyProfile?.name || 'the company';

    if (validAppIds.length > 0) {
      await supabase
        .from('applications')
        .update({ status })
        .in('id', validAppIds);

      // Create notifications for each student avoiding duplicates
      for (const a of validApps) {
        if (a.status === status) continue; // Skip if status unchanged
        const title = internshipMap.get(a.internship_id) || 'Internship';
        let msg = `Your application status has been updated to: ${status.toUpperCase()}`;
        if (status === 'shortlisted') {
          msg = `You have been shortlisted for ${title} at ${companyName}.`;
        }

        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', a.student_id)
          .eq('message', msg)
          .maybeSingle();

        if (!existing) {
          await supabase.from('notifications').insert({
            id: nanoid(),
            user_id: a.student_id,
            message: msg,
          });
        }
      }
    }

    res.json({ message: `Updated ${validAppIds.length} applications to ${status}` });
  } catch (err) {
    console.error('Bulk status update error:', err);
    res.status(500).json({ error: 'Failed to bulk update status' });
  }
});

// ===========================================================================
// INTERVIEW MANAGEMENT ENDPOINTS
// ===========================================================================

// Get all interviews for this company
router.get('/interviews', async (req, res) => {
  try {
    const list = await interviewStore.getByCompany(req.user.id);

    // Enrich with student name & internship title
    const studentIds = [...new Set(list.map((i) => i.student_id).filter(Boolean))];
    const internshipIds = [...new Set(list.map((i) => i.internship_id).filter(Boolean))];

    const { data: students } = studentIds.length
      ? await supabase.from('student_profiles').select('user_id, name, location, phone').in('user_id', studentIds)
      : { data: [] };
    const { data: userEmails } = studentIds.length
      ? await supabase.from('users').select('id, email').in('id', studentIds)
      : { data: [] };
    const { data: internships } = internshipIds.length
      ? await supabase.from('internships').select('id, title, location').in('id', internshipIds)
      : { data: [] };

    const studentMap = new Map((students || []).map((s) => [s.user_id, s]));
    const emailMap = new Map((userEmails || []).map((u) => [u.id, u.email]));
    const internshipMap = new Map((internships || []).map((i) => [i.id, i]));

    const enriched = list.map((inv) => ({
      ...inv,
      student_name: studentMap.get(inv.student_id)?.name || 'Student',
      student_email: emailMap.get(inv.student_id) || '',
      student_location: studentMap.get(inv.student_id)?.location || '',
      student_phone: studentMap.get(inv.student_id)?.phone || '',
      internship_title: internshipMap.get(inv.internship_id)?.title || 'Internship',
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Fetch company interviews error:', err);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// Schedule new interview
router.post('/interviews/schedule', async (req, res) => {
  try {
    const { application_id, date, start_time, duration, interview_type, notes } = req.body;

    if (!application_id || !date || !start_time) {
      return res.status(400).json({ error: 'Application ID, Date, and Start Time are required' });
    }

    // Verify application
    const { data: app } = await supabase
      .from('applications')
      .select('*')
      .eq('id', application_id)
      .maybeSingle();

    if (!app) return res.status(404).json({ error: 'Application not found' });

    // Verify company ownership
    const { data: internship } = await supabase
      .from('internships')
      .select('*')
      .eq('id', app.internship_id)
      .eq('company_id', req.user.id)
      .maybeSingle();

    if (!internship) return res.status(403).json({ error: 'Unauthorized to schedule interview for this application' });

    // Get Student details
    const { data: student } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', app.student_id)
      .maybeSingle();
    const { data: studentUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', app.student_id)
      .maybeSingle();

    const { data: companyUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', req.user.id)
      .maybeSingle();

    const { data: companyProfile } = await supabase
      .from('company_profiles')
      .select('name')
      .eq('user_id', req.user.id)
      .maybeSingle();

    const companyName = companyProfile?.name || 'TechNova Solutions';

    // Construct ISO Scheduled Date Time
    const startIso = new Date(`${date}T${start_time}:00`).toISOString();
    const durationMins = Number(duration) || 30;

    // Call Google Calendar Integration
    const gcalEvent = await googleCalendarService.createInterviewEvent({
      companyUserId: req.user.id,
      summary: `${internship.title} Interview - ${student?.name || 'Student'}`,
      description: `PMIS Internship Interview with ${companyName}.\nNotes: ${notes || 'N/A'}`,
      startIso,
      durationMinutes: durationMins,
      studentEmail: studentUser?.email,
      companyEmail: companyUser?.email,
    });

    const interviewId = nanoid();
    const interviewRecord = await interviewStore.create({
      id: interviewId,
      application_id: app.id,
      student_id: app.student_id,
      company_id: req.user.id,
      internship_id: app.internship_id,
      scheduled_at: startIso,
      duration: durationMins,
      interview_type: interview_type || 'Google Meet',
      meeting_url: gcalEvent.meetingUrl,
      calendar_event_id: gcalEvent.eventId,
      status: 'scheduled',
      notes: notes || '',
    });

    // Update Application Status to 'interview'
    await supabase
      .from('applications')
      .update({ status: 'interview' })
      .eq('id', app.id);

    // Format readable date & time for notification
    const dateObj = new Date(startIso);
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const notifMsg = `Interview scheduled for ${internship.title} on ${dateStr} at ${timeStr} via ${interview_type || 'Google Meet'}.`;

    // Prevent duplicate notification
    const { data: existingNotif } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', app.student_id)
      .eq('message', notifMsg)
      .maybeSingle();

    if (!existingNotif) {
      await supabase.from('notifications').insert({
        id: nanoid(),
        user_id: app.student_id,
        message: notifMsg,
      });
    }

    res.json({
      message: 'Interview scheduled successfully',
      interview: interviewRecord,
    });
  } catch (err) {
    console.error('Schedule interview error:', err);
    res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

// Reschedule interview
router.put('/interviews/:id/reschedule', async (req, res) => {
  try {
    const { date, start_time, duration, notes } = req.body;
    const interview = await interviewStore.getById(req.params.id);

    if (!interview || interview.company_id !== req.user.id) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const startIso = new Date(`${date}T${start_time}:00`).toISOString();
    const durationMins = Number(duration) || interview.duration || 30;

    const { data: internship } = await supabase
      .from('internships')
      .select('title')
      .eq('id', interview.internship_id)
      .maybeSingle();

    // Update Google Calendar Event
    await googleCalendarService.updateInterviewEvent({
      companyUserId: req.user.id,
      eventId: interview.calendar_event_id,
      summary: `${internship?.title || 'Internship'} Interview (Rescheduled)`,
      description: `Rescheduled Interview. Notes: ${notes || interview.notes}`,
      startIso,
      durationMinutes: durationMins,
    });

    const updated = await interviewStore.update(req.params.id, {
      scheduled_at: startIso,
      duration: durationMins,
      notes: notes !== undefined ? notes : interview.notes,
      status: 'rescheduled',
    });

    const dateObj = new Date(startIso);
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    await supabase.from('notifications').insert({
      id: nanoid(),
      user_id: interview.student_id,
      message: `Your interview for ${internship?.title || 'Internship'} has been rescheduled to ${dateStr} at ${timeStr}.`,
    });

    res.json(updated);
  } catch (err) {
    console.error('Reschedule interview error:', err);
    res.status(500).json({ error: 'Failed to reschedule interview' });
  }
});

// Cancel interview
router.put('/interviews/:id/cancel', async (req, res) => {
  try {
    const interview = await interviewStore.getById(req.params.id);

    if (!interview || interview.company_id !== req.user.id) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const { data: internship } = await supabase
      .from('internships')
      .select('title')
      .eq('id', interview.internship_id)
      .maybeSingle();

    // Cancel Google Calendar Event
    await googleCalendarService.cancelInterviewEvent({
      companyUserId: req.user.id,
      eventId: interview.calendar_event_id,
    });

    const updated = await interviewStore.update(req.params.id, {
      status: 'cancelled',
    });

    await supabase.from('notifications').insert({
      id: nanoid(),
      user_id: interview.student_id,
      message: `Your interview for ${internship?.title || 'Internship'} has been cancelled.`,
    });

    res.json(updated);
  } catch (err) {
    console.error('Cancel interview error:', err);
    res.status(500).json({ error: 'Failed to cancel interview' });
  }
});

// Update interview status (e.g. mark completed)
router.put('/interviews/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const interview = await interviewStore.getById(req.params.id);

    if (!interview || interview.company_id !== req.user.id) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const updated = await interviewStore.update(req.params.id, { status });
    res.json(updated);
  } catch (err) {
    console.error('Update interview status error:', err);
    res.status(500).json({ error: 'Failed to update interview status' });
  }
});

module.exports = router;
