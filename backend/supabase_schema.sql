-- ============================================================
-- PMIS Platform - Supabase PostgreSQL Schema
-- Migrated from better-sqlite3
-- ============================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'company', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Student profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  location TEXT,
  preferred_type TEXT,
  cgpa REAL,
  skills JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  certificates JSONB DEFAULT '[]'::jsonb,
  resume_filename TEXT,
  resume_text TEXT,
  verified BOOLEAN DEFAULT false
);

-- 3. Company profiles
CREATE TABLE IF NOT EXISTS company_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  website TEXT,
  verified BOOLEAN DEFAULT false
);

-- 4. Internships
CREATE TABLE IF NOT EXISTS internships (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  required_skills JSONB DEFAULT '[]'::jsonb,
  location TEXT,
  type TEXT,
  seats INTEGER DEFAULT 1,
  stipend TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Applications
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  internship_id TEXT REFERENCES internships(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'interview', 'offered', 'rejected')),
  match_score INTEGER,
  match_breakdown JSONB,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, internship_id)
);

-- 6. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Supabase Storage bucket for resume uploads
-- ============================================================
-- Run this in the Supabase Dashboard > Storage > New Bucket:
--   Bucket name: resumes
--   Public: false (private bucket, accessed via service role key)

-- ============================================================
-- RPC functions for analytics aggregations
-- ============================================================

-- Admin analytics: returns all dashboard stats in one call
CREATE OR REPLACE FUNCTION get_admin_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalStudents', (SELECT COUNT(*) FROM users WHERE role = 'student'),
    'totalCompanies', (SELECT COUNT(*) FROM users WHERE role = 'company'),
    'verifiedCompanies', (SELECT COUNT(*) FROM company_profiles WHERE verified = true),
    'totalInternships', (SELECT COUNT(*) FROM internships),
    'totalApplications', (SELECT COUNT(*) FROM applications),
    'totalSeats', (SELECT COALESCE(SUM(seats), 0) FROM internships),
    'offered', (SELECT COUNT(*) FROM applications WHERE status = 'offered')
  ) INTO result;
  RETURN result;
END;
$$;

-- Location breakdown
CREATE OR REPLACE FUNCTION get_location_breakdown()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT COALESCE(location, 'Unspecified') as location, COUNT(*) as count
      FROM student_profiles
      GROUP BY location
      ORDER BY count DESC
    ) t
  );
END;
$$;

-- Status breakdown
CREATE OR REPLACE FUNCTION get_status_breakdown()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT status, COUNT(*) as count
      FROM applications
      GROUP BY status
    ) t
  );
END;
$$;
