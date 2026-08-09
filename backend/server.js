require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const companyRoutes = require('./routes/company');
const adminRoutes = require('./routes/admin');
const internshipRoutes = require('./routes/internships');
const googleAuthRoutes = require('./routes/googleAuth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/google', googleAuthRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Only start listening when run directly (not when imported by Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`PMIS backend running on http://localhost:${PORT}`));
}

module.exports = app;
