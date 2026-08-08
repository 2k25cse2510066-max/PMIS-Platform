const express = require('express');
const supabase = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data: rows } = await supabase
      .from('internships')
      .select('*')
      .order('created_at', { ascending: false });

    const companyIds = [...new Set((rows || []).map((r) => r.company_id).filter(Boolean))];
    const { data: companies } = companyIds.length
      ? await supabase.from('company_profiles').select('user_id, name, verified').in('user_id', companyIds)
      : { data: [] };
    const companiesById = new Map((companies || []).map((c) => [c.user_id, c]));

    const result = (rows || []).map((r) => ({
      id: r.id,
      company_id: r.company_id,
      title: r.title,
      description: r.description,
      required_skills: r.required_skills || [],
      location: r.location,
      type: r.type,
      seats: r.seats,
      stipend: r.stipend,
      created_at: r.created_at,
      company_name: companiesById.get(r.company_id)?.name,
      company_verified: companiesById.get(r.company_id)?.verified,
    }));
    res.json(result);
  } catch (err) {
    console.error('Internships list error:', err);
    res.status(500).json({ error: 'Failed to fetch internships' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: row } = await supabase
      .from('internships')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!row) return res.status(404).json({ error: 'Internship not found' });

    const { data: company } = await supabase
      .from('company_profiles')
      .select('name, verified, description')
      .eq('user_id', row.company_id)
      .maybeSingle();

    res.json({
      id: row.id,
      company_id: row.company_id,
      title: row.title,
      description: row.description,
      required_skills: row.required_skills || [],
      location: row.location,
      type: row.type,
      seats: row.seats,
      stipend: row.stipend,
      created_at: row.created_at,
      company_name: company?.name,
      company_verified: company?.verified,
      company_description: company?.description,
    });
  } catch (err) {
    console.error('Internship detail error:', err);
    res.status(500).json({ error: 'Failed to fetch internship' });
  }
});

module.exports = router;
