const fs = require('fs');
const path = require('path');
const supabase = require('../db');

const FILE_PATH = path.join(__dirname, '..', 'data', 'interviews.json');

// Helper to ensure data dir exists
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

/**
 * Interview DB / Persistence Store Helper
 */
const interviewStore = {
  async getByCompany(companyId) {
    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('company_id', companyId)
        .order('scheduled_at', { ascending: true });
      if (!error && data) return data;
    } catch (e) {
      // fallback to local file
    }
    const local = readLocal();
    return local
      .filter((i) => i.company_id === companyId)
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  },

  async getByStudent(studentId) {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('student_id', studentId)
        .order('scheduled_at', { ascending: true });
      if (!error && data) return data;
    } catch (e) {
      // fallback
    }
    const local = readLocal();
    return local
      .filter((i) => i.student_id === studentId)
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  },

  async getByApplication(applicationId) {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('application_id', applicationId)
        .maybeSingle();
      if (!error && data) return data;
    } catch (e) {
      // fallback
    }
    const local = readLocal();
    return local.find((i) => i.application_id === applicationId) || null;
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) return data;
    } catch (e) {
      // fallback
    }
    const local = readLocal();
    return local.find((i) => i.id === id) || null;
  },

  async create(interviewData) {
    const record = {
      ...interviewData,
      status: interviewData.status || 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to local file backup
    const local = readLocal();
    const existingIdx = local.findIndex((i) => i.id === record.id || i.application_id === record.application_id);
    if (existingIdx >= 0) {
      local[existingIdx] = record;
    } else {
      local.push(record);
    }
    writeLocal(local);

    // Also attempt Supabase insert if table exists
    try {
      await supabase.from('interviews').insert(record);
    } catch (e) {
      // Supabase table might not exist yet; local file guarantees persistence
    }

    return record;
  },

  async update(id, updates) {
    const updated_at = new Date().toISOString();
    const local = readLocal();
    const idx = local.findIndex((i) => i.id === id);
    let updatedRecord = null;
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...updates, updated_at };
      updatedRecord = local[idx];
      writeLocal(local);
    }

    try {
      const { data } = await supabase
        .from('interviews')
        .update({ ...updates, updated_at })
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (data) updatedRecord = data;
    } catch (e) {
      // ignore Supabase error
    }

    return updatedRecord;
  },
};

module.exports = interviewStore;
