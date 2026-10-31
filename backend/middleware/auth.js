// ============================================
// Auth middleware (replaces api/middleware.php + PHP sessions)
// Login state lives in a signed JWT stored in an HTTP-only cookie
// ============================================
const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'hostel_token';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours (same as session.gc_maxlifetime)

const secret = () => process.env.JWT_SECRET || 'dev_secret_change_me';
const isProd = () => process.env.NODE_ENV === 'production';

function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: isProd() ? 'none' : 'lax',
    maxAge: MAX_AGE_MS
  };
}

function signToken(id, role) {
  return jwt.sign({ id: String(id), role }, secret(), { expiresIn: '24h' });
}

function setAuthCookie(res, id, role) {
  res.cookie(COOKIE_NAME, signToken(id, role), cookieOptions());
}

function clearAuthCookie(res) {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(COOKIE_NAME, opts);
}

// Reads the token cookie (or Bearer header) -> req.auth = { id, role } or null
function readAuth(req) {
  let token = req.cookies && req.cookies[COOKIE_NAME];
  const header = req.headers.authorization || '';
  if (!token && header.startsWith('Bearer ')) token = header.slice(7);
  if (!token) return null;
  try {
    const p = jwt.verify(token, secret());
    return { id: p.id, role: p.role };
  } catch (e) {
    return null;
  }
}

function attachAuth(req, res, next) {
  req.auth = readAuth(req);
  next();
}

// require_admin()
function requireAdmin(req, res, next) {
  const a = req.auth || readAuth(req);
  if (!a || a.role !== 'Admin') {
    return res.status(401).json({ success: false, message: 'Unauthorized. Admin access required.' });
  }
  req.auth = a;
  req.adminId = a.id;
  next();
}

// require_user() - student or faculty
function requireUser(req, res, next) {
  const a = req.auth || readAuth(req);
  if (!a || !a.id || !a.role || a.role === 'Admin') {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
  }
  req.auth = a;
  req.uid = a.id;
  req.role = a.role; // 'Student' | 'Faculty'
  next();
}

// any logged in account (used by update_password which works for all three roles)
function requireAuth(req, res, next) {
  const a = req.auth || readAuth(req);
  if (!a) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  req.auth = a;
  next();
}

module.exports = { attachAuth, requireAdmin, requireUser, requireAuth, setAuthCookie, clearAuthCookie, readAuth };
