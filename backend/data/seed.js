// Populates demo users/internships in Supabase so the app isn't empty on first run.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const supabase = require('../db');

async function upsertUser(email, password, role, name) {
  const { data: existing } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  if (existing) return existing;

  const id = nanoid();
  await supabase.from('users').insert({ id, email, password: bcrypt.hashSync(password, 10), role });

  if (role === 'student') {
    await supabase.from('student_profiles').insert({ user_id: id, name });
  }
  if (role === 'company') {
    await supabase.from('company_profiles').insert({ user_id: id, name });
  }

  const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  return user;
}

async function seed() {
  try {
    // Admin
    await upsertUser('admin@mca.gov.in', 'admin123', 'admin', 'Admin');

    // Companies (one verified, one pending to demo the verification flow)
    const c1 = await upsertUser('hr@technova.com', 'company123', 'company', 'TechNova Solutions');
    const c2 = await upsertUser('hr@greenfields.com', 'company123', 'company', 'GreenFields AgriTech');

    await supabase
      .from('company_profiles')
      .update({ verified: true, description: 'A fast-growing product company building web platforms for enterprises.' })
      .eq('user_id', c1.id);

    await supabase
      .from('company_profiles')
      .update({ description: 'AgriTech startup - pending verification (demo of the admin approval flow).' })
      .eq('user_id', c2.id);

    // Student
    const s1 = await upsertUser('rahul.sharma@example.com', 'student123', 'student', 'Rahul Sharma');
    await supabase
      .from('student_profiles')
      .update({
        location: 'Kanpur',
        preferred_type: 'Remote',
        cgpa: 8.4,
        skills: ['c++', 'react', 'node.js', 'mongodb', 'data structures', 'algorithms'],
        projects: [{ title: 'E-commerce Platform', description: 'Built a MERN e-commerce website with cart, payments and an admin panel.' }],
      })
      .eq('user_id', s1.id);

    // Internships
    const { data: existingInternships } = await supabase.from('internships').select('id').limit(1);
    if (!existingInternships || existingInternships.length === 0) {
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

      for (const p of postings) {
        await supabase.from('internships').insert({
          id: nanoid(),
          ...p,
        });
      }
    }

    console.log('Seed complete. Demo logins:');
    console.log('  Admin:   admin@mca.gov.in / admin123');
    console.log('  Company: hr@technova.com / company123 (verified)');
    console.log('  Company: hr@greenfields.com / company123 (pending verification)');
    console.log('  Student: rahul.sharma@example.com / student123');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
