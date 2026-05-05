require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { requireAuth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const transmittalsRoutes = require('./routes/transmittals');
const donationsRoutes = require('./routes/donations');
const researchRoutes = require('./routes/research');
const agreementsRoutes = require('./routes/agreements');
const certificationsRoutes = require('./routes/certifications');
const usersRoutes = require('./routes/users');
const filesRoutes = require('./routes/files');
const schoolsRoutes = require('./routes/schools');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
// Larger limits for embedded base64 fallbacks; multer handles real file uploads
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true, limit: '6mb' }));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Public auth + schools (schools list needed for registration form)
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolsRoutes);

// Protected
app.use('/api/transmittals', requireAuth, transmittalsRoutes);
app.use('/api/donations', requireAuth, donationsRoutes);
app.use('/api/research', requireAuth, researchRoutes);
app.use('/api/agreements', requireAuth, agreementsRoutes);
app.use('/api/certifications', requireAuth, certificationsRoutes);
app.use('/api/users', requireAuth, usersRoutes);
app.use('/api/files', requireAuth, filesRoutes);

// Serve client static
const clientDir = path.resolve(__dirname, '../../client');
app.use(express.static(clientDir));

// SPA fallback: serve index.html for any non-API route
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: err.message || 'Internal server error.' } });
});

app.listen(PORT, () => {
  console.log(`CPES server listening on http://localhost:${PORT}`);
});
