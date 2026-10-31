// ============================================
// Multipart handling (replaces PHP $_FILES)
// Files are kept in memory; each controller validates the type/size with the
// same rules and messages as the PHP code, then writes it with saveUpload()
// ============================================
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // hard ceiling; controllers enforce the 5MB rules
});

module.exports = upload;
