// ============================================
// FATA University Hostel - User Controller
// For: Student and Faculty  (replaces api/user.php)
// req.uid / req.role are set by the requireUser middleware
// ============================================
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const Admin = require('../models/Admin');
const Room = require('../models/Room');
const Application = require('../models/Application');
const Fee = require('../models/Fee');
const Complaint = require('../models/Complaint');
const Notice = require('../models/Notice');
const Gallery = require('../models/Gallery');

const { sendHostelEmail } = require('../library/mailer');
const templates = require('../library/emailTemplates');
const {
  str, lower, toId, modelForRole, todayStr, numberFormat, MONTHS,
  extOf, hasFile, saveUpload, syncRoomAvailability, syncAllRooms
} = require('../utils/helper');

const ok = (res, data = {}) => res.json({ success: true, ...data });
const fail = (res, message, status = 200) => res.status(status).json({ success: false, message });
const sendTemplate = (to, tpl) => sendHostelEmail(to, tpl.subject, tpl.html);

const ts = () => Math.floor(Date.now() / 1000);

// latest approved "Apply" application of the logged in user, with its room
async function currentAssignment(uid, role) {
  const app = await Application.findOne({
    user_id: uid, user_role: role, status: 'Approved', application_type: 'Apply'
  }).sort({ applied_at: -1 }).populate('room_id');
  return app && app.room_id ? app : null;
}

// ============================================
// GET PROFILE   GET /api/user/profile
// ============================================
exports.getProfile = async (req, res) => {
  const user = await modelForRole(req.role).findById(req.uid);
  if (!user) return fail(res, 'User not found.');
  ok(res, { profile: user, user, role: req.role });
};

// ============================================
// UPDATE PROFILE (phone, address, photo, semester)   PUT /api/user/profile
// ============================================
exports.updateProfile = async (req, res) => {
  const b = req.body || {};
  const phone = str(b.phone);
  const address = str(b.home_address);
  const semester = str(b.semester);

  if (req.role === 'Student' && !semester)
    return fail(res, 'Please select your semester.');

  const update = { phone, home_address: address };
  if (req.role === 'Student') update.semester = semester;

  if (hasFile(req.file)) {
    const ext = extOf(req.file.originalname);
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'jfif'].includes(ext))
      return fail(res, 'Invalid image format.');
    if (req.file.size > 2 * 1024 * 1024) return fail(res, 'Image too large. Max size is 2MB.');
    update.profile_photo = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString('base64')}`;
  }

  try {
    await modelForRole(req.role).updateOne({ _id: req.uid }, { $set: update }, { runValidators: true });
  } catch (err) {
    return fail(res, err.message);
  }
  ok(res, { message: 'Profile updated successfully.' });
};

// ============================================
// UPDATE SETTINGS (email, phone, address)   PUT /api/user/settings
// ============================================
exports.updateSettings = async (req, res) => {
  const b = req.body || {};
  const phone = str(b.phone);
  const address = str(b.home_address);
  const email = lower(b.email);
  const Model = modelForRole(req.role);

  // email uniqueness
  if (email && await Model.findOne({ email, _id: { $ne: req.uid } }).select('_id'))
    return fail(res, 'Email already used by another account.');

  const update = { phone, home_address: address };
  if (email) update.email = email;

  try {
    await Model.updateOne({ _id: req.uid }, { $set: update }, { runValidators: true });
  } catch (err) {
    return fail(res, err.message);
  }
  ok(res, { message: 'Account settings updated.' });
};

// ============================================
// UPDATE PASSWORD   PUT /api/user/password
// ============================================
exports.updatePassword = async (req, res) => {
  const b = req.body || {};
  const current = typeof b.current_password === 'string' ? b.current_password : '';
  const newPwd = typeof b.new_password === 'string' ? b.new_password : '';
  const confirm = typeof b.confirm_password === 'string' ? b.confirm_password : '';

  if (newPwd !== confirm) return fail(res, 'New passwords do not match.');
  if (newPwd.length < 6) return fail(res, 'Password must be at least 6 characters.');

  const user = await modelForRole(req.role).findById(req.uid).select('password');
  if (!user || !(await bcrypt.compare(current, user.password)))
    return fail(res, 'Current password is incorrect.');

  user.password = await bcrypt.hash(newPwd, 10);
  await user.save();
  ok(res, { message: 'Password changed successfully.' });
};

// ============================================
// GET AVAILABLE ROOMS (filtered by gender/role)   GET /api/user/rooms?status=
// ============================================
exports.getRooms = async (req, res) => {
  const status = str(req.query.status);
  await syncAllRooms();

  const person = await modelForRole(req.role).findById(req.uid).select('gender');
  const gender = (person && person.gender) || 'Male';

  let hostel;
  if (req.role === 'Faculty') hostel = gender === 'Female' ? 'FATIMA HOUSE' : 'KHYBER HOUSE';
  else hostel = gender === 'Female' ? 'FATIMA HOUSE' : 'FAQIR IPI HOUSE';

  const filter = { hostel_name: hostel };
  if (status === 'Available') {
    filter.available_spaces = { $gt: 0 };
    filter.status = 'Available';
  }
  const rooms = await Room.find(filter).sort({ room_no: 1 });
  ok(res, { rooms });
};

// ============================================
// APPLY FOR A ROOM   POST /api/user/apply-room
// ============================================
exports.applyRoom = async (req, res) => {
  const room_id = toId((req.body || {}).room_id);
  if (!room_id) return fail(res, 'Please select a room.');

  const booking_duration = str((req.body || {}).booking_duration);
  if (!booking_duration) return fail(res, 'Please select or specify a booking duration.');

  const base = { user_id: req.uid, user_role: req.role, application_type: 'Apply' };

  // Block if already has approved room
  if (await Application.findOne({ ...base, status: 'Approved' }).select('_id'))
    return fail(res, 'You already have an assigned room. Cannot apply for another.');

  // Block if pending application exists
  if (await Application.findOne({ ...base, status: 'Pending' }).select('_id'))
    return fail(res, 'You already have a pending room application.');

  // Check room availability
  const room = await Room.findById(room_id);
  if (!room) return fail(res, 'Room not found.');
  if (room.available_spaces <= 0 || room.status !== 'Available')
    return fail(res, 'This room is not available.');

  try {
    await Application.create({ ...base, room_id, booking_duration, status: 'Pending' });
  } catch (err) {
    return fail(res, 'Application submit failed: ' + err.message);
  }

  // Notify admin via email
  let adminEmailSent = false;
  const admin = await Admin.findOne().select('email');
  if (admin) {
    const info = await modelForRole(req.role).findById(req.uid).select('full_name email phone');
    adminEmailSent = await sendTemplate(admin.email, templates.adminNewApplication({
      userName: (info && info.full_name) || 'Unknown User',
      userEmail: (info && info.email) || 'N/A',
      userPhone: (info && info.phone) || 'N/A',
      role: req.role,
      hostelName: room.hostel_name || 'N/A',
      roomNo: room.room_no || 'N/A',
      duration: booking_duration
    }));
  }

  let msg = 'Application submitted! Waiting for admin approval.';
  msg += adminEmailSent
    ? ' Admin email sent.'
    : ' Admin email was not sent. Please check SMTP/admin email settings.';
  ok(res, { message: msg });
};

// ============================================
// SUBMIT ROOM LEAVE REQUEST   POST /api/user/leave-room
// ============================================
exports.leaveRoom = async (req, res) => {
  const cur = await currentAssignment(req.uid, req.role);
  if (!cur) return fail(res, 'You are not currently assigned to any room.');

  // fee dues must be cleared first
  const dues = await Fee.aggregate([
    { $match: { user_id: cur.user_id, user_role: req.role, status: { $in: ['Unpaid', 'Partial', 'Pending Verification'] } } },
    { $group: { _id: null, c: { $sum: 1 }, total: { $sum: '$amount' } } }
  ]);
  const dueCount = dues[0] ? dues[0].c : 0;
  const dueTotal = dues[0] ? dues[0].total : 0;

  if (dueCount > 0) {
    const dueMessage = `First clear your dues before requesting room leave. Pending fee records: ${dueCount}, total: Rs. ${numberFormat(dueTotal, 2)}.`;

    const info = await modelForRole(req.role).findById(req.uid).select('full_name email');
    if (info && info.email) {
      await sendTemplate(info.email, templates.leaveBlockedDues({
        fullName: info.full_name, dueMessage, dueCount, dueTotal, role: req.role
      }));
    }
    return fail(res, dueMessage);
  }

  // Check if leave request already pending
  if (await Application.findOne({
    user_id: req.uid, user_role: req.role, status: 'Pending', application_type: 'Leave'
  }).select('_id')) return fail(res, 'A leave request is already pending.');

  const room = cur.room_id;
  try {
    await Application.create({
      user_id: req.uid, user_role: req.role, room_id: room._id,
      application_type: 'Leave', status: 'Pending'
    });
  } catch (err) {
    return fail(res, 'Leave request failed: ' + err.message);
  }

  let adminEmailSent = false;
  const admin = await Admin.findOne().select('email');
  const info = await modelForRole(req.role).findById(req.uid).select('full_name email phone');
  if (admin && info) {
    adminEmailSent = await sendTemplate(admin.email, templates.adminLeaveRequest({
      userName: info.full_name || 'Unknown User',
      userEmail: info.email || 'N/A',
      userPhone: info.phone || 'N/A',
      role: req.role,
      hostelName: room.hostel_name || 'N/A',
      roomNo: room.room_no || 'N/A'
    }));
  }

  let msg = 'Leave request submitted. Waiting for admin approval.';
  msg += adminEmailSent
    ? ' Admin email sent.'
    : ' Admin email was not sent. Please check SMTP/admin email settings.';
  ok(res, { message: msg });
};

// ============================================
// FETCH MY PREVIOUS APPLICATIONS   GET /api/user/my-applications
// ============================================
exports.getMyApplications = async (req, res) => {
  const apps = await Application.find({ user_id: req.uid, user_role: req.role })
    .sort({ applied_at: -1 })
    .populate('room_id', 'room_no hostel_name room_image');

  const rows = apps.filter(a => a.room_id).map(a => ({
    id: String(a._id),
    application_type: a.application_type,
    booking_duration: a.booking_duration,
    status: a.status,
    applied_at: a.applied_at,
    remarks: a.remarks,
    room_no: a.room_id.room_no,
    hostel_name: a.room_id.hostel_name,
    room_image: a.room_id.room_image
  }));
  ok(res, { applications: rows });
};

// ============================================
// GET CURRENT ASSIGNED ROOM DETAILS (+ roommates)   GET /api/user/my-room
// ============================================
exports.getMyRoom = async (req, res) => {
  const app = await currentAssignment(req.uid, req.role);
  if (!app) return ok(res, { room: null });

  const r = app.room_id;
  const room = {
    app_id: String(app._id),
    applied_at: app.applied_at,
    room_id: String(r._id),
    room_no: r.room_no,
    hostel_name: r.hostel_name,
    capacity: r.capacity,
    available_spaces: r.available_spaces,
    description: r.description,
    room_image: r.room_image,
    room_status: r.status
  };

  // roommates = everyone else approved in the same room
  const others = await Application.find({
    room_id: r._id, status: 'Approved', application_type: 'Apply',
    $nor: [{ user_id: req.uid, user_role: req.role }]
  });

  const roommates = [];
  for (const rm of others) {
    const isFaculty = rm.user_role === 'Faculty';
    const u = await modelForRole(rm.user_role).findById(rm.user_id)
      .select(`full_name profile_photo ${isFaculty ? 'designation' : 'department'}`);
    if (u) roommates.push({
      full_name: u.full_name,
      profile_photo: u.profile_photo || '',
      department: (isFaculty ? u.designation : u.department) || '',
      role: rm.user_role
    });
  }

  room.roommates = roommates;
  ok(res, { room });
};

// ============================================
// SUBMIT FEE PAYMENT PROOF   POST /api/user/fee-payment
// ============================================
exports.submitFeePayment = async (req, res) => {
  const b = req.body || {};
  const fee_id = toId(b.fee_id);
  const method = str(b.payment_method);
  const trx_id = str(b.transaction_id);

  if (!fee_id || !method || !trx_id)
    return fail(res, 'Please provide payment method and transaction ID.');

  if (!hasFile(req.file))
    return fail(res, 'Please upload a screenshot as proof of payment.');

  const ext = extOf(req.file.originalname);
  if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'pdf'].includes(ext))
    return fail(res, 'Invalid file format.');
  if (req.file.size > 5 * 1024 * 1024)
    return fail(res, 'File too large. Maximum size is 5MB.');

  let path;
  try {
    path = saveUpload(req.file, 'payments', `payment_${fee_id}_${ts()}.${ext}`);
  } catch (e) {
    return fail(res, 'Upload failed.');
  }

  await Fee.updateOne(
    { _id: fee_id, user_id: req.uid, user_role: req.role },
    { $set: { status: 'Pending Verification', payment_method: method, transaction_id: trx_id, payment_proof: path } }
  );

  ok(res, { message: 'Payment submitted successfully! Waiting for admin verification.' });
};

// ============================================
// GET MY FEES   GET /api/user/my-fees
// ============================================
exports.getMyFees = async (req, res) => {
  const fees = await Fee.find({ user_id: req.uid, user_role: req.role });

  // ORDER BY fee_year DESC, month (Jan..Dec) DESC
  fees.sort((a, b) =>
    (b.fee_year - a.fee_year) || (MONTHS.indexOf(b.fee_month) - MONTHS.indexOf(a.fee_month)));

  const total_paid = fees.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0);
  const total_due = fees.filter(f => f.status === 'Unpaid').reduce((s, f) => s + f.amount, 0);
  ok(res, { fees, total_paid, total_due });
};

// ============================================
// SUBMIT COMPLAINT   POST /api/user/complaints
// ============================================
exports.submitComplaint = async (req, res) => {
  const title = str((req.body || {}).title);
  const desc = str((req.body || {}).description);
  if (!title || !desc) return fail(res, 'Title and description are required.');

  await Complaint.create({ user_id: req.uid, user_role: req.role, title, description: desc });

  // notify admin via email
  const admin = await Admin.findOne().select('email');
  if (admin) {
    await sendTemplate(admin.email, templates.adminNewComplaint({ title, description: desc, role: req.role }));
  }

  ok(res, { message: 'Complaint submitted successfully.' });
};

// ============================================
// GET MY COMPLAINTS   GET /api/user/my-complaints
// ============================================
exports.getMyComplaints = async (req, res) => {
  const complaints = await Complaint.find({ user_id: req.uid, user_role: req.role }).sort({ submitted_at: -1 });
  ok(res, { complaints });
};

// ============================================
// GET NOTICES (for logged-in user)   GET /api/user/notices
// ============================================
exports.getNotices = async (req, res) => {
  const audience = req.role === 'Faculty' ? 'Faculty' : 'Students';
  const notices = await Notice.find({
    status: 'Active',
    target_audience: { $in: ['All', audience] },
    $or: [{ expiry_date: null }, { expiry_date: { $gte: todayStr() } }]
  }).sort({ created_at: -1 }).limit(10);
  ok(res, { notices });
};

// ============================================
// UPLOAD GALLERY PHOTO   POST /api/user/gallery
// ============================================
exports.uploadGallery = async (req, res) => {
  if (!hasFile(req.file)) return fail(res, 'Please select a photo.');

  const caption = str((req.body || {}).caption);
  const ext = extOf(req.file.originalname);
  if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'jfif', 'heic', 'avif'].includes(ext))
    return fail(res, 'Invalid image format. Use JPG, PNG, GIF, WEBP, or BMP.');
  if (req.file.size > 5 * 1024 * 1024)
    return fail(res, 'File too large. Maximum size is 5MB.');

  let path;
  try {
    path = saveUpload(req.file, 'gallery', `gallery_${req.role.toLowerCase()}_${req.uid}_${ts()}.${ext}`);
  } catch (e) {
    return fail(res, 'Upload failed. Check directory permissions.');
  }

  await Gallery.create({
    uploaded_by_id: req.uid, uploaded_by_role: req.role, image_path: path, caption, status: 'Pending'
  });
  ok(res, { message: 'Photo uploaded successfully! Waiting for admin approval.' });
};

// ============================================
// GET MY GALLERY   GET /api/user/my-gallery
// ============================================
exports.getMyGallery = async (req, res) => {
  const gallery = await Gallery.find({ uploaded_by_id: req.uid, uploaded_by_role: req.role })
    .select('image_path caption status uploaded_at')
    .sort({ uploaded_at: -1 });
  ok(res, { gallery });
};

// ============================================
// GET ID CARD DATA   GET /api/user/id-card-data
// ============================================
exports.getIdCardData = async (req, res) => {
  const user = await modelForRole(req.role).findById(req.uid);
  if (!user) return fail(res, 'Profile not found.');

  const app = await currentAssignment(req.uid, req.role);

  const profile = user.toJSON();
  profile.room_no = app ? app.room_id.room_no : 'Not Assigned';
  profile.hostel_name = app ? app.room_id.hostel_name : 'Not Assigned';
  profile.booking_duration = (app && app.booking_duration) || '\u2014';
  profile.role = req.role;

  ok(res, { profile, user: profile });
};

// ============================================
// GET DASHBOARD STATS   GET /api/user/stats
// ============================================
exports.getStats = async (req, res) => {
  const app = await currentAssignment(req.uid, req.role);
  const room = app ? app.room_id : null;

  const sum = async status => {
    const r = await Fee.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(req.uid), user_role: req.role, status } },
      { $group: { _id: null, t: { $sum: '$amount' } } }
    ]);
    return r[0] ? r[0].t : 0;
  };
  const feesPaid = await sum('Paid');
  const feesUnpaid = await sum('Unpaid');

  const roommates = [];
  if (room) {
    const others = await Application.find({
      room_id: room._id, status: 'Approved', application_type: 'Apply',
      $nor: [{ user_id: req.uid, user_role: req.role }]
    });
    for (const rm of others) {
      const u = await modelForRole(rm.user_role).findById(rm.user_id).select('full_name profile_photo');
      if (u) roommates.push({ full_name: u.full_name, profile_photo: u.profile_photo || '' });
    }
  }

  ok(res, {
    room_no: room ? room.room_no : null,
    hostel_name: room ? room.hostel_name : null,
    description: room ? room.description : null,
    room_image: room ? room.room_image : null,
    roommates,
    fees_paid: numberFormat(feesPaid, 0),
    fees_due: numberFormat(feesUnpaid, 0)
  });
};

// ============================================
// DOWNLOAD RECEIPT DATA   GET /api/user/receipt/:id
// ============================================
exports.downloadReceipt = async (req, res) => {
  const fid = toId(req.params.id);
  const fee = fid && await Fee.findOne({ _id: fid, user_id: req.uid, user_role: req.role, status: 'Paid' });
  if (!fee) return fail(res, 'Receipt not found.');

  const person = await modelForRole(req.role).findById(req.uid).select('full_name');
  ok(res, { receipt: fee, name: (person && person.full_name) || '' });
};
