const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const supabase = require('../db');

const FILE_PATH = path.join(__dirname, '..', 'data', 'premium_requests.json');

function ensureFile() {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, JSON.stringify([]));
}

function readLocal() {
  ensureFile();
  try {
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeLocal(data) {
  ensureFile();
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

const premiumStore = {
  async getStatus(userId) {
    const local = readLocal();
    const found = local.find((r) => r.user_id === userId);
    if (found) {
      return {
        is_premium: found.status === 'active',
        status: found.status,
        requested_at: found.requested_at,
        activated_at: found.activated_at,
        plan: found.plan || 'PMIS Early Access Pro',
      };
    }

    // Default status if no record
    return {
      is_premium: false,
      status: 'none',
      requested_at: null,
      activated_at: null,
      plan: 'Standard',
    };
  },

  async getAllRequests() {
    const local = readLocal();
    // Also fetch current profile details for freshness
    const { data: students } = await supabase
      .from('student_profiles')
      .select('user_id, name, phone, location, cgpa, skills, resume_filename, users!inner(email)');

    const studentMap = new Map();
    (students || []).forEach((s) => {
      studentMap.set(s.user_id, {
        name: s.name,
        email: s.users?.email,
        phone: s.phone,
        location: s.location,
        cgpa: s.cgpa,
        skills: s.skills || [],
        resume_filename: s.resume_filename,
      });
    });

    return local.map((req) => {
      const profile = studentMap.get(req.user_id) || {};
      return {
        ...req,
        name: req.name || profile.name || 'Student Candidate',
        email: req.email || profile.email || 'N/A',
        phone: profile.phone,
        location: profile.location,
        cgpa: profile.cgpa,
        skills: profile.skills,
        resume_filename: profile.resume_filename,
      };
    }).sort((a, b) => new Date(b.requested_at || 0) - new Date(a.requested_at || 0));
  },

  async createOrUpdateRequest({ userId, email, name, plan = 'PMIS Early Access Pro', note = '' }) {
    const local = readLocal();
    const existingIdx = local.findIndex((r) => r.user_id === userId);
    const now = new Date().toISOString();

    let record;
    if (existingIdx >= 0) {
      record = {
        ...local[existingIdx],
        name: name || local[existingIdx].name,
        email: email || local[existingIdx].email,
        plan,
        note,
        status: local[existingIdx].status === 'active' ? 'active' : 'pending',
        requested_at: now,
        updated_at: now,
      };
      local[existingIdx] = record;
    } else {
      record = {
        id: nanoid(),
        user_id: userId,
        name: name || 'Student Candidate',
        email: email || '',
        plan,
        note,
        status: 'pending',
        requested_at: now,
        activated_at: null,
        created_at: now,
      };
      local.unshift(record);
    }

    writeLocal(local);

    // Create user in-app notification
    try {
      await supabase.from('notifications').insert({
        id: nanoid(),
        user_id: userId,
        message: `Your application for ${plan} has been submitted to MCA Admin for priority verification.`,
        created_at: now,
      });
    } catch (e) {}

    return record;
  },

  async approve(userId) {
    const local = readLocal();
    const now = new Date().toISOString();
    const idx = local.findIndex((r) => r.user_id === userId);
    let record;

    if (idx >= 0) {
      local[idx] = {
        ...local[idx],
        status: 'active',
        activated_at: now,
        updated_at: now,
      };
      record = local[idx];
    } else {
      record = {
        id: nanoid(),
        user_id: userId,
        plan: 'PMIS Early Access Pro',
        status: 'active',
        requested_at: now,
        activated_at: now,
        created_at: now,
      };
      local.unshift(record);
    }
    writeLocal(local);

    // Send confirmation notification
    try {
      await supabase.from('notifications').insert({
        id: nanoid(),
        user_id: userId,
        message: '🎉 Congratulations! Your PMIS Premium Tier has been verified & activated by Admin. You now have priority candidate ranking, unlimited AI ATS parsing, and 24/7 AI Career Mentorship.',
        created_at: now,
      });
    } catch (e) {}

    return record;
  },

  async reject(userId, reason = 'Did not meet criteria') {
    const local = readLocal();
    const now = new Date().toISOString();
    const idx = local.findIndex((r) => r.user_id === userId);
    let record = null;

    if (idx >= 0) {
      local[idx] = {
        ...local[idx],
        status: 'rejected',
        rejection_reason: reason,
        updated_at: now,
      };
      record = local[idx];
      writeLocal(local);
    }

    // Send notification
    try {
      await supabase.from('notifications').insert({
        id: nanoid(),
        user_id: userId,
        message: `Your PMIS Premium request was reviewed. Status: Declined (${reason}). You can reapply with updated project credentials.`,
        created_at: now,
      });
    } catch (e) {}

    return record;
  },

  async revoke(userId) {
    const local = readLocal();
    const now = new Date().toISOString();
    const idx = local.findIndex((r) => r.user_id === userId);
    let record = null;

    if (idx >= 0) {
      local[idx] = {
        ...local[idx],
        status: 'none',
        updated_at: now,
      };
      record = local[idx];
      writeLocal(local);
    }

    return record;
  },
};

module.exports = premiumStore;
