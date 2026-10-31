// /api/public  (replaces api/public.php - no login needed)
const router = require('express').Router();
const c = require('../controllers/publicController');
const { asyncHandler: h } = require('../utils/helper');

router.get('/rooms', h(c.getRooms));
router.get('/rooms/all', h(c.getRoomsAll));
router.get('/notices', h(c.getNotices));
router.get('/gallery', h(c.getGallery));
router.post('/contact', h(c.contact));

module.exports = router;
