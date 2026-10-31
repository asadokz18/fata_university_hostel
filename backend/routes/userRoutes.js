// /api/user  (replaces api/user.php - Student / Faculty only)
const router = require('express').Router();
const c = require('../controllers/userController');
const upload = require('../middleware/upload');
const { requireUser } = require('../middleware/auth');
const { asyncHandler: h } = require('../utils/helper');

router.use(requireUser);

router.get('/profile', h(c.getProfile));
router.put('/profile', upload.single('profile_photo'), h(c.updateProfile));
router.put('/settings', h(c.updateSettings));
router.put('/password', h(c.updatePassword));

router.get('/rooms', h(c.getRooms));
router.post('/apply-room', h(c.applyRoom));
router.post('/leave-room', h(c.leaveRoom));
router.get('/my-applications', h(c.getMyApplications));
router.get('/my-room', h(c.getMyRoom));

router.post('/fee-payment', upload.single('payment_proof'), h(c.submitFeePayment));
router.get('/my-fees', h(c.getMyFees));
router.get('/receipt/:id', h(c.downloadReceipt));

router.post('/complaints', h(c.submitComplaint));
router.get('/my-complaints', h(c.getMyComplaints));

router.get('/notices', h(c.getNotices));

router.post('/gallery', upload.single('photo'), h(c.uploadGallery));
router.get('/my-gallery', h(c.getMyGallery));

router.get('/id-card-data', h(c.getIdCardData));
router.get('/stats', h(c.getStats));

module.exports = router;
