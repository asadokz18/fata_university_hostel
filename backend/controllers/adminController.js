// ============================================
// FATA University Hostel - Admin Controller
// (replaces api/admin.php - every route here requires the Admin role)
// ============================================
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Room = require('../models/Room');
const Application = require('../models/Application');
const Fee = require('../models/Fee');
const Complaint = require('../models/Complaint');
const Notice = require('../models/Notice');
const Gallery = require('../models/Gallery');

const { sendHostelEmail } = require('../library/mailer');
const templates = require('../library/emailTemplates');
const {
  str, lower, int, float, toId, ucfirst, modelForRole, todayStr, numberFormat, generateReceiptNo,
  extOf, hasFile, saveUpload, deleteUpload, syncRoomAvailability, syncAllRooms
} = require('../utils/helper');

const ok = (res, data = {}) => res.json({ success: true, ...data });
const fail = (res, message, status = 200) => res.status(status).json({ success: false, message });
const sendTemplate = (to, tpl) => sendHostelEmail(to, tpl.subject, tpl.html);

// Builds a Map<id, full_name> for a list of {user_id, user_role} records
async function nameMap(records, idField = 'user_id', roleField = 'user_role') {
  const studentIds = [];
  const facultyIds = [];
  records.forEach(r => {
    const id = r[idField];
    if (!id) return;
    (r[roleField] === 'Faculty' ? facultyIds : studentIds).push(id);
  });
  const [students, faculty] = await Promise.all([
    studentIds.length ? Student.find({ _id: { $in: studentIds } }).select('full_name') : [],
    facultyIds.length ? Faculty.find({ _id: { $in: facultyIds } }).select('full_name') : []
  ]);
  const map = new Map();
  students.forEach(u => map.set('Student:' + u._id, u.full_name));
  faculty.forEach(u => map.set('Faculty:' + u._id, u.full_name));
  return (id, role) => map.get(`${role === 'Faculty' ? 'Faculty' : 'Student'}:${id}`);
}

// ============================================
// DASHBOARD STATS   GET /api/admin/stats
// ============================================
exports.getStats = async (req, res) => {
  const [students, faculty, rooms, avail, complaints, feesAgg, pendingApps, notices, pendingFees, pendingGallery] =
    await Promise.all([
      Student.countDocuments(),
      Faculty.countDocuments(),
      Room.countDocuments(),
      Room.countDocuments({ available_spaces: { $gt: 0 }, status: 'Available' }),
      Complaint.countDocuments({ status: 'Pending' }),
      Fee.aggregate([{ $match: { status: 'Paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Application.countDocuments({ status: 'Pending' }),
      Notice.countDocuments({ status: 'Active' }),
      Fee.countDocuments({ status: 'Pending Verification' }),
      Gallery.countDocuments({ status: 'Pending' })
    ]);

  ok(res, {
    students,
    faculty,
    rooms,
    available_rooms: avail,
    complaints,
    fees_collected: numberFormat(feesAgg[0] ? feesAgg[0].total : 0, 2),
    pending_apps: pendingApps,
    active_notices: notices,
    pending_fees: pendingFees,
    pending_gallery: pendingGallery
  });
};

// ============================================
// RECENT STUDENTS   GET /api/admin/recent-students
// ============================================
exports.getRecentStudents = async (req, res) => {
  const students = await Student.find()
    .select('full_name email phone gender department profile_photo created_at')
    .sort({ created_at: -1 })
    .limit(5);
  ok(res, { students });
};

// Application rows joined with room + user name
async function applicationRows(filter, limit) {
  let q = Application.find(filter).sort({ applied_at: -1 }).populate('room_id', 'room_no hostel_name');
  if (limit) q = q.limit(limit);
  const apps = (await q).filter(a => a.room_id); // INNER JOIN rooms
  const nameOf = await nameMap(apps);
  return apps.map(a => {
    const o = a.toJSON();
    const room = a.room_id;
    o.room_id = String(room._id);
    o.room_no = room.room_no;
    o.hostel_name = room.hostel_name;
    o.user_name = nameOf(a.user_id, a.user_role) || 'Unknown';
    return o;
  });
}

// ============================================
// RECENT APPLICATIONS   GET /api/admin/recent-applications
// ============================================
exports.getRecentApplications = async (req, res) => {
  ok(res, { applications: await applicationRows({}, 5) });
};

// ============================================
// GET USERS (students or faculty)   GET /api/admin/users?role=student|faculty
// ============================================
exports.getUsers = async (req, res) => {
  const type = str(req.query.role);
  const Model = type === 'faculty' ? Faculty : Student;
  const users = await Model.find().sort({ created_at: -1 });
  ok(res, { users });
};

// ============================================
// DELETE USER   DELETE /api/admin/users/:role/:id
// ============================================
exports.deleteUser = async (req, res) => {
  const id = toId(req.params.id);
  const role = str(req.params.role) === 'faculty' ? 'faculty' : 'student';
  if (!id) return fail(res, 'Invalid user ID.');

  const roleName = ucfirst(role);
  const Model = role === 'faculty' ? Faculty : Student;

  // if they had an approved room, remember it so it can be recalculated
  const app = await Application.findOne({
    user_id: id, user_role: roleName, status: 'Approved', application_type: 'Apply'
  });

  await Model.deleteOne({ _id: id });
  // also remove their records
  await Application.deleteMany({ user_id: id, user_role: roleName });
  await Fee.deleteMany({ user_id: id, user_role: roleName });
  await Complaint.deleteMany({ user_id: id, user_role: roleName });

  if (app) await syncRoomAvailability(app.room_id);

  ok(res, { message: `${roleName} deleted successfully.` });
};

// ============================================
// GET ROOMS (admin view)   GET /api/admin/rooms?hostel=
// ============================================
exports.getRoomsAdmin = async (req, res) => {
  const hostel = str(req.query.hostel);
  await syncAllRooms();
  const filter = hostel ? { hostel_name: hostel } : {};
  const rooms = await Room.find(filter).sort({ hostel_name: 1, room_no: 1 });
  ok(res, { rooms });
};

// Validates + stores the optional room image. Returns { error } or { path }
function storeRoomImage(file) {
  if (!hasFile(file)) return { path: null };
  const ext = extOf(file.originalname);
  if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return { error: 'Invalid image format.' };
  return { path: saveUpload(file, 'rooms', `room_${Math.floor(Date.now() / 1000)}.${ext}`) };
}

// ============================================
// ADD ROOM   POST /api/admin/rooms
// ============================================
exports.createRoom = async (req, res) => {
  const b = req.body || {};
  const hostel = str(b.hostel_name);
  const room_no = str(b.room_no);
  const capacity = int(b.capacity, 2);
  const description = str(b.description);

  if (!hostel || !room_no || !capacity)
    return fail(res, 'Hostel, Room No and Capacity are required.');

  const img = storeRoomImage(req.file);
  if (img.error) return fail(res, img.error);
  const room_image = img.path || str(b.existing_image) || '';

  if (await Room.findOne({ hostel_name: hostel, room_no }).select('_id'))
    return fail(res, `Room ${room_no} already exists in ${hostel}.`);

  try {
    await Room.create({
      hostel_name: hostel, room_no, capacity, available_spaces: capacity, description, room_image
    });
  } catch (err) {
    return fail(res, err.message);
  }
  ok(res, { message: 'Room added successfully.' });
};

// ============================================
// EDIT ROOM   PUT /api/admin/rooms/:id
// ============================================
exports.updateRoom = async (req, res) => {
  const id = toId(req.params.id);
  const b = req.body || {};
  const hostel = str(b.hostel_name);
  const room_no = str(b.room_no);
  const capacity = int(b.capacity, 2);
  const description = str(b.description);

  if (!id) return fail(res, 'Invalid room ID.');
  if (!hostel || !room_no || !capacity)
    return fail(res, 'Hostel, Room No and Capacity are required.');

  const img = storeRoomImage(req.file);
  if (img.error) return fail(res, img.error);
  const room_image = img.path || str(b.existing_image);

  const update = { hostel_name: hostel, room_no, capacity, description };
  if (room_image) update.room_image = room_image;

  try {
    await Room.updateOne({ _id: id }, { $set: update }, { runValidators: true });
  } catch (err) {
    if (err.code === 11000) return fail(res, `Room ${room_no} already exists in ${hostel}.`);
    return fail(res, err.message);
  }

  // sync availability based on new capacity
  await syncRoomAvailability(id);
  ok(res, { message: 'Room updated successfully.' });
};

// ============================================
// DELETE ROOM   DELETE /api/admin/rooms/:id
// ============================================
exports.deleteRoom = async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return fail(res, 'Invalid room ID.');

  const room = await Room.findById(id);
  if (room && room.room_image) deleteUpload(room.room_image);

  await Application.deleteMany({ room_id: id });
  await Room.deleteOne({ _id: id });
  ok(res, { message: 'Room deleted successfully.' });
};

// ============================================
// GET APPLICATIONS   GET /api/admin/applications?status=
// ============================================
exports.getApplications = async (req, res) => {
  const status = str(req.query.status);
  const apps = await applicationRows(status ? { status } : {});
  ok(res, { applications: apps });
};

// ============================================
// UPDATE APPLICATION (Approve / Reject)   PUT /api/admin/applications/:id
// ============================================
exports.updateApplication = async (req, res) => {
  const id = toId(req.params.id);
  const status = str((req.body || {}).status);
  const remarks = str((req.body || {}).remarks);

  if (!id) return fail(res, 'Invalid application ID.');
  if (!['Approved', 'Rejected'].includes(status)) return fail(res, 'Invalid status.');

  const app = await Application.findById(id);
  if (!app) return fail(res, 'Application not found.');
  if (app.status === status) return ok(res, { message: `Application is already ${status}.` });

  const previousStatus = app.status;
  app.status = status;
  app.remarks = remarks;
  await app.save();

  if (status === 'Approved' || (previousStatus === 'Approved' && status === 'Rejected'))
    await syncRoomAvailability(app.room_id);

  // notify the user
  let emailSent = false;
  const user = await modelForRole(app.user_role).findById(app.user_id).select('email full_name');
  const room = await Room.findById(app.room_id).select('room_no hostel_name');

  if (user && user.email) {
    emailSent = await sendTemplate(user.email, templates.applicationUpdate({
      fullName: user.full_name,
      applicationType: app.application_type,
      status,
      hostelName: room && room.hostel_name,
      roomNo: room && room.room_no,
      duration: app.booking_duration,
      remarks,
      role: app.user_role
    }));
  }

  // an approved Leave request frees the user's current room
  if (status === 'Approved' && app.application_type === 'Leave') {
    await Application.updateMany(
      { user_id: app.user_id, user_role: app.user_role, status: 'Approved', application_type: 'Apply' },
      { $set: { status: 'Rejected', remarks: 'Left room' } }
    );
    await syncRoomAvailability(app.room_id);
  }

  let msg = `Application ${status} successfully.`;
  msg += emailSent ? ' Email sent to user.' : ' Email was not sent. Please check SMTP/admin settings.';
  ok(res, { message: msg });
};

// ============================================
// GET FEES   GET /api/admin/fees?role=&status=
// ============================================
exports.getFees = async (req, res) => {
  const role = str(req.query.role);
  const status = str(req.query.status);
  const filter = {};
  if (role) filter.user_role = role;
  if (status) filter.status = status;

  const fees = await Fee.find(filter).sort({ created_at: -1 });
  const nameOf = await nameMap(fees);
  const rows = fees.map(f => {
    const o = f.toJSON();
    o.full_name = f.user_name || nameOf(f.user_id, f.user_role) || null;
    return o;
  });
  ok(res, { fees: rows });
};

// ============================================
// GET FEE USERS (dropdown)   GET /api/admin/fee-users?role=
// ============================================
exports.getFeeUsers = async (req, res) => {
  const role = str(req.query.role) === 'Faculty' ? 'Faculty' : 'Student';
  const users = await modelForRole(role).find().select('full_name').sort({ full_name: 1 });
  ok(res, { users });
};

// ============================================
// SAVE FEE RECORD   POST /api/admin/fees
// ============================================
exports.saveFee = async (req, res) => {
  const b = req.body || {};
  const user_id = toId(b.user_id);
  const role = str(b.user_role) === 'Faculty' ? 'Faculty' : 'Student';
  const month = str(b.fee_month);
  const year = int(b.fee_year, new Date().getFullYear());
  const amount = float(b.amount);
  const status = str(b.status) || 'Unpaid';
  const notes = str(b.notes);

  if (!user_id || !month || !amount)
    return fail(res, 'User, month, and amount are required.');

  const user = await modelForRole(role).findById(user_id).select('full_name');
  if (!user) return fail(res, 'Selected user was not found.');

  const receipt = generateReceiptNo();
  try {
    await Fee.create({
      user_id,
      user_role: role,
      user_name: user.full_name,
      amount,
      fee_month: month,
      fee_year: year,
      status,
      payment_date: status === 'Paid' ? todayStr() : null,
      receipt_no: receipt,
      notes
    });
  } catch (err) {
    return fail(res, err.message);
  }
  ok(res, { message: 'Fee record added.', receipt });
};

// ============================================
// SEND FEE REMINDER EMAIL   POST /api/admin/fees/:id/reminder
// ============================================
exports.sendFeeReminder = async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return fail(res, 'Invalid fee record.');

  const fee = await Fee.findById(id);
  if (!fee) return fail(res, 'Fee record not found.');
  if (fee.status === 'Paid') return fail(res, 'This fee is already paid.');

  const user = await modelForRole(fee.user_role).findById(fee.user_id).select('email full_name');
  if (!user || !user.email) return fail(res, 'User email was not found.');

  const sent = await sendTemplate(user.email, templates.feeReminder({
    fullName: user.full_name,
    feeMonth: fee.fee_month,
    feeYear: fee.fee_year,
    amount: fee.amount,
    status: fee.status,
    notes: fee.notes,
    role: fee.user_role
  }));
  if (!sent) return fail(res, 'Email was not sent. Please check SMTP/admin settings.');

  ok(res, { message: `Fee reminder email sent to ${user.email}.` });
};

// ============================================
// SEND ALL FEE RECORDS REPORT TO USER   POST /api/admin/fees/report
// ============================================
exports.sendUserFeeReport = async (req, res) => {
  const user_id = toId((req.body || {}).user_id);
  const role = str((req.body || {}).user_role);
  if (!user_id || !['Student', 'Faculty'].includes(role)) return fail(res, 'Invalid user.');

  const user = await modelForRole(role).findById(user_id).select('email full_name');
  if (!user || !user.email) return fail(res, 'User email was not found.');

  const fees = await Fee.find({ user_id, user_role: role }).sort({ fee_year: -1, _id: -1 });
  if (!fees.length) return fail(res, 'No fee records found for this user.');

  const sent = await sendTemplate(user.email, templates.feeReport({ fullName: user.full_name, fees, role }));
  if (!sent) return fail(res, 'Email was not sent. Please check SMTP/admin settings.');

  ok(res, { message: `Fee records report sent to ${user.email}.` });
};

// ============================================
// UPDATE FEE STATUS   PUT /api/admin/fees/:id
// ============================================
exports.updateFee = async (req, res) => {
  const id = toId(req.params.id);
  const status = str((req.body || {}).status);
  if (!id) return fail(res, 'Invalid fee record.');

  let emailSent = false;

  if (status === 'Unpaid') {
    // Rejection: remove payment proof if it exists
    const fee = await Fee.findById(id);
    if (fee && fee.payment_proof) deleteUpload(fee.payment_proof);
    await Fee.updateOne({ _id: id }, {
      $set: {
        status: 'Unpaid', payment_method: null, transaction_id: null,
        payment_proof: null, payment_date: null, receipt_no: null
      }
    });
  } else {
    const fee = await Fee.findById(id);
    if (!fee) return fail(res, 'Fee record not found.');

    const wasPaid = fee.status === 'Paid';
    fee.status = status;
    fee.payment_date = status === 'Paid' ? todayStr() : null;
    if (status === 'Paid') fee.receipt_no = generateReceiptNo();
    try {
      await fee.save();
    } catch (err) {
      return fail(res, err.message);
    }

    if (!wasPaid && status === 'Paid') {
      const user = await modelForRole(fee.user_role).findById(fee.user_id).select('email full_name');
      if (user) {
        emailSent = await sendTemplate(user.email, templates.feePaymentConfirmed({
          fullName: user.full_name,
          feeMonth: fee.fee_month,
          feeYear: fee.fee_year,
          amount: fee.amount
        }));
      }
    }
  }

  let msg = 'Fee status updated.';
  if (emailSent) msg += ' An email has been successfully sent to the user.';
  ok(res, { message: msg });
};

// ============================================
// GET COMPLAINTS   GET /api/admin/complaints
// ============================================
exports.getComplaints = async (req, res) => {
  const complaints = await Complaint.find().sort({ submitted_at: -1 });
  const nameOf = await nameMap(complaints);
  const rows = complaints.map(c => {
    const o = c.toJSON();
    o.full_name = nameOf(c.user_id, c.user_role) || null;
    return o;
  });
  ok(res, { complaints: rows });
};

// ============================================
// RESOLVE COMPLAINT   PUT /api/admin/complaints/:id
// ============================================
exports.resolveComplaint = async (req, res) => {
  const id = toId(req.params.id);
  const status = str((req.body || {}).status) || 'Resolved';
  const response = str((req.body || {}).response) || 'Resolved by admin.';
  if (!id) return fail(res, 'Invalid complaint.');

  const comp = await Complaint.findById(id);
  if (!comp) return fail(res, 'Complaint not found.');

  comp.status = status;
  comp.admin_response = response;
  comp.resolved_at = status === 'Resolved' ? new Date() : null;
  try {
    await comp.save();
  } catch (err) {
    return fail(res, err.message);
  }

  let emailSent = false;
  const user = await modelForRole(comp.user_role).findById(comp.user_id).select('email full_name');
  if (user) {
    emailSent = await sendTemplate(user.email, templates.complaintUpdate({
      fullName: user.full_name, title: comp.title, status, response
    }));
  }

  let msg = 'Complaint updated successfully.';
  if (emailSent) msg += ' An email notification was sent to the user.';
  ok(res, { message: msg });
};

// ============================================
// NOTICES
// ============================================
// POST /api/admin/notices
exports.postNotice = async (req, res) => {
  const b = req.body || {};
  const title = str(b.title);
  const message = str(b.message);
  const priority = str(b.priority) || 'Normal';
  const audience = str(b.target_audience) || 'All';
  const expiry = str(b.expiry_date);

  if (!title || !message) return fail(res, 'Title and message are required.');

  try {
    await Notice.create({
      title, message, priority, target_audience: audience,
      expiry_date: expiry || null, created_by: req.adminId, status: 'Active'
    });
  } catch (err) {
    return fail(res, err.message);
  }
  ok(res, { message: 'Notice posted successfully.' });
};

// GET /api/admin/notices
exports.getNoticesAdmin = async (req, res) => {
  ok(res, { notices: await Notice.find().sort({ created_at: -1 }) });
};

// DELETE /api/admin/notices/:id
exports.deleteNotice = async (req, res) => {
  const id = toId(req.params.id);
  if (id) await Notice.deleteOne({ _id: id });
  ok(res, { message: 'Notice deleted.' });
};

// ============================================
// GALLERY
// ============================================
// GET /api/admin/gallery
exports.getGalleryAdmin = async (req, res) => {
  const items = await Gallery.find().sort({ uploaded_at: -1 });
  const nameOf = await nameMap(items, 'uploaded_by_id', 'uploaded_by_role');
  const rows = items.map(g => {
    const o = g.toJSON();
    o.uploaded_by_name = g.uploaded_by_role === 'Admin'
      ? 'Admin'
      : (nameOf(g.uploaded_by_id, g.uploaded_by_role) || 'Admin');
    return o;
  });
  ok(res, { gallery: rows });
};

// POST /api/admin/gallery   (admin upload - auto approved)
exports.uploadGallery = async (req, res) => {
  const file = req.file;
  if (!hasFile(file)) return fail(res, 'Please select an image.');

  const caption = str((req.body || {}).caption);
  const ext = extOf(file.originalname);
  if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'jfif', 'heic', 'avif'].includes(ext))
    return fail(res, 'Invalid image format.');
  if (file.size > 5 * 1024 * 1024) return fail(res, 'File too large. Max 5MB.');

  const path = saveUpload(file, 'gallery', `gallery_admin_${Math.floor(Date.now() / 1000)}.${ext}`);
  await Gallery.create({
    uploaded_by_id: req.adminId,
    uploaded_by_role: 'Admin',
    image_path: path,
    caption,
    status: 'Approved',
    approved_at: new Date()
  });
  ok(res, { message: 'Photo uploaded and approved.' });
};

// PUT /api/admin/gallery/:id   (approve / reject)
exports.updateGallery = async (req, res) => {
  const id = toId(req.params.id);
  const status = str((req.body || {}).status);
  if (!id) return fail(res, 'Invalid photo.');

  try {
    await Gallery.updateOne(
      { _id: id },
      { $set: { status, approved_at: status === 'Approved' ? new Date() : null } },
      { runValidators: true }
    );
  } catch (err) {
    return fail(res, err.message);
  }
  ok(res, { message: `Gallery photo ${status}.` });
};

// DELETE /api/admin/gallery/:id
exports.deleteGallery = async (req, res) => {
  const id = toId(req.params.id);
  if (id) {
    const row = await Gallery.findById(id);
    if (row && row.image_path) deleteUpload(row.image_path);
    await Gallery.deleteOne({ _id: id });
  }
  ok(res, { message: 'Deleted.' });
};

// ============================================
// ADMIN PROFILE
// ============================================
// PUT /api/admin/profile
exports.updateProfile = async (req, res) => {
  const b = req.body || {};
  const full_name = str(b.full_name);
  const email = lower(b.email);
  const username = lower(b.username);

  let photo = '';
  if (hasFile(req.file)) {
    const ext = extOf(req.file.originalname);
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return fail(res, 'Invalid image.');
    if (req.file.size > 2 * 1024 * 1024) return fail(res, 'Image too large. Max size is 2MB.');
    photo = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString('base64')}`;
  }

  const update = { full_name, email, username };
  if (photo) update.profile_photo = photo;

  try {
    await Admin.updateOne({ _id: req.adminId }, { $set: update }, { runValidators: true });
  } catch (err) {
    if (err.code === 11000) return fail(res, 'Username or email is already in use.');
    return fail(res, err.message);
  }
  ok(res, { message: 'Admin profile updated.', profile_photo: photo || undefined });
};

// GET /api/admin/info
exports.getAdminInfo = async (req, res) => {
  const admin = await Admin.findById(req.adminId).select('username full_name email profile_photo');
  ok(res, { admin });
};
