// ============================================
// Central error handling
// ============================================
const multer = require('multer');

function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found.' });
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: 'Upload failed: ' + err.message });
  }
  console.error(err);
  res.status(500).json({ success: false, message: err.message || 'Server error.' });
}

module.exports = { notFound, errorHandler };
