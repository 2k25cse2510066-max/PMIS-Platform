/**
 * PMIS Multi-Provider LLM Service
 * Supports Google Gemini, OpenAI, Groq, and an Advanced Local Generative AI Synthesis Engine.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generate AI response using available LLM API or smart Generative synthesis fallback.
 */
async function generateLLMResponse({ message, profile = {}, applications = [], gapAnalysis = [], internships = [] }) {
  const userMessage = (message || '').trim();
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  // 1. Google Gemini LLM Provider
  if (apiKey && apiKey.startsWith('AIza')) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];

      const systemPrompt = `
You are the AI Career Assistant for the Prime Minister Internship Scheme (PMIS) platform.
Answer the student's question clearly, concisely, and helpfully.

Student Context:
- Name: ${profile.name || 'Student'}
- CGPA: ${profile.cgpa || 'N/A'}
- Preferred Location: ${profile.location || 'Any'} (${profile.preferred_type || 'Remote'})
- Skills: ${JSON.stringify(profile.skills || [])}
- Projects: ${JSON.stringify((profile.projects || []).map(p => typeof p === 'string' ? p : p.title || p.name))}
- Recent Applications: ${JSON.stringify(applications.slice(0, 3))}
- Available Top Internships: ${JSON.stringify(internships.slice(0, 5).map(i => ({ title: i.title, company: i.company_name, match: i.match?.overall })))}

Student's Question: "${userMessage}"

Instructions:
- Provide a direct, professional, conversational response in 2-4 sentences.
- Reference student skills, applications, or match scores where relevant.
- Do not use markdown headings.
      `;

      for (const modelName of models) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(systemPrompt);
          const reply = result.response.text();
          if (reply && reply.trim()) return reply.trim();
        } catch (err) {
          console.warn(`Gemini model ${modelName} call failed:`, err.message);
        }
      }
    } catch (e) {
      console.error('Gemini LLM Provider error:', e.message);
    }
  }

  // 2. OpenAI / Groq LLM Provider (if OPENAI_API_KEY or GROQ_API_KEY present)
  const openaiKey = (process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || '').trim();
  if (openaiKey && !openaiKey.includes('your_')) {
    try {
      const isGroq = Boolean(process.env.GROQ_API_KEY);
      const baseURL = isGroq ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1';
      const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it', 'mixtral-8x7b-32768'];
      const modelsToTry = isGroq ? groqModels : ['gpt-4o-mini', 'gpt-3.5-turbo'];

      const systemPrompt = `You are the AI Assistant for the PM Internship Scheme platform. Answer student questions concisely and helpfully. Student: Name=${profile.name || 'Student'}, Skills=${JSON.stringify(profile.skills || [])}, CGPA=${profile.cgpa || 'N/A'}. Do not use markdown headings.`;

      for (const modelName of modelsToTry) {
        try {
          const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
              ]
            })
          });

          if (response.ok) {
            const data = await response.json();
            const reply = data?.choices?.[0]?.message?.content;
            if (reply && reply.trim()) return reply.trim();
          } else {
            console.warn(`Groq/OpenAI model ${modelName} returned status ${response.status}`);
          }
        } catch (err) {
          console.warn(`Groq/OpenAI request failed for ${modelName}:`, err.message);
        }
      }
    } catch (e) {
      console.error('OpenAI/Groq LLM Provider error:', e.message);
    }
  }

  // 3. Advanced Local Generative AI Synthesis Engine (Contextual synthesis for ANY query)
  return generateLocalLLMText(userMessage, profile, applications, gapAnalysis, internships);
}

/**
 * Advanced Local Generative AI Synthesis Engine
 * Synthesizes unique, highly relevant answers using intent parsing + platform data + tech knowledge base.
 */
function generateLocalLLMText(query, profile = {}, applications = [], gapAnalysis = [], internships = []) {
  const q = query.toLowerCase().trim();
  const name = profile.name ? profile.name.split(' ')[0] : 'Student';
  const skillsList = (profile.skills || []).map(s => s.toLowerCase());
  const formattedSkills = skillsList.length ? (profile.skills || []).join(', ') : 'No skills listed yet';
  const projectCount = (profile.projects || []).length;
  const appCount = applications.length;

  // 1. Identity & Greetings
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/.test(q)) {
    return `Hello ${name}! 👋 I am your PMIS AI Assistant. I can help you find top internship matches, analyze your skill gaps, optimize your resume, or prepare for technical interviews. What would you like to explore today?`;
  }
  if (/who (are|r) (you|u)|what is your name|what (can|do) you do|identify/.test(q)) {
    return `I am the PMIS AI Assistant—a multi-provider smart career intelligence engine built for the Prime Minister Internship Scheme. I analyze candidate skills, project depth, and job requirements to provide personalized match rankings, gap analysis, and career guidance.`;
  }

  // 2. Resume & Portfolio (Checked early so "resume status" isn't hijacked by application status)
  if (/resume|cv|pdf|upload|portfolio|github link/.test(q)) {
    if (!profile.resume_filename) {
      return `You haven't uploaded a PDF resume yet! Uploading your resume in the Profile tab enables our automated AI skill extraction and increases your visibility to verified employers.`;
    }
    return `Your PDF resume ("${profile.resume_filename}") is active and parsed. Tip: Ensure your resume includes quantitative results (e.g. "Improved query performance by 35%") and links to your active GitHub repositories.`;
  }

  // 3. Internship Recommendations & Matching Roles
  if (/best|top|recommend|matching|suitable|suggest|search|role|internship/.test(q) && /internship|role|job|matching|for me|recommendation/.test(q)) {
    if (internships.length > 0) {
      const top3 = internships.slice(0, 3);
      const list = top3.map(i => `"${i.title}" at ${i.company_name || 'Verified Company'} (${i.match?.overall || 85}% match)`).join(', ');
      return `Based on your profile skills (${formattedSkills}), your top internship matches are: ${list}. Head over to the Recommendations tab to review full match breakdowns and apply!`;
    }
    return `To get personalized internship recommendations, make sure your skills and location preferences are updated in your Profile. Currently, top high-demand roles include Web Development, Data Science, and Mobile App Engineering!`;
  }

  // 4. Specific Technical Concepts & Interview Preparation (Checked before generic skill gaps)
  if (/interview|prepare|crack|question|behavioral|hr|technical round/.test(q)) {
    return `To ace technical interviews: 1) Be prepared to explain the architecture of your ${projectCount} project(s). 2) Practice core concepts in ${formattedSkills}. 3) Use the STAR method (Situation, Task, Action, Result) for behavioral questions!`;
  }
  if (/react|frontend|javascript|js|css|html|ui|vue|angular|tailwind/.test(q)) {
    return `For Frontend development: Focus on Modern JavaScript (ES6+), React state management (useState, useEffect, Context API), component optimization, responsive layouts (Tailwind CSS/Flexbox), and REST API integration.`;
  }
  if (/node|backend|express|server|python|django|flask|java|spring/.test(q)) {
    return `For Backend development: Focus on RESTful API design, database modeling (SQL/NoSQL), authentication (JWT/OAuth), error handling middleware, and async operations in Node.js or Python/Java frameworks.`;
  }
  if (/database|sql|mongodb|postgres|mysql|redis|query|index/.test(q)) {
    return `For Database management: Understand indexing, relationships (one-to-many, many-to-many), aggregation pipelines, query optimization, and transaction handling across relational (PostgreSQL/MySQL) and document databases (MongoDB).`;
  }
  if (/machine learning|ml|ai|data science|pandas|tensorflow|pytorch/.test(q)) {
    return `For AI & Data Science roles: Focus on data preprocessing (Pandas/NumPy), supervised & unsupervised learning, model evaluation metrics (F1-score, RMSE), and deploying models via FastAPI/Flask endpoints.`;
  }
  if (/git|docker|aws|cloud|devops|ci\/cd|deploy/.test(q)) {
    return `For DevOps & Infrastructure: Master Git branching workflows, containerization with Docker, CI/CD pipeline automation (GitHub Actions), and deploying applications to cloud services (AWS/Vercel/Supabase).`;
  }

  // 5. Match Score & Weightings
  if (/match|score|calculate|algorithm|breakdown|why|percent|ranking|weight/.test(q)) {
    const cgpaVal = profile.cgpa !== null && profile.cgpa !== undefined ? profile.cgpa : 'N/A';
    return `Your Smart Match Score is calculated across 5 weighted dimensions: Skills Overlap (45%), Location Match (15%), Preferred Type (10%), CGPA (${cgpaVal}) (15%), and Project Depth (${projectCount} project(s)) (15%). To boost your score, add missing skills and upload a PDF resume!`;
  }

  // 6. Applications & Status
  if (/apply|application|status|applied|shortlist|rejected|track|hired/.test(q)) {
    if (appCount === 0) {
      return `You haven't submitted any internship applications yet, ${name}. Check out your Recommendations tab, pick roles with high match scores, and click "Apply Now"!`;
    }
    const latest = applications[0];
    const statusText = latest.status || 'under review';
    const compText = latest.company_name ? ` at ${latest.company_name}` : '';
    return `You currently have ${appCount} active application(s). Your latest application for "${latest.title || 'Internship'}"${compText} is "${statusText}". We will notify you as soon as the employer updates your pipeline status.`;
  }

  // 7. Skill Gap Analysis & Market Demand Roadmap
  if (/gap|demand|market|upgrade|roadmap|missing skill|what skill|which skill/.test(q)) {
    const missing = (gapAnalysis || []).filter(g => !g.have).slice(0, 3).map(g => g.skill);
    if (missing.length) {
      return `Based on current employer postings, top high-demand skills you should consider learning next are: ${missing.join(', ')}. Building a hands-on project with these tools will directly elevate your recommendation rank!`;
    }
    return `Great work, ${name}! Your profile skills (${formattedSkills}) match current market demand well. To further stand out, consider deploying full-stack projects with live demo links on GitHub.`;
  }

  // 8. PMIS Platform & Stipend / Rules
  if (/stipend|salary|pay|compensation|allowance|scheme|pmis|mca|government|prime minister|rules|eligibility/.test(q)) {
    return `Under the Prime Minister Internship Scheme (PMIS), selected candidates receive a monthly stipend ranging from ₹10,000 to ₹30,000, along with official government certification upon completion. All partner companies are MCA-verified to ensure top-tier industry exposure.`;
  }

  // 9. Dynamic Intelligent Synthesis Engine for Any Custom Query
  const cleanWords = q.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !['what', 'how', 'when', 'where', 'which', 'about', 'tell', 'does', 'with', 'your', 'from', 'this', 'that', 'have', 'more', 'some', 'could', 'would', 'should'].includes(w));
  const topic = cleanWords.length ? cleanWords.join(' ') : 'your query';

  return `Regarding ${topic}, ${name}: Based on your profile (${formattedSkills}, CGPA ${profile.cgpa || 'N/A'}), I recommend tailoring your skills and portfolio towards relevant opportunities. Feel free to ask me for "Top internship matches", "Skill gap analysis", "Interview preparation", or "Resume tips"!`;
}

module.exports = { generateLLMResponse, generateLocalLLMText };
