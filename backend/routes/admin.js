const express = require('express');
const supabase = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/companies', async (req, res) => {
  try {
    const { data: rows } = await supabase
      .from('company_profiles')
      .select('*, users!inner(email)')
      .order('verified', { ascending: true });

    const result = (rows || []).map((r) => ({
      user_id: r.user_id,
      name: r.name,
      description: r.description,
      website: r.website,
      verified: r.verified,
      email: r.users?.email,
    }));
    res.json(result);
  } catch (err) {
    console.error('Admin companies error:', err);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.put('/companies/:userId/verify', async (req, res) => {
  try {
    await supabase
      .from('company_profiles')
      .update({ verified: true })
      .eq('user_id', req.params.userId);
    res.json({ message: 'Company verified' });
  } catch (err) {
    console.error('Verify company error:', err);
    res.status(500).json({ error: 'Failed to verify company' });
  }
});

router.get('/students', async (req, res) => {
  try {
    const { data: rows } = await supabase
      .from('student_profiles')
      .select('*, users!inner(email)')
      .order('verified', { ascending: true });

    const result = (rows || []).map((r) => ({
      user_id: r.user_id,
      name: r.name,
      phone: r.phone,
      location: r.location,
      preferred_type: r.preferred_type,
      cgpa: r.cgpa,
      skills: r.skills || [],
      projects: r.projects || [],
      certificates: r.certificates || [],
      resume_filename: r.resume_filename,
      verified: r.verified,
      email: r.users?.email,
    }));
    res.json(result);
  } catch (err) {
    console.error('Admin students error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

router.put('/students/:userId/verify', async (req, res) => {
  try {
    await supabase
      .from('student_profiles')
      .update({ verified: true })
      .eq('user_id', req.params.userId);
    res.json({ message: 'Student verified' });
  } catch (err) {
    console.error('Verify student error:', err);
    res.status(500).json({ error: 'Failed to verify student' });
  }
});

// Analytics Dashboard
router.get('/analytics', async (req, res) => {
  try {
    // Use RPC function for main stats
    const { data: stats, error: statsError } = await supabase.rpc('get_admin_analytics');
    if (statsError) throw statsError;

    const { data: byLocation } = await supabase.rpc('get_location_breakdown');
    const { data: statusBreakdown } = await supabase.rpc('get_status_breakdown');

    // Top skills - fetch all student skills and aggregate in JS
    const { data: studentRows } = await supabase.from('student_profiles').select('skills');
    const allSkills = (studentRows || []).flatMap((r) => r.skills || []);
    const skillCounts = {};
    allSkills.forEach((s) => { skillCounts[s] = (skillCounts[s] || 0) + 1; });
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill, count]) => ({ skill, count }));

    const totalSeats = Number(stats?.totalSeats) || 0;
    const offered = Number(stats?.offered) || 0;

    res.json({
      totalStudents: Number(stats?.totalStudents) || 0,
      totalCompanies: Number(stats?.totalCompanies) || 0,
      verifiedCompanies: Number(stats?.verifiedCompanies) || 0,
      totalInternships: Number(stats?.totalInternships) || 0,
      totalApplications: Number(stats?.totalApplications) || 0,
      totalSeats,
      offered,
      seatUtilization: totalSeats ? Math.round((offered / totalSeats) * 100) : 0,
      byLocation: byLocation || [],
      statusBreakdown: statusBreakdown || [],
      topSkills,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
