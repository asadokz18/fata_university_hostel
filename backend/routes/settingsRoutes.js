// /api/settings  (replaces api/settings.php - SMTP settings, Admin only)
const router = require('express').Router();
const c = require('../controllers/settingsController');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler: h } = require('../utils/helper');

router.use(requireAdmin);
router.get('/smtp', h(c.getSmtp));
router.post('/smtp', h(c.saveSmtp));

module.exports = router;
