// ============================================
// FATA University Hostel Management System - API entry point
// Express + MongoDB (replaces the PHP /api folder)
// ============================================
process.env.TZ = 'Asia/Karachi'; // same as date_default_timezone_set('Asia/Karachi')
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectDB = require('./database/db');
const { attachAuth } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { UPLOAD_ROOT } = require('./utils/helper');

const app = express();
app.set('trust proxy', 1);

// CORS (api/config/headers.php) - credentials are needed for the login cookie
const allowed = (process.env.CLIENT_URL || '').split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || !allowed.length || allowed.includes(origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  maxAge: 3600
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Uploaded files (profile photos, rooms, gallery, payment proofs) - same URLs as before
app.use('/assets/uploads', express.static(UPLOAD_ROOT));

// API responses must never be cached (headers.php)
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0'
  });
  next();
});

// make sure the database is connected before any API route runs
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection failed: ' + err.message });
  }
});

app.use('/api', attachAuth);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

app.get('/', (req, res) => res.json({ success: true, message: 'FATA University Hostel API is running.' }));

app.use(notFound);
app.use(errorHandler);

// Vercel runs the exported app; locally we start a normal server
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`Hostel API running on http://localhost:${PORT}`)))
    .catch(err => {
      console.error('MongoDB connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = app;
