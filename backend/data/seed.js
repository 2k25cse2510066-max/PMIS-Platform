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
    await supabase.from('company_profiles').insert({ user_id: id, name, verified: true });
  }

  const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  return user;
}

const DEMO_INTERNSHIPS_DATA = [
  {
    title: "Full Stack Development Intern",
    company_name: "TechNova Solutions",
    email: "hr@technova.com",
    location: "Kanpur",
    stipend: "₹15,000/month",
    type: "Hybrid",
    required_skills: ["react", "node.js", "express.js", "mongodb", "rest apis"],
    description: "Work on our MERN customer platform. Build scalable REST APIs and modern React components.",
    seats: 3
  },
  {
    title: "Data Analytics Intern",
    company_name: "DataSphere Technologies",
    email: "hr@datasphere.com",
    location: "Remote",
    stipend: "₹10,000/month",
    type: "Remote",
    required_skills: ["python", "sql", "excel", "power bi", "tableau"],
    description: "Analyze product usage datasets and construct interactive reporting dashboards.",
    seats: 2
  },
  {
    title: "Machine Learning Intern",
    company_name: "GreenFields AI",
    email: "hr@greenfields.com",
    location: "Bengaluru",
    stipend: "₹20,000/month",
    type: "On-site",
    required_skills: ["python", "machine learning", "pandas", "numpy", "tensorflow"],
    description: "Build crop-yield prediction models using satellite and weather time series data.",
    seats: 4
  },
  {
    title: "Frontend Developer Intern",
    company_name: "PixelCraft Technologies",
    email: "hr@pixelcraft.com",
    location: "Noida",
    stipend: "₹12,000/month",
    type: "Hybrid",
    required_skills: ["react", "javascript", "html", "css", "typescript"],
    description: "Craft responsive, pixel-perfect user interfaces with React, Tailwind and modern JavaScript.",
    seats: 5
  },
  {
    title: "Backend Developer Intern",
    company_name: "CloudStack Labs",
    email: "hr@cloudstack.com",
    location: "Remote",
    stipend: "₹14,000/month",
    type: "Remote",
    required_skills: ["node.js", "express.js", "mongodb", "rest apis", "docker", "redis"],
    description: "Develop high-throughput REST APIs and manage data pipelines using Node.js and MongoDB.",
    seats: 3
  },
  {
    title: "AI Engineer Intern",
    company_name: "NeuralEdge Technologies",
    email: "hr@neuraledge.com",
    location: "Hyderabad",
    stipend: "₹22,000/month",
    type: "Hybrid",
    required_skills: ["python", "machine learning", "nlp", "llm", "pytorch"],
    description: "Train NLP models and build LLM-powered enterprise automation assistants.",
    seats: 2
  },
  {
    title: "Software Development Intern",
    company_name: "CodeBridge India",
    email: "hr@codebridge.com",
    location: "Pune",
    stipend: "₹16,000/month",
    type: "Hybrid",
    required_skills: ["java", "dsa", "oops", "sql", "spring boot"],
    description: "Build robust core banking and enterprise modules with Java, Spring Boot and SQL.",
    seats: 6
  },
  {
    title: "Python Developer Intern",
    company_name: "ByteWorks Pvt. Ltd.",
    email: "hr@byteworks.com",
    location: "Remote",
    stipend: "₹11,000/month",
    type: "Remote",
    required_skills: ["python", "flask", "sql", "git", "docker"],
    description: "Develop backend microservices and automation scripts using Python and Flask.",
    seats: 4
  },
  {
    title: "Cloud Computing Intern",
    company_name: "SkyGrid Systems",
    email: "hr@skygrid.com",
    location: "Mumbai",
    stipend: "₹18,000/month",
    type: "On-site",
    required_skills: ["aws", "linux", "networking", "git", "terraform", "docker"],
    description: "Manage AWS cloud infrastructure, automation scripts, and Linux servers.",
    seats: 3
  },
  {
    title: "Cyber Security Intern",
    company_name: "SecureNet Labs",
    email: "hr@securenet.com",
    location: "Delhi",
    stipend: "₹13,000/month",
    type: "Hybrid",
    required_skills: ["networking", "linux", "cyber security", "python", "wireshark", "siem"],
    description: "Perform vulnerability assessments, network traffic audits, and security telemetry analysis.",
    seats: 2
  },
  {
    title: "UI/UX Design Intern",
    company_name: "DesignOrbit Studio",
    email: "hr@designorbit.com",
    location: "Remote",
    stipend: "₹9,000/month",
    type: "Remote",
    required_skills: ["figma", "ui design", "ux research", "prototyping", "design systems"],
    description: "Design intuitive web/mobile wireframes, conduct user research, and maintain UI component libraries in Figma.",
    seats: 5
  },
  {
    title: "DevOps Intern",
    company_name: "DeployX Technologies",
    email: "hr@deployx.com",
    location: "Bengaluru",
    stipend: "₹17,000/month",
    type: "Hybrid",
    required_skills: ["linux", "git", "docker", "ci/cd", "kubernetes"],
    description: "Build and maintain continuous integration and deployment (CI/CD) pipelines with Docker & Kubernetes.",
    seats: 3
  },
  {
    title: "Data Science Intern",
    company_name: "InsightWorks Analytics",
    email: "hr@insightworks.com",
    location: "Hyderabad",
    stipend: "₹18,000/month",
    type: "Hybrid",
    required_skills: ["python", "pandas", "numpy", "statistics", "scikit-learn"],
    description: "Perform exploratory data analysis and build statistical prediction models for business intelligence.",
    seats: 2
  },
  {
    title: "Android Development Intern",
    company_name: "AppForge Technologies",
    email: "hr@appforge.com",
    location: "Noida",
    stipend: "₹14,000/month",
    type: "On-site",
    required_skills: ["java", "android", "kotlin", "xml", "firebase"],
    description: "Develop native Android mobile apps with Kotlin/Java and Firebase cloud services.",
    seats: 4
  },
  {
    title: "Generative AI Intern",
    company_name: "FutureMind AI",
    email: "hr@futuremind.com",
    location: "Remote",
    stipend: "₹20,000/month",
    type: "Remote",
    required_skills: ["python", "llm", "rag", "prompt engineering", "vector databases"],
    description: "Architect Retrieval-Augmented Generation (RAG) pipelines and fine-tune large language models.",
    seats: 2
  },
  {
    title: "MERN Stack Intern",
    company_name: "WebNova Labs",
    email: "hr@webnova.com",
    location: "Lucknow",
    stipend: "₹13,000/month",
    type: "Hybrid",
    required_skills: ["mongodb", "express.js", "react", "node.js", "typescript"],
    description: "Build full-stack applications from front-end state management to backend database schemas.",
    seats: 5
  },
  {
    title: "Business Intelligence Intern",
    company_name: "MarketPulse Analytics",
    email: "hr@marketpulse.com",
    location: "Gurugram",
    stipend: "₹12,000/month",
    type: "Hybrid",
    required_skills: ["sql", "excel", "power bi", "data analysis", "tableau"],
    description: "Translate enterprise KPIs into Power BI charts and executive business summaries.",
    seats: 3
  },
  {
    title: "Software Testing Intern",
    company_name: "QualityFirst Systems",
    email: "hr@qualityfirst.com",
    location: "Pune",
    stipend: "₹10,000/month",
    type: "On-site",
    required_skills: ["testing", "selenium", "java", "sql", "api testing"],
    description: "Automate web and API test suites using Selenium WebDriver and Postman/JUnit.",
    seats: 4
  },
  {
    title: "Blockchain Developer Intern",
    company_name: "BlockSphere Technologies",
    email: "hr@blocksphere.com",
    location: "Remote",
    stipend: "₹19,000/month",
    type: "Remote",
    required_skills: ["javascript", "solidity", "ethereum", "web3", "smart contracts"],
    description: "Develop smart contracts with Solidity and integrate decentralized dApps using Web3.js / Ethers.",
    seats: 2
  },
  {
    title: "Full Stack AI Intern",
    company_name: "InnovateX Labs",
    email: "hr@innovatex.com",
    location: "Kanpur",
    stipend: "₹18,000/month",
    type: "Hybrid",
    required_skills: ["react", "node.js", "python", "llm"],
    description: "Build end-to-end full stack web applications deeply integrated with autonomous AI agents and LLM APIs.",
    seats: 2
  }
];

async function seed() {
  try {
    // Admin
    await upsertUser('admin@mca.gov.in', 'admin123', 'admin', 'Admin');

    // Student
    const s1 = await upsertUser('rahul.sharma@example.com', 'student123', 'student', 'Rahul Sharma');
    await supabase
      .from('student_profiles')
      .update({
        location: 'Kanpur',
        preferred_type: 'Remote',
        cgpa: 8.4,
        skills: ['c++', 'react', 'node.js', 'mongodb', 'data structures', 'algorithms', 'python', 'sql', 'javascript', 'rest apis'],
        projects: [{ title: 'E-commerce Platform', description: 'Built a MERN e-commerce website with cart, payments and an admin panel.' }],
      })
      .eq('user_id', s1.id);

    // Upsert Companies & Postings
    for (const item of DEMO_INTERNSHIPS_DATA) {
      const companyUser = await upsertUser(item.email, 'company123', 'company', item.company_name);
      
      const { data: existingPost } = await supabase
        .from('internships')
        .select('id')
        .eq('title', item.title)
        .eq('company_id', companyUser.id)
        .maybeSingle();

      if (!existingPost) {
        await supabase.from('internships').insert({
          id: nanoid(),
          company_id: companyUser.id,
          title: item.title,
          description: item.description,
          required_skills: item.required_skills,
          location: item.location,
          type: item.type,
          seats: item.seats,
          stipend: item.stipend,
        });
      }
    }

    console.log(`Seed complete with ${DEMO_INTERNSHIPS_DATA.length} demo internships! Demo logins:`);
    console.log('  Admin:   admin@mca.gov.in / admin123');
    console.log('  Student: rahul.sharma@example.com / student123');
    console.log('  Company: hr@technova.com / company123');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
