// Populates a handful of demo users/internships so the app isn't empty on first run.
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const db = require('../db');

function upsertUser(email, password, role, name) {
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (user) return user;
  const id = nanoid();
  db.prepare('INSERT INTO users (id, email, password, role) VALUES (?,?,?,?)')
    .run(id, email, bcrypt.hashSync(password, 10), role);
  if (role === 'student') db.prepare('INSERT INTO student_profiles (user_id, name) VALUES (?,?)').run(id, name);
  if (role === 'company') db.prepare('INSERT INTO company_profiles (user_id, name) VALUES (?,?)').run(id, name);
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

// Admin
upsertUser('admin@mca.gov.in', 'admin123', 'admin', 'Admin');

// Companies (one verified, one pending to demo the verification flow)
const c1 = upsertUser('hr@technova.com', 'company123', 'company', 'TechNova Solutions');
const c2 = upsertUser('hr@greenfields.com', 'company123', 'company', 'GreenFields AgriTech');
db.prepare('UPDATE company_profiles SET verified = 1, description = ? WHERE user_id = ?')
  .run('A fast-growing product company building web platforms for enterprises.', c1.id);
db.prepare('UPDATE company_profiles SET description = ? WHERE user_id = ?')
  .run('AgriTech startup - pending verification (demo of the admin approval flow).', c2.id);

// Student
const s1 = upsertUser('rahul.sharma@example.com', 'student123', 'student', 'Rahul Sharma');
db.prepare(`UPDATE student_profiles SET location = ?, preferred_type = ?, cgpa = ?, skills = ?, projects = ? WHERE user_id = ?`).run(
  'Kanpur', 'Remote', 8.4,
  JSON.stringify(['c++', 'react', 'node.js', 'mongodb', 'data structures', 'algorithms']),
  JSON.stringify([{ title: 'E-commerce Platform', description: 'Built a MERN e-commerce website with cart, payments and an admin panel.' }]),
  s1.id
);

// Internships
const existing = db.prepare('SELECT COUNT(*) c FROM internships').get().c;
if (existing === 0) {
  const postings = [
    {
      company_id: c1.id, title: 'Full Stack Development Intern',
      description: 'Work on our MERN-based customer portal. Build REST APIs and React components.',
      required_skills: ['react', 'node.js', 'express.js', 'mongodb', 'rest apis', 'javascript'],
      location: 'Kanpur', type: 'Hybrid', seats: 3, stipend: '₹15,000/month',
    },
    {
      company_id: c1.id, title: 'Data Analytics Intern',
      description: 'Analyze product usage data and build dashboards for leadership.',
      required_skills: ['python', 'sql', 'excel', 'power bi'],
      location: 'Remote', type: 'Remote', seats: 2, stipend: '₹10,000/month',
    },
    {
      company_id: c2.id, title: 'Machine Learning Intern',
      description: 'Build crop-yield prediction models using satellite + weather data.',
      required_skills: ['python', 'machine learning', 'pandas', 'numpy'],
      location: 'Bengaluru', type: 'On-site', seats: 1, stipend: '₹20,000/month',
    },
  ];
  postings.forEach((p) => {
    db.prepare(`INSERT INTO internships (id, company_id, title, description, required_skills, location, type, seats, stipend)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(
      nanoid(), p.company_id, p.title, p.description, JSON.stringify(p.required_skills), p.location, p.type, p.seats, p.stipend
    );
  });
}

console.log('Seed complete. Demo logins:');
console.log('  Admin:   admin@mca.gov.in / admin123');
console.log('  Company: hr@technova.com / company123 (verified)');
console.log('  Company: hr@greenfields.com / company123 (pending verification)');
console.log('  Student: rahul.sharma@example.com / student123');
