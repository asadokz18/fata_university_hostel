// /api/admin  (replaces api/admin.php - Admin role required)
const router = require('express').Router();
const c = require('../controllers/adminController');
const upload = require('../middleware/upload');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler: h } = require('../utils/helper');

router.use(requireAdmin);

router.get('/stats', h(c.getStats));
router.get('/recent-students', h(c.getRecentStudents));
router.get('/recent-applications', h(c.getRecentApplications));

router.get('/users', h(c.getUsers));
router.delete('/users/:role/:id', h(c.deleteUser));

router.get('/rooms', h(c.getRoomsAdmin));
router.post('/rooms', upload.single('room_image'), h(c.createRoom));
router.put('/rooms/:id', upload.single('room_image'), h(c.updateRoom));
router.delete('/rooms/:id', h(c.deleteRoom));

router.get('/applications', h(c.getApplications));
router.put('/applications/:id', h(c.updateApplication));
router.delete('/applications/:id', h(c.deleteApplication));

router.get('/fees', h(c.getFees));
router.get('/fee-users', h(c.getFeeUsers));
router.post('/fees', h(c.saveFee));
router.post('/fees/report', h(c.sendUserFeeReport)); // keep before /fees/:id routes
router.post('/fees/:id/reminder', h(c.sendFeeReminder));
router.put('/fees/:id', h(c.updateFee));

router.get('/complaints', h(c.getComplaints));
router.put('/complaints/:id', h(c.resolveComplaint));

router.get('/notices', h(c.getNoticesAdmin));
router.post('/notices', h(c.postNotice));
router.delete('/notices/:id', h(c.deleteNotice));

router.get('/gallery', h(c.getGalleryAdmin));
router.post('/gallery', upload.single('photo'), h(c.uploadGallery));
router.put('/gallery/:id', h(c.updateGallery));
router.delete('/gallery/:id', h(c.deleteGallery));

router.put('/profile', upload.single('profile_photo'), h(c.updateProfile));
router.get('/info', h(c.getAdminInfo));

module.exports = router;
