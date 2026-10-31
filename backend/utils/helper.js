// ============================================
// FATA University Hostel - Shared Helpers
// (replaces clean(), sync_room_availability() from api/db.php and
//  the small inline helpers that were repeated across the PHP files)
// ============================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const TIMEZONE = 'Asia/Karachi'; // same timezone as api/config/headers.php

// Case-insensitive collation (MySQL utf8mb4_unicode_ci was case-insensitive)
const CI = { locale: 'en', strength: 2 };

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// --------------------------------------------
// INPUT CLEANING  (replaces clean($conn, $val))
// Only plain strings/numbers are accepted, which also stops NoSQL-operator
// injection such as {"email": {"$ne": null}}
// --------------------------------------------
function str(v) {
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return '';
}

function lower(v) {
  return str(v).toLowerCase();
}

function int(v, fallback = 0) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

function float(v, fallback = 0) {
  const n = parseFloat(v);
  return Number.isNaN(n) ? fallback : n;
}

// Returns the id string if it is a valid Mongo ObjectId, otherwise null
function toId(v) {
  const s = str(v);
  return s && mongoose.isValidObjectId(s) ? s : null;
}

function ucfirst(s) {
  s = str(s);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// --------------------------------------------
// ROLES
// --------------------------------------------
function modelForRole(role) {
  // 'Faculty'/'faculty' -> Faculty collection, everything else -> Student
  return String(role).toLowerCase() === 'faculty'
    ? require('../models/Faculty')
    : require('../models/Student');
}

function dashboardPath(role) {
  if (role === 'Admin') return '/admin/dashboard';
  if (role === 'Faculty') return '/faculty/dashboard';
  return '/student/dashboard';
}

function clientUrl() {
  const first = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  return first.replace(/\/+$/, '');
}

// --------------------------------------------
// DATE / NUMBER FORMATTING
// --------------------------------------------
// 'YYYY-MM-DD' in Asia/Karachi (replaces PHP date('Y-m-d') / CURDATE())
function todayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
}

// PHP number_format()
function numberFormat(n, decimals = 0) {
  return Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// PHP date('d M Y, h:i A')
function dateTimeLabel(d = new Date()) {
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TIMEZONE });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: TIMEZONE });
  return `${date}, ${time}`;
}

// PHP date('d M Y')
function dateLabel(d = new Date()) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TIMEZONE });
}

function currentYear() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', timeZone: TIMEZONE });
}

// PHP: 'RCP-' . strtoupper(substr(md5(uniqid()), 0, 8))
function generateReceiptNo() {
  return 'RCP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// PHP htmlspecialchars()
function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Login notification email: "Browser on OS" (same detection rules as auth.php)
function parseDevice(agent = '') {
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  if (/windows/i.test(agent)) os = 'Windows';
  else if (/macintosh/i.test(agent)) os = 'macOS';
  else if (/android/i.test(agent)) os = 'Android';
  else if (/iphone|ipad/i.test(agent)) os = 'iOS';
  else if (/linux/i.test(agent)) os = 'Linux';

  if (/chrome/i.test(agent) && !/edge|opr/i.test(agent)) browser = 'Google Chrome';
  else if (/firefox/i.test(agent)) browser = 'Mozilla Firefox';
  else if (/edge|edg/i.test(agent)) browser = 'Microsoft Edge';
  else if (/safari/i.test(agent) && !/chrome/i.test(agent)) browser = 'Safari';
  else if (/opr|opera/i.test(agent)) browser = 'Opera';

  return `${browser} on ${os}`;
}

// --------------------------------------------
// FILE UPLOADS  (replaces move_uploaded_file / unlink on ../assets/uploads/*)
// Files are stored under <backend>/uploads and served at /assets/uploads/*
// so the paths saved in the database look exactly like before:
//   assets/uploads/profile/student_1710000000_1234.jpg
// --------------------------------------------
// Vercel's filesystem is read-only except /tmp
const UPLOAD_ROOT = process.env.VERCEL
  ? '/tmp/uploads'
  : path.join(__dirname, '..', 'uploads');

function extOf(filename) {
  return path.extname(filename || '').replace('.', '').toLowerCase();
}

function hasFile(file) {
  return !!(file && file.originalname);
}

function saveUpload(file, folder, filename) {
  const dir = path.join(UPLOAD_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), file.buffer);
  return `assets/uploads/${folder}/${filename}`;
}

function deleteUpload(relPath) {
  if (!relPath || typeof relPath !== 'string') return;
  const rel = relPath.replace(/^assets\/uploads\//, '');
  const full = path.resolve(UPLOAD_ROOT, rel);
  // never delete anything outside the uploads folder
  if (!full.startsWith(path.resolve(UPLOAD_ROOT) + path.sep)) return;
  try {
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch (e) { /* ignore, same as @unlink() */ }
}

// --------------------------------------------
// ROOM AVAILABILITY SYNC  (replaces sync_room_availability() in db.php)
// Recalculates available_spaces + status from the approved applications
// --------------------------------------------
async function syncRoomAvailability(roomId) {
  if (!roomId) return;
  const Room = require('../models/Room');
  const Application = require('../models/Application');

  const room = await Room.findById(roomId);
  if (!room) return;

  const occupied = await Application.countDocuments({
    room_id: room._id,
    status: 'Approved',
    application_type: 'Apply'
  });

  const available = Math.max(0, room.capacity - occupied);
  room.available_spaces = available;
  room.status = available <= 0 ? 'Full' : 'Available';
  await room.save();
}

// "Auto-heal": sync every room (called before room lists are returned)
async function syncAllRooms() {
  const Room = require('../models/Room');
  const Application = require('../models/Application');

  const rooms = await Room.find({}, 'capacity available_spaces status');
  if (!rooms.length) return;

  const counts = await Application.aggregate([
    { $match: { status: 'Approved', application_type: 'Apply' } },
    { $group: { _id: '$room_id', c: { $sum: 1 } } }
  ]);
  const occupiedBy = new Map(counts.map(c => [String(c._id), c.c]));

  const ops = [];
  for (const room of rooms) {
    const occupied = occupiedBy.get(String(room._id)) || 0;
    const available = Math.max(0, room.capacity - occupied);
    const status = available <= 0 ? 'Full' : 'Available';
    if (room.available_spaces !== available || room.status !== status) {
      ops.push({
        updateOne: {
          filter: { _id: room._id },
          update: { $set: { available_spaces: available, status } }
        }
      });
    }
  }
  if (ops.length) await Room.bulkWrite(ops);
}

// --------------------------------------------
// MONGOOSE PLUGIN: JSON output
// _id -> id (string) and never leak password / reset token columns
// (replaces the unset($row['password'], ...) calls in admin.php / user.php)
// --------------------------------------------
function toJSONPlugin(schema) {
  schema.set('toJSON', {
    versionKey: false,
    transform(doc, ret) {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.password;
      delete ret.reset_token;
      delete ret.reset_token_expiry;
      return ret;
    }
  });
}

// Wraps async route handlers so thrown errors reach the Express error handler
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  TIMEZONE,
  CI,
  MONTHS,
  UPLOAD_ROOT,
  str,
  lower,
  int,
  float,
  toId,
  ucfirst,
  modelForRole,
  dashboardPath,
  clientUrl,
  todayStr,
  numberFormat,
  dateTimeLabel,
  dateLabel,
  currentYear,
  generateReceiptNo,
  escapeHtml,
  parseDevice,
  extOf,
  hasFile,
  saveUpload,
  deleteUpload,
  syncRoomAvailability,
  syncAllRooms,
  toJSONPlugin,
  asyncHandler
};
