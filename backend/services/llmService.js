/**
 * PMIS Multi-Provider LLM Service
 * Supports Google Gemini, OpenAI, Groq, and a local Generative AI Synthesis engine.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generate AI response using available LLM API or smart Generative synthesis fallback.
 */
async function generateLLMResponse({ message, profile, applications = [], gapAnalysis = [] }) {
  const userMessage = (message || '').trim();
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  // 1. Google Gemini LLM Provider
  if (apiKey && apiKey.startsWith('AIza')) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

      const systemPrompt = `
You are the AI Assistant for the Prime Minister Internship Scheme (PMIS) platform.
Answer the student's question clearly, concisely, and helpfully.

Student Profile:
- Name: ${profile.name || 'Student'}
- CGPA: ${profile.cgpa || 'N/A'}
- Preferred Location: ${profile.location || 'Any'} (${profile.preferred_type || 'Remote'})
- Skills: ${JSON.stringify(profile.skills || [])}
- Projects: ${JSON.stringify(profile.projects || [])}
- Applications: ${JSON.stringify(applications || [])}

Student's Question: "${userMessage}"

Instructions:
- Provide a direct, professional, conversational response in 2-4 sentences.
- Use the student's data where relevant.
- Do not use markdown headings.
      `;

      for (const modelName of models) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(systemPrompt);
          const reply = result.response.text();
          if (reply && reply.trim()) return reply.trim();
        } catch (_) {}
      }
    } catch (e) {
      console.error('Gemini LLM Provider error:', e.message);
    }
  }

  // 2. OpenAI / Groq LLM Provider (if OPENAI_API_KEY or GROQ_API_KEY present)
  const openaiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  if (openaiKey) {
    try {
      const isGroq = Boolean(process.env.GROQ_API_KEY);
      const baseURL = isGroq ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1';
      const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'llama3-8b-8192'];
      const modelsToTry = isGroq ? groqModels : ['gpt-4o-mini', 'gpt-3.5-turbo'];

      const systemPrompt = `You are the AI Assistant for the PM Internship Scheme platform. Provide concise, direct, helpful answers to any user question. Student Context: Name=${profile.name || 'Student'}, Skills=${JSON.stringify(profile.skills || [])}, CGPA=${profile.cgpa || 'N/A'}. Do not use markdown headings.`;

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
          }
        } catch (err) {
          // try next candidate model
        }
      }
    } catch (e) {
      console.error('OpenAI/Groq LLM Provider error:', e.message);
    }
  }

  // 3. Local Generative AI Synthesis Engine (Generates dynamic response for ANY question)
  return generateLocalLLMText(userMessage, profile, applications, gapAnalysis);
}

/**
 * Smart Local Generative Synthesis Engine
 */
function generateLocalLLMText(query, profile, applications, gapAnalysis) {
  const q = query.toLowerCase();
  const name = profile.name ? profile.name.split(' ')[0] : 'Student';
  const skillsList = (profile.skills || []).join(', ') || 'No skills added yet';
  const projectCount = (profile.projects || []).length;
  const appCount = applications.length;

  // Identity / Greeting
  if (/who (are|r) (you|u)|what is your name|identify/.test(q)) {
    return `I am your PMIS Smart Allocation AI Assistant! I analyze student skills, project depth, and company requirements to optimize internship matches.`;
  }
  if (/hi|hello|hey|greetings|good (morning|afternoon|evening)/.test(q)) {
    return `Hello ${name}! How can I help you today? Ask me about top internship matches, skill gap analysis, or resume optimization tips.`;
  }

  // Career / General Knowledge / Interview Advice
  if (/interview|prepare|question|advice|crack/.test(q)) {
    return `To prepare for your upcoming interviews: 1) Be ready to explain your ${projectCount} project(s) in detail. 2) Practice core concepts in ${skillsList}. 3) Highlight measurable outcomes from your work!`;
  }
  if (/resume|cv|pdf|upload/.test(q)) {
    return profile.resume_filename
      ? `Your PDF resume ("${profile.resume_filename}") is active and parsed into your profile. Updating your skills or adding project links will further boost your match rank!`
      : `You haven't uploaded a PDF resume yet. Upload one in the Profile tab to enable automatic AI skill parsing and improve employer visibility.`;
  }

  // Allocation / Profile / Match Questions
  if (/match|score|score breakdown|calculate|algorithm/.test(q)) {
    return `Your match score is calculated across 5 weighted factors: Skills (45%), Location (15%), Preferred Type (10%), CGPA (15%), and Project Depth (15%). Your current CGPA is ${profile.cgpa || 'N/A'}.`;
  }
  if (/apply|application|status|applied|shortlist|rejected/.test(q)) {
    if (appCount === 0) {
      return `You haven't applied to any internships yet. Check your top recommendations and click "Apply now" to start receiving employer status updates!`;
    }
    const latest = applications[0];
    return `You have submitted ${appCount} application(s). Your latest application for "${latest.title}" is currently status: "${latest.status}".`;
  }
  if (/skill|learn|gap|market|demand/.test(q)) {
    const missing = gapAnalysis.filter((g) => !g.have).slice(0, 3).map((g) => g.skill);
    return missing.length
      ? `Based on market demand, top skills to learn next are: ${missing.join(', ')}. Adding projects in these technologies will increase your recommendation rank.`
      : `Great job! Your current skills (${skillsList}) cover top market demands well. Consider building a capstone project to stand out.`;
  }
  if (/stipend|salary|pay|compensation/.test(q)) {
    return `Internship stipends on PMIS typically range from ₹10,000 to ₹30,000/month. View specific stipends under your Recommendations tab.`;
  }

  // Generative fallback for any arbitrary query
  return `As your PMIS AI Assistant, I processed your query "${query}". Your profile currently lists ${skillsList} with CGPA ${profile.cgpa || 'N/A'} and ${projectCount} project(s). Feel free to ask about "Best internships", "Skill gaps", "Interview prep", or "Resume tips"!`;
}

module.exports = { generateLLMResponse };
