const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'pmis.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student','company','admin')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  location TEXT,
  preferred_type TEXT,
  cgpa REAL,
  skills TEXT DEFAULT '[]',
  projects TEXT DEFAULT '[]',
  certificates TEXT DEFAULT '[]',
  resume_filename TEXT,
  resume_text TEXT,
  verified INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS company_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  website TEXT,
  verified INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS internships (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  required_skills TEXT DEFAULT '[]',
  location TEXT,
  type TEXT,
  seats INTEGER DEFAULT 1,
  stipend TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  internship_id TEXT REFERENCES internships(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'applied' CHECK(status IN ('applied','shortlisted','interview','offered','rejected')),
  match_score INTEGER,
  match_breakdown TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, internship_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;
