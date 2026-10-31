// ============================================
// FATA University Hostel - Authentication Controller
// (replaces api/auth.php)
// Handles: login, register, logout, session check, password reset
// ============================================
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const PasswordReset = require('../models/PasswordReset');

const { sendHostelEmail } = require('../library/mailer');
const templates = require('../library/emailTemplates');
const { setAuthCookie, clearAuthCookie, signToken } = require('../middleware/auth');
const {
  CI, str, lower, todayStr, extOf, hasFile, saveUpload, parseDevice, dashboardPath, modelForRole
} = require('../utils/helper');

const PHOTO_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'jfif'];

const fail = (res, message, status = 200) => res.status(status).json({ success: false, message });

const sendTemplate = (to, tpl) => sendHostelEmail(to, tpl.subject, tpl.html);

// Handles the optional profile_photo upload shared by both register endpoints
// returns { error } or { path }
function storeProfilePhoto(file, prefix) {
  if (!hasFile(file)) return { path: '' };
  if (!PHOTO_EXT.includes(extOf(file.originalname))) return { error: 'Invalid photo format.' };
  const filename = `${prefix}_${Math.floor(Date.now() / 1000)}_${Math.floor(1000 + Math.random() * 9000)}.${extOf(file.originalname)}`;
  return { path: saveUpload(file, 'profile', filename) };
}

// ============================================
// NEW STUDENT ENROLLMENT   POST /api/auth/student-register
// ============================================
exports.studentRegister = async (req, res) => {
  const b = req.body || {};
  const full_name = str(b.full_name);
  const father_name = str(b.father_name);
  const email = lower(b.email);
  const phone = str(b.phone);
  const gender = str(b.gender);
  const cnic = str(b.cnic);
  const dob = str(b.dob);
  const department = str(b.department);
  const semester = str(b.semester);
  const registration_no = str(b.registration_no);
  const home_address = str(b.home_address);
  const password = typeof b.password === 'string' ? b.password : '';

  if (!full_name || !email || !password || !cnic || !registration_no || !gender || !semester)
    return fail(res, 'All required fields must be filled.');
  if (password.length < 6)
    return fail(res, 'Password must be at least 6 characters.');

  if (await Student.findOne({ email }).select('_id'))
    return fail(res, 'Email already registered.');
  if (await Student.findOne({ cnic }).collation(CI).select('_id'))
    return fail(res, 'CNIC already registered.');
  if (await Student.findOne({ registration_no }).collation(CI).select('_id'))
    return fail(res, 'Registration number already exists.');

  const photo = storeProfilePhoto(req.file, 'student');
  if (photo.error) return fail(res, photo.error);

  try {
    await Student.create({
      full_name, father_name, email, phone, gender, cnic, dob, department, semester,
      registration_no, home_address,
      profile_photo: photo.path,
      password: await bcrypt.hash(password, 10),
      joining_date: todayStr(),
      status: 'Active'
    });
  } catch (err) {
    return fail(res, 'Registration failed: ' + err.message);
  }

  await sendTemplate(email, templates.welcome({ name: full_name, role: 'Student' }));
  res.json({ success: true, message: 'Student registration successful! Please login.' });
};

// ============================================
// NEW FACULTY ENROLLMENT   POST /api/auth/faculty-register
// ============================================
exports.facultyRegister = async (req, res) => {
  const b = req.body || {};
  const full_name = str(b.full_name);
  const father_name = str(b.father_name);
  const email = lower(b.email);
  const phone = str(b.phone);
  const gender = str(b.gender);
  const cnic = str(b.cnic);
  const dob = str(b.dob);
  const designation = str(b.designation);
  const department = str(b.department);
  const employee_id = str(b.employee_id);
  const qualification = str(b.qualification);
  const home_address = str(b.home_address);
  const password = typeof b.password === 'string' ? b.password : '';

  if (!full_name || !email || !password || !employee_id || !gender)
    return fail(res, 'All required fields must be filled.');
  if (password.length < 6)
    return fail(res, 'Password must be at least 6 characters.');

  if (await Faculty.findOne({ email }).select('_id'))
    return fail(res, 'Email already registered.');
  if (await Faculty.findOne({ employee_id }).collation(CI).select('_id'))
    return fail(res, 'Employee ID already registered.');

  const photo = storeProfilePhoto(req.file, 'faculty');
  if (photo.error) return fail(res, photo.error);

  try {
    await Faculty.create({
      full_name, father_name, email, phone, gender, cnic, dob, designation, department,
      employee_id, qualification, home_address,
      profile_photo: photo.path,
      password: await bcrypt.hash(password, 10),
      joining_date: todayStr(),
      status: 'Active'
    });
  } catch (err) {
    return fail(res, 'Registration failed: ' + err.message);
  }

  await sendTemplate(email, templates.welcome({ name: full_name, role: 'Faculty' }));
  res.json({ success: true, message: 'Faculty registration successful! Please login.' });
};

// ============================================
// USER AUTHENTICATION (Login)   POST /api/auth/login
// Admin -> Student -> Faculty are tried in that order (like the PHP version)
// ============================================
exports.login = async (req, res) => {
  const identifier = lower((req.body || {}).email);
  const password = typeof (req.body || {}).password === 'string' ? req.body.password : '';

  if (!identifier || !password)
    return fail(res, 'Email and password are required.');

  const notify = (user, role) => {
    const ip = (req.ip || '').replace(/^::ffff:/, '') || 'Unknown';
    return sendTemplate(user.email, templates.loginNotification({
      email: user.email,
      name: user.full_name,
      role,
      ip,
      device: parseDevice(req.headers['user-agent'] || '')
    }));
  };

  // Check Admin (email OR username)
  const admin = await Admin.findOne({ $or: [{ email: identifier }, { username: identifier }] });
  if (admin && await bcrypt.compare(password, admin.password)) {
    const token = signToken(admin._id, 'Admin');
    setAuthCookie(res, admin._id, 'Admin');
    notify(admin, 'Admin').catch(() => {});
    return res.json({ success: true, token, role: 'Admin', redirect: dashboardPath('Admin'), message: 'Welcome back, Admin!' });
  }

  // Check Student
  const student = await Student.findOne({ email: identifier, status: 'Active' });
  if (student && await bcrypt.compare(password, student.password)) {
    const token = signToken(student._id, 'Student');
    setAuthCookie(res, student._id, 'Student');
    notify(student, 'Student').catch(() => {});
    return res.json({ success: true, token, role: 'Student', redirect: dashboardPath('Student'), message: 'Welcome back!' });
  }

  // Check Faculty
  const faculty = await Faculty.findOne({ email: identifier, status: 'Active' });
  if (faculty && await bcrypt.compare(password, faculty.password)) {
    const token = signToken(faculty._id, 'Faculty');
    setAuthCookie(res, faculty._id, 'Faculty');
    notify(faculty, 'Faculty').catch(() => {});
    return res.json({ success: true, token, role: 'Faculty', redirect: dashboardPath('Faculty'), message: 'Welcome back!' });
  }

  fail(res, 'Invalid email or password. Please try again.');
};

// ============================================
// VALIDATE ACTIVE SESSION   GET /api/auth/check-session
// ============================================
exports.checkSession = async (req, res) => {
  const a = req.auth;
  if (!a) return res.json({ success: true, logged_in: false });

  const Model = a.role === 'Admin' ? Admin : modelForRole(a.role);
  const user = await Model.findById(a.id).select('full_name email profile_photo');
  if (!user) return res.json({ success: true, logged_in: false });

  res.json({
    success: true,
    logged_in: true,
    user_id: String(user._id),
    user_role: a.role,
    user_name: user.full_name,
    user_email: user.email || '',
    user_photo: user.profile_photo || ''
  });
};

// ============================================
// LOGOUT   POST /api/auth/logout
// ============================================
exports.logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, redirect: '/login' });
};

// ============================================
// INITIATE PASSWORD RECOVERY - sends 6-digit OTP   POST /api/auth/forgot-password
// ============================================
exports.forgotPassword = async (req, res) => {
  const email = lower((req.body || {}).email);
  const role = str((req.body || {}).role) === 'Faculty' ? 'Faculty' : 'Student';

  if (!email) return fail(res, 'Please enter your email address.');

  const user = await modelForRole(role).findOne({ email }).select('full_name');
  if (!user) return fail(res, 'No account found with this email address.');

  await PasswordReset.deleteMany({ email, user_role: role });

  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await PasswordReset.create({
    email,
    user_role: role,
    token: otp,
    expiry: new Date(Date.now() + 15 * 60 * 1000),
    used: 0
  });

  await sendTemplate(email, templates.forgotPasswordOtp({ name: user.full_name, otp }));

  res.json({
    success: true,
    message: 'A 6-digit OTP has been sent to your email address. It expires in 15 minutes.'
  });
};

// ============================================
// FINALIZE PASSWORD RECOVERY - verify OTP   POST /api/auth/reset-password
// ============================================
exports.resetPassword = async (req, res) => {
  const otp = str((req.body || {}).token);
  const password = typeof (req.body || {}).password === 'string' ? req.body.password : '';

  if (!otp || !password) return fail(res, 'OTP and new password are required.');
  if (!/^\d{6}$/.test(otp)) return fail(res, 'Please enter a valid 6-digit OTP.');
  if (password.length < 6) return fail(res, 'Password must be at least 6 characters.');

  const reset = await PasswordReset.findOne({ token: otp, used: 0, expiry: { $gt: new Date() } });
  if (!reset) return fail(res, 'Invalid or expired OTP. Please request a new one.');

  await modelForRole(reset.user_role).updateOne(
    { email: reset.email },
    { $set: { password: await bcrypt.hash(password, 10) } }
  );
  await PasswordReset.updateMany({ token: otp }, { $set: { used: 1 } });

  res.json({ success: true, message: 'Password reset successfully! You can now login.' });
};

// ============================================
// UPDATE PASSWORD (logged-in user, any role)   POST /api/auth/update-password
// ============================================
exports.updatePassword = async (req, res) => {
  const b = req.body || {};
  const current = typeof b.current_password === 'string' ? b.current_password : '';
  const newPwd = typeof b.new_password === 'string' ? b.new_password : '';
  const confirm = typeof b.confirm_password === 'string' ? b.confirm_password : '';

  const { id, role } = req.auth;
  const Model = role === 'Admin' ? Admin : modelForRole(role);

  if (newPwd !== confirm) return fail(res, 'New passwords do not match.');
  if (newPwd.length < 6) return fail(res, 'Password must be at least 6 characters.');

  const user = await Model.findById(id).select('password');
  if (!user || !(await bcrypt.compare(current, user.password)))
    return fail(res, 'Current password is incorrect.');

  user.password = await bcrypt.hash(newPwd, 10);
  await user.save();
  res.json({ success: true, message: 'Password updated successfully.' });
};
