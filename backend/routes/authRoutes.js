// /api/auth  (replaces api/auth.php)
const router = require('express').Router();
const c = require('../controllers/authController');
const upload = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler: h } = require('../utils/helper');

router.post('/student-register', upload.single('profile_photo'), h(c.studentRegister));
router.post('/faculty-register', upload.single('profile_photo'), h(c.facultyRegister));
router.post('/login', h(c.login));
router.get('/check-session', h(c.checkSession));
router.post('/logout', c.logout);
router.post('/forgot-password', h(c.forgotPassword));
router.post('/reset-password', h(c.resetPassword));
router.post('/update-password', requireAuth, h(c.updatePassword));

module.exports = router;
