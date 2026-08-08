const pdfParse = require('pdf-parse');
const { extractSkillsFromText } = require('./matching');

function guessName(text) {
  const firstLine = text.split('\n').map((l) => l.trim()).find((l) => l.length > 2 && l.length < 60);
  return firstLine || null;
}

function guessEmail(text) {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : null;
}

function guessPhone(text) {
  const m = text.match(/(\+?\d{1,3}[-\s]?)?\d{10}/);
  return m ? m[0] : null;
}

function guessCertifications(text) {
  const lines = text.split('\n');
  const idx = lines.findIndex((l) => /certificat/i.test(l));
  if (idx === -1) return [];
  return lines.slice(idx + 1, idx + 6).map((l) => l.trim()).filter(Boolean).slice(0, 5);
}

/**
 * "AI Resume Parser" - extracts structured fields + skills from a PDF buffer.
 * Works with in-memory buffers (serverless-compatible, no filesystem needed).
 */
async function parseResumeBuffer(buffer) {
  const data = await pdfParse(buffer);
  const text = data.text || '';

  return {
    raw_text: text,
    name: guessName(text),
    email: guessEmail(text),
    phone: guessPhone(text),
    skills: extractSkillsFromText(text),
    certifications: guessCertifications(text),
  };
}

module.exports = { parseResumeBuffer };
