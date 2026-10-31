// ============================================
// FATA University Hostel - Public Controller
// (replaces api/public.php - no auth required)
// ============================================
const Room = require('../models/Room');
const Notice = require('../models/Notice');
const Gallery = require('../models/Gallery');
const Setting = require('../models/Setting');

const { sendHostelEmail } = require('../library/mailer');
const templates = require('../library/emailTemplates');
const { str, int, todayStr, syncAllRooms } = require('../utils/helper');

// GET /api/public/rooms?limit=6        (top rooms)
exports.getRooms = async (req, res) => {
  const limit = int(req.query.limit, 6);
  await syncAllRooms(); // auto-heal availability
  const rooms = await Room.find().sort({ _id: 1 }).limit(Math.max(limit, 0));
  res.json({ success: true, rooms });
};

// GET /api/public/rooms/all?hostel=&status=      (all rooms with filter)
exports.getRoomsAll = async (req, res) => {
  const hostel = str(req.query.hostel);
  const status = str(req.query.status);
  await syncAllRooms();

  const filter = {};
  if (hostel) filter.hostel_name = hostel;
  if (status) filter.status = status;

  const rooms = await Room.find(filter).sort({ hostel_name: 1, room_no: 1 });
  res.json({ success: true, rooms });
};

// GET /api/public/notices?limit=4      (active, not expired)
exports.getNotices = async (req, res) => {
  const limit = int(req.query.limit, 4);
  const today = todayStr();
  const notices = await Notice.find({
    status: 'Active',
    $or: [{ expiry_date: null }, { expiry_date: { $gte: today } }]
  }).sort({ _id: -1 }).limit(Math.max(limit, 0));
  res.json({ success: true, notices });
};

// GET /api/public/gallery?limit=6      (approved photos)
exports.getGallery = async (req, res) => {
  const limit = int(req.query.limit, 6);
  const gallery = await Gallery.find({ status: 'Approved' }).sort({ uploaded_at: -1 }).limit(Math.max(limit, 0));
  res.json({ success: true, gallery });
};

// POST /api/public/contact
exports.contact = async (req, res) => {
  const b = req.body || {};
  const name = str(b.name);
  const email = str(b.email);
  const subject = str(b.subject);
  const message = str(b.message);

  if (!name || !email || !message)
    return res.json({ success: false, message: 'Please fill all required fields.' });

  // admin email = saved SMTP user (fallback to the university address)
  let adminEmail = 'info@fu.edu.pk';
  const row = await Setting.findOne({ setting_key: 'smtp_user' });
  if (row && row.setting_value) adminEmail = row.setting_value;

  const tpl = templates.contactMessage({ name, email, subject }, message);
  const sent = await sendHostelEmail(adminEmail, tpl.subject, tpl.html);

  if (sent) res.json({ success: true, message: 'Your message has been sent. We will contact you soon!' });
  else res.json({ success: false, message: 'Failed to send message. Please try again later.' });
};
