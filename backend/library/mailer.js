// ============================================
// Hostel Email Sender Configuration
// (replaces api/mailer.php + the bundled PHPMailer library -> Nodemailer)
// ============================================
const nodemailer = require('nodemailer');
const Setting = require('../models/Setting');

// Same defaults as mailer.php
const SMTP_DEFAULTS = {
  smtp_host: 'smtp.gmail.com',
  smtp_port: '587',
  smtp_user: 'asadokz18@gmail.com',
  smtp_pass: ''
};

// Reads saved SMTP settings (admin dashboard -> SMTP Configuration)
async function getSmtpConfig() {
  const config = { ...SMTP_DEFAULTS };
  try {
    const rows = await Setting.find({ setting_key: { $in: Object.keys(SMTP_DEFAULTS) } });
    for (const row of rows) {
      if (row.setting_value) config[row.setting_key] = row.setting_value;
    }
  } catch (e) {
    console.error('Could not read SMTP settings:', e.message);
  }
  return config;
}

/**
 * Sends an HTML email using the saved SMTP settings.
 * Returns true when the mail was accepted by the SMTP server, false otherwise
 * (never throws - callers report "Email was not sent" like the PHP version did).
 */
async function sendHostelEmail(to, subject, message) {
  const cfg = await getSmtpConfig();
  const port = parseInt(cfg.smtp_port, 10) || 587;

  const transporter = nodemailer.createTransport({
    host: cfg.smtp_host,
    port,
    secure: port === 465,        // 465 = implicit TLS, otherwise STARTTLS (PHPMailer: ENCRYPTION_STARTTLS)
    requireTLS: port !== 465,
    auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000
  });

  try {
    await transporter.sendMail({
      from: { name: 'Hostel Admin', address: cfg.smtp_user },
      to,
      subject,
      html: message
    });
    return true;
  } catch (err) {
    console.error(`Hostel email failed for ${to}. Mailer Error: ${err.message}`);
    return false;
  }
}

module.exports = { sendHostelEmail, getSmtpConfig, SMTP_DEFAULTS };
