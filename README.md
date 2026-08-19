# PM Internship Scheme — Smart Allocation Platform

A working full-stack prototype for the MCA "Smart Automation" theme: AI-assisted
matching of students to internships, built with a real (non-mocked) backend,
database, and matching engine.

## What's included

- **Student**: register, build a profile (skills, projects, certificates), upload
  a PDF resume for automatic parsing, get ranked recommendations with an
  explainable match score, apply, track application status, skill-gap analysis,
  and a rule-based AI assistant.
- **Company**: register, get verified by an admin, post internships, and see
  applicants automatically ranked by match score with a skill breakdown.
- **Admin**: verify companies and students, and view an analytics dashboard
  (skill demand, application status breakdown, seat utilization).
- **Matching engine**: weighted, explainable scoring across skills, location,
  internship type, CGPA and project depth — plus keyword-based skill
  extraction from free text (e.g. "Built a MERN e-commerce website" → react,
  node.js, express.js, mongodb) and from uploaded resumes.

## Why an algorithmic engine instead of calling GPT/Gemini directly

The original spec suggests Gemini/OpenAI + embeddings for semantic matching.
This build implements the same *behaviour* (skill extraction, scoring,
explainability, gap analysis, a chatbot) with a self-contained NLP/rules
engine in `backend/services/matching.js`, so the app works fully offline with
no API keys. If you have a Gemini or OpenAI key, you can swap
`extractSkillsFromText` for an embeddings call and the chatbot's rule
matching for a real LLM call — every route already consumes these functions
through one module, so the rest of the app doesn't need to change.

## Tech stack

- **Backend**: Node.js, Express, SQLite (via `better-sqlite3` — zero setup,
  no separate DB server to install), JWT auth, Multer + `pdf-parse` for
  resume uploads.
- **Frontend**: React 18 + Vite, React Router, Tailwind CSS, Axios.

(The original brief listed PostgreSQL/MongoDB/Next.js/TypeScript — SQLite and
plain Vite+JS were used instead so the project runs immediately with
`npm install` and no external services, database servers, or API keys. The
schema is simple relational data, so swapping in PostgreSQL later is a
straightforward `better-sqlite3` → `pg` change in `backend/db.js`.)

## Running it locally

You need Node.js 18+ installed.

### 1. Configure the Gemini API Key (optional but recommended)

The platform can use **Google Gemini** for AI-powered features like the
chatbot, skill extraction, and resume improvement suggestions. Without a key
the app still works — it falls back to the built-in rule-based NLP engine.

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and sign
   in with your Google account.
2. Click **Create API Key** and copy the generated key.
3. In the `backend/` folder, create a **`.env`** file (this file is gitignored
   and will never be committed):

   ```bash
   cd backend
   cp .env.example .env        # Linux / macOS
   copy .env.example .env      # Windows (CMD)
   ```

4. Open `backend/.env` and paste your key:

   ```env
   PORT=5000
   JWT_SECRET=pmis-dev-secret-change-me
   GEMINI_API_KEY=paste_your_actual_key_here
   ```

> **⚠️ Never commit your real API key.** The `.env` file is already listed in
> `.gitignore`. Only `.env.example` (which contains a placeholder) is tracked
> by git.

### 2. Backend

```bash
cd backend
npm install
npm run seed   # creates the SQLite DB and demo data (safe to re-run)
npm run dev    # starts the API on http://localhost:5000
```

### 3. Frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev    # starts the app on http://localhost:5173
```

Open **http://localhost:5173** in your browser. The Vite dev server proxies
`/api` and `/uploads` requests to the backend automatically — no extra config
needed.

### 4. Android App (Capacitor)

The mobile application is bundled with Capacitor.

To build and sync the Android assets:
```bash
cd frontend
npm run cap:build
```

To build the debug APK directly:
```bash
npm run cap:apk
```
The generated APK will be available at:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

To open the project in Android Studio (for emulator, USB debugging, or release signing):
```bash
npm run cap:open
```

### Demo accounts (created by `npm run seed`)

| Role     | Email                        | Password    | Notes                        |
|----------|-------------------------------|-------------|-------------------------------|
| Student  | rahul.sharma@example.com      | student123  | Pre-filled profile & projects |
| Company  | hr@technova.com                | company123  | Already verified              |
| Company  | hr@greenfields.com             | company123  | Pending verification (demo)   |
| Admin    | admin@mca.gov.in               | admin123    | Verifies companies/students   |

Try this flow: sign in as the student → **Recommendations** tab shows ranked
internships with match seals → open "Why this recommendation?" for the
breakdown → apply → sign in as `hr@technova.com` → see the applicant ranked
and change their status → sign back in as the student to see the status
update on the **Applications** tab.

## Project structure

```
backend/
  server.js              Express app entry point
  db.js                  SQLite schema
  middleware/auth.js      JWT auth + role guard
  services/matching.js    Skill extraction + explainable match scoring ("the AI")
  services/resumeParser.js  PDF resume parsing
  routes/                 auth, student, company, admin, internships
  data/seed.js            Demo data
frontend/
  src/pages/               Landing, Login, Register, Student/Company/Admin dashboards
  src/components/          Navbar, MatchSeal, ProtectedRoute
  src/context/AuthContext.jsx
  src/api/client.js        Axios instance with JWT header injection
```

## What's stubbed / natural next steps

To keep this runnable without any external accounts, a few items from the
original spec are simplified and would be the next things to build out for a
production submission:

- **Chatbot & skill extraction** are rule-based/keyword NLP rather than a live
  LLM call — see the note above on swapping in Gemini/OpenAI.
- **File storage** uses local disk (`backend/uploads/`) instead of
  Cloudinary/S3.
- **Fraud detection, interview practice, and real-time push notifications**
  are not implemented; the notifications table/endpoint exists and can be
  extended with a websocket or polling UI.
- **OAuth** is not wired up; auth is email/password + JWT only.
