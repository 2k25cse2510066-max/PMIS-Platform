const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const googleCalendarService = require('../services/googleCalendarService');

const router = express.Router();

// Get Google OAuth consent URL
router.get('/auth-url', requireAuth, requireRole('company'), (req, res) => {
  const url = googleCalendarService.getAuthUrl(req.user.id);
  res.json({ url });
});

// Check if company has connected Google Calendar
router.get('/status', requireAuth, requireRole('company'), (req, res) => {
  const connected = googleCalendarService.isConnected(req.user.id);
  res.json({ connected });
});

// OAuth2 Redirect Callback Handler
router.get('/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('Authorization code missing');

    const companyUserId = state;
    await googleCalendarService.handleCallback(code, companyUserId);

    // Redirect to Company Dashboard with success indicator
    res.redirect(`${frontendUrl}/company?google_connected=true`);
  } catch (err) {
    console.error('Google OAuth Callback error:', err);
    res.redirect(`${frontendUrl}/company?google_error=auth_failed`);
  }
});

module.exports = router;
