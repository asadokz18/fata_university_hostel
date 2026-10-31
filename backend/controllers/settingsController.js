// ============================================
// FATA University Hostel - SMTP Settings Controller
// (replaces api/settings.php - admin only)
// ============================================
const Setting = require('../models/Setting');
const { str } = require('../utils/helper');

const SMTP_KEYS = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass'];

// GET /api/settings/smtp
exports.getSmtp = async (req, res) => {
  const rows = await Setting.find({ setting_key: { $in: SMTP_KEYS } });
  const settings = {};
  rows.forEach(r => { settings[r.setting_key] = r.setting_value; });

  // defaults if not set
  if (settings.smtp_host === undefined) settings.smtp_host = 'smtp.gmail.com';
  if (settings.smtp_port === undefined) settings.smtp_port = '587';
  if (settings.smtp_user === undefined) settings.smtp_user = '';
  if (settings.smtp_pass === undefined) settings.smtp_pass = '';

  res.json({ success: true, settings });
};

// POST /api/settings/smtp
exports.saveSmtp = async (req, res) => {
  const b = req.body || {};
  const values = {
    smtp_host: str(b.smtp_host),
    smtp_port: str(b.smtp_port),
    smtp_user: str(b.smtp_user),
    smtp_pass: str(b.smtp_pass)
  };

  try {
    for (const key of SMTP_KEYS) {
      await Setting.updateOne(
        { setting_key: key },
        { $set: { setting_value: values[key] } },
        { upsert: true }
      );
    }
    res.json({ success: true, message: 'SMTP Settings saved successfully!' });
  } catch (e) {
    res.json({ success: false, message: 'Failed to save settings.' });
  }
};
