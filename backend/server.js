require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db'); // ensure tables exist

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const companyRoutes = require('./routes/company');
const adminRoutes = require('./routes/admin');
const internshipRoutes = require('./routes/internships');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/internships', internshipRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`PMIS backend running on http://localhost:${PORT}`));
