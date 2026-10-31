// ============================================
// Email templates
// Ported 1:1 from the HTML strings that were inline in
// auth.php / admin.php / user.php / public.php
// Each builder returns { subject, html }
// ============================================
const { escapeHtml: e, currentYear, dateTimeLabel, dateLabel, numberFormat, clientUrl } = require('../utils/helper');

const dashboardLink = role =>
  role === 'Faculty' ? `${clientUrl()}/faculty/dashboard` : `${clientUrl()}/student/dashboard`;

// ---------- auth.php ----------

function loginNotification({ email, name, role, ip, device }) {
  const year = currentYear();
  const time = new Date().toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Karachi' });
  const html = `
<div style='font-family:Arial,sans-serif;background:#f1f5f9;padding:24px 8px;'>
<div style='max-width:460px;margin:0 auto;background:#fff;border-radius:10px;border-top:4px solid #6366f1;'>
<div style='padding:20px 24px 0;text-align:center;'>
  <div style='font-size:17px;font-weight:800;color:#1e1b4b;'>FATA University</div>
  <div style='font-size:10px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;'>Hostel Management System</div>
</div>
<div style='padding:18px 24px;'>
  <div style='font-size:14px;font-weight:700;color:#1e293b;margin-bottom:6px;'>New Sign-In Detected</div>
  <p style='font-size:12px;color:#64748b;line-height:1.6;margin:0 0 16px;'>Hello <strong>${e(name)}</strong>, a new login was recorded on your account.</p>
  <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#f8fafc;border-radius:8px;margin-bottom:16px;'>
    <tr><td style='padding:14px 16px;font-size:12px;color:#475569;line-height:2;'>
      <strong>Role:</strong> ${e(role)}<br>
      <strong>Email:</strong> ${e(email)}<br>
      <strong>Time:</strong> ${e(time)}<br>
      <strong>IP:</strong> ${e(ip)}<br>
      <strong>Device:</strong> ${e(device)}
    </td></tr>
  </table>
  <p style='font-size:11px;color:#94a3b8;margin:0;'>If this was not you, secure your account immediately.</p>
</div>
<div style='background:#f8fafc;border-top:1px solid #f1f5f9;padding:12px 24px;text-align:center;'>
  <div style='font-size:10px;color:#94a3b8;'>&copy; ${year} FATA University Hostel. All rights reserved.</div>
</div>
</div></div>`;
  return { subject: 'FATA University Hostel - New Sign-In Detected', html };
}

function welcome({ name, role }) {
  const year = currentYear();
  const html = `
<div style='font-family:Arial,sans-serif;background:#f1f5f9;padding:24px 8px;'>
<div style='max-width:460px;margin:0 auto;background:#fff;border-radius:10px;border-top:4px solid #10b981;'>
<div style='padding:20px 24px 0;text-align:center;'>
  <div style='font-size:17px;font-weight:800;color:#1e1b4b;'>FATA University</div>
  <div style='font-size:10px;color:#10b981;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;'>Hostel Management System</div>
</div>
<div style='padding:18px 24px;'>
  <div style='font-size:14px;font-weight:700;color:#1e293b;margin-bottom:6px;'>Registration Successful!</div>
  <p style='font-size:12px;color:#64748b;line-height:1.6;margin:0 0 14px;'>Hello <strong>${e(name)}</strong>, welcome! Your <strong>${e(role)}</strong> account has been created.</p>
  <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#ecfdf5;border-radius:8px;margin-bottom:16px;'>
    <tr><td style='padding:12px 15px;font-size:12px;color:#047857;line-height:1.8;'>
      &#10003; Log in with your registered email.<br>
      &#10003; Apply for a hostel room from your dashboard.<br>
      &#10003; Track room assignments and fee updates.
    </td></tr>
  </table>
  <div style='text-align:center;'>
    <a href='${clientUrl()}/login'
       style='background:#10b981;color:#fff;padding:10px 22px;font-size:13px;
              font-weight:700;border-radius:6px;text-decoration:none;display:inline-block;'>
      Login to Portal
    </a>
  </div>
</div>
<div style='background:#f8fafc;border-top:1px solid #f1f5f9;padding:12px 24px;text-align:center;'>
  <div style='font-size:10px;color:#94a3b8;'>&copy; ${year} FATA University Hostel. All rights reserved.</div>
</div>
</div></div>`;
  return { subject: 'Welcome to FATA University Hostel System!', html };
}

function forgotPasswordOtp({ name, otp }) {
  const year = currentYear();
  const cells = String(otp).split('').map(d =>
    `<td style='padding:0 4px;'>` +
    `<div style='width:34px;height:42px;line-height:42px;text-align:center;` +
    `font-size:20px;font-weight:800;color:#1e293b;` +
    `background:#fff;border:2px solid #d1d5db;` +
    `border-radius:6px;font-family:monospace;'>${d}</div>` +
    `</td>`
  ).join('');

  const html = `
<div style='font-family:Arial,sans-serif;background:#f1f5f9;padding:24px 8px;'>
<div style='max-width:460px;margin:0 auto;background:#fff;border-radius:10px;border-top:4px solid #ef4444;'>

<div style='padding:20px 24px 0;text-align:center;'>
  <div style='font-size:17px;font-weight:800;color:#1e1b4b;'>FATA University</div>
  <div style='font-size:10px;color:#ef4444;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;'>Hostel Management System</div>
</div>

<div style='padding:18px 24px;'>
  <div style='font-size:14px;font-weight:700;color:#1e293b;margin-bottom:6px;'>Password Reset OTP</div>
  <p style='font-size:12px;color:#64748b;line-height:1.6;margin:0 0 16px;'>
    Hello <strong>${e(name)}</strong> — use the OTP below to reset your password.
    Expires in <strong>15 minutes</strong>.
  </p>

  <table width='100%' cellpadding='0' cellspacing='0' border='0'
         style='background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:16px;'>
    <tr><td style='padding:16px 12px;text-align:center;'>
      <div style='font-size:9px;color:#ef4444;font-weight:700;text-transform:uppercase;
                  letter-spacing:2px;margin-bottom:12px;'>Your One-Time Password</div>

      <table cellpadding='0' cellspacing='0' border='0' style='margin:0 auto;'>
        <tr>${cells}</tr>
      </table>

      <div style='font-size:26px;font-weight:900;letter-spacing:8px;color:#1e293b;
                  font-family:monospace;margin-top:10px;text-indent:8px;'>${otp}</div>

      <div style='font-size:10px;color:#94a3b8;margin-top:8px;'>
        Valid 15 min &nbsp;&middot;&nbsp; Do not share this OTP
      </div>
    </td></tr>
  </table>

  <table width='100%' cellpadding='0' cellspacing='0' border='0'
         style='background:#f8fafc;border-radius:6px;margin-bottom:14px;'>
    <tr><td style='padding:10px 14px;font-size:11px;color:#475569;line-height:1.8;'>
      <strong>Steps:</strong><br>
      1. Return to the Forgot Password page.<br>
      2. Enter the 6-digit OTP.<br>
      3. Set your new password.
    </td></tr>
  </table>

  <p style='font-size:10px;color:#94a3b8;margin:0;'>
    If you did not request this, ignore this email — your password is unchanged.
  </p>
</div>

<div style='background:#f8fafc;border-top:1px solid #f1f5f9;padding:12px 24px;text-align:center;'>
  <div style='font-size:10px;color:#94a3b8;'>&copy; ${year} FATA University Hostel. All rights reserved.</div>
</div>

</div></div>`;
  return { subject: 'FATA University Hostel - Password Reset OTP', html };
}

// ---------- admin.php ----------

function applicationUpdate({ fullName, applicationType, status, hostelName, roomNo, duration, remarks, role }) {
  const statusLabel = status === 'Approved' ? 'Approved' : 'Rejected';
  const typeLabel = applicationType === 'Leave' ? 'Room Leave Request' : 'Room Application';
  const statusColor = status === 'Approved' ? '#326a33' : '#dc3545';
  const link = dashboardLink(role);
  const yearNow = currentYear();

  const html = `
<div style='font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;padding:24px 8px;'>
  <div style='max-width:560px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border-top:4px solid ${statusColor};'>
    <div style='padding:22px 26px;text-align:center;background:#f8fafc;'>
      <div style='font-size:18px;font-weight:800;color:#1e293b;'>FATA University Hostel</div>
      <div style='font-size:12px;color:#64748b;margin-top:4px;'>${typeLabel} Update</div>
    </div>
    <div style='padding:24px 26px;'>
      <p style='font-size:15px;color:#1e293b;font-weight:700;margin:0 0 8px;'>Dear ${e(fullName)},</p>
      <p style='font-size:14px;color:#475569;line-height:1.7;margin:0 0 18px;'>Your ${typeLabel} has been <strong style='color:${statusColor};'>${statusLabel}</strong> by hostel administration.</p>
      <table width='100%' cellpadding='0' cellspacing='0' style='background:#f8fafc;border-left:4px solid ${statusColor};border-radius:0 8px 8px 0;margin-bottom:18px;'>
        <tr><td style='padding:16px 18px;font-size:13px;color:#334155;line-height:1.9;'>
          <strong>Hostel:</strong> ${e(hostelName || 'N/A')}<br>
          <strong>Room:</strong> ${e(roomNo || 'N/A')}<br>
          <strong>Duration:</strong> ${e(duration || 'N/A')}<br>
          <strong>Remarks:</strong> ${e(remarks || 'No remarks.')}
        </td></tr>
      </table>
      <div style='text-align:center;'>
        <a href='${link}' style='background:#326a33;color:#ffffff;padding:11px 22px;border-radius:7px;text-decoration:none;font-size:13px;font-weight:700;display:inline-block;'>Open Dashboard</a>
      </div>
    </div>
    <div style='background:#f8fafc;border-top:1px solid #e2e8f0;padding:12px 26px;text-align:center;font-size:11px;color:#94a3b8;'>&copy; ${yearNow} FATA University Hostel. Automated notification.</div>
  </div>
</div>`;
  return { subject: `${typeLabel} ${statusLabel} - FATA University Hostel`, html };
}

function feeReminder({ fullName, feeMonth, feeYear, amount, status, notes, role }) {
  const amountFmt = 'Rs. ' + numberFormat(amount, 2);
  const monthYear = `${feeMonth} ${feeYear}`;
  const notesTrim = (notes || '').trim();
  const notesHtml = notesTrim
    ? `<tr><td style="padding:5px 0;font-size:13px;color:#777;">Notes</td><td style="padding:5px 0;font-size:13px;color:#1e1e1e;font-weight:600;">${e(notesTrim)}</td></tr>`
    : '';
  const link = dashboardLink(role);
  const yearNow = currentYear();

  const html = `
<div style='margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;'>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#f4f6f8;padding:32px 8px;'><tr><td align='center'>
<table width='600' cellpadding='0' cellspacing='0' border='0' style='max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);'>
  <tr><td style='background:#326a33;padding:30px 36px;text-align:center;'>
    <div style='font-size:11px;color:#d8efd5;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;'>FATA University Hostel Management System</div>
    <div style='font-size:24px;font-weight:800;color:#ffffff;margin-bottom:4px;'>Fee Payment Reminder</div>
    <div style='font-size:13px;color:#d8efd5;'>Please clear your pending hostel fee</div>
  </td></tr>
  <tr><td style='padding:32px 36px;'>
    <p style='font-size:15px;color:#1e4520;font-weight:700;margin:0 0 6px;'>Dear ${e(fullName)},</p>
    <p style='font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;'>This is a reminder from the hostel administration that your fee for <strong>${e(monthYear)}</strong> is still pending. Please submit your payment as soon as possible.</p>
    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#f8fafc;border-left:4px solid #937C3D;border-radius:0 8px 8px 0;margin-bottom:24px;'>
      <tr><td style='padding:18px 20px;'>
        <div style='font-size:11px;color:#937C3D;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;'>Fee Details</div>
        <table width='100%' cellpadding='0' cellspacing='0' border='0'>
          <tr><td style='padding:5px 0;font-size:13px;color:#777;width:140px;'>Period</td><td style='padding:5px 0;font-size:13px;color:#1e1e1e;font-weight:600;'>${e(monthYear)}</td></tr>
          <tr><td style='padding:5px 0;font-size:13px;color:#777;'>Amount Due</td><td style='padding:5px 0;font-size:16px;color:#326a33;font-weight:800;'>${amountFmt}</td></tr>
          <tr><td style='padding:5px 0;font-size:13px;color:#777;'>Current Status</td><td style='padding:5px 0;font-size:13px;color:#b45309;font-weight:700;'>${e(status)}</td></tr>
          ${notesHtml}
        </table>
      </td></tr>
    </table>
    <table width='100%' cellpadding='0' cellspacing='0' border='0'><tr><td align='center'>
      <a href='${link}' style='display:inline-block;background:#326a33;color:#ffffff;font-size:14px;font-weight:700;padding:13px 32px;border-radius:7px;text-decoration:none;'>Open Fee Dashboard</a>
    </td></tr></table>
  </td></tr>
  <tr><td style='background:#f4f9f4;border-top:1px solid #e0ede0;padding:18px 36px;text-align:center;'>
    <p style='font-size:11px;color:#999;margin:0;'>&copy; ${yearNow} FATA University Hostel Management System. Automated notification.</p>
  </td></tr>
</table>
</td></tr></table>
</div>`;
  return { subject: `Fee Payment Reminder - ${feeMonth} ${feeYear}`, html };
}

function feeReport({ fullName, fees, role }) {
  let totalPaid = 0;
  let totalDue = 0;
  let rowsHtml = '';

  fees.forEach((fee, index) => {
    const amount = Number(fee.amount) || 0;
    if (fee.status === 'Paid') totalPaid += amount;
    else totalDue += amount;

    const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
    const cell = 'padding:10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#334155;';
    rowsHtml += `<tr style='background:${bg};'>
                <td style='${cell}'>${e(`${fee.fee_month} ${fee.fee_year}`)}</td>
                <td style='${cell}'>Rs. ${numberFormat(amount, 2)}</td>
                <td style='${cell}'>${e(fee.status)}</td>
                <td style='${cell}'>${e(fee.payment_date || '-')}</td>
                <td style='${cell}'>${e(fee.receipt_no || '-')}</td>
            </tr>`;
  });

  const generatedOn = dateLabel();
  const yearNow = currentYear();
  const link = dashboardLink(role);
  const th = `align='left' style='padding:10px;font-size:11px;color:#475569;text-transform:uppercase;'`;

  const html = `
<div style='margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;'>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#f4f6f8;padding:32px 8px;'><tr><td align='center'>
<table width='680' cellpadding='0' cellspacing='0' border='0' style='max-width:680px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);'>
  <tr><td style='background:#326a33;padding:30px 36px;text-align:center;'>
    <div style='font-size:11px;color:#d8efd5;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;'>FATA University Hostel Management System</div>
    <div style='font-size:24px;font-weight:800;color:#ffffff;margin-bottom:4px;'>Fee Records Report</div>
    <div style='font-size:13px;color:#d8efd5;'>Generated on ${generatedOn}</div>
  </td></tr>
  <tr><td style='padding:28px 30px;'>
    <p style='font-size:15px;color:#1e4520;font-weight:700;margin:0 0 6px;'>Dear ${e(fullName)},</p>
    <p style='font-size:14px;color:#555;line-height:1.7;margin:0 0 20px;'>Hostel administration has sent your complete fee records report. A summary and all available fee entries are listed below.</p>
    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='margin-bottom:20px;'>
      <tr>
        <td style='background:#f0f9f1;padding:14px;border-radius:8px;color:#326a33;font-weight:800;font-size:16px;'>Paid: Rs. ${numberFormat(totalPaid, 2)}</td>
        <td width='12'></td>
        <td style='background:#fff7ed;padding:14px;border-radius:8px;color:#b45309;font-weight:800;font-size:16px;'>Due: Rs. ${numberFormat(totalDue, 2)}</td>
      </tr>
    </table>
    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;border-collapse:separate;border-spacing:0;margin-bottom:22px;'>
      <thead>
        <tr style='background:#f1f5f9;'>
          <th ${th}>Period</th>
          <th ${th}>Amount</th>
          <th ${th}>Status</th>
          <th ${th}>Payment Date</th>
          <th ${th}>Receipt</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <table width='100%' cellpadding='0' cellspacing='0' border='0'><tr><td align='center'>
      <a href='${link}' style='display:inline-block;background:#326a33;color:#ffffff;font-size:14px;font-weight:700;padding:13px 32px;border-radius:7px;text-decoration:none;'>Open Dashboard</a>
    </td></tr></table>
  </td></tr>
  <tr><td style='background:#f4f9f4;border-top:1px solid #e0ede0;padding:18px 36px;text-align:center;'>
    <p style='font-size:11px;color:#999;margin:0;'>&copy; ${yearNow} FATA University Hostel Management System. Automated report.</p>
  </td></tr>
</table>
</td></tr></table>
</div>`;
  return { subject: 'Your Hostel Fee Records Report', html };
}

function feePaymentConfirmed({ fullName, feeMonth, feeYear, amount }) {
  const amountFmt = 'Rs. ' + numberFormat(amount, 2);
  const monthYear = `${feeMonth} ${feeYear}`;
  const yearNow = currentYear();

  const html = `
<div style='margin:0;padding:0;background:#f0f4f0;font-family:Arial,Helvetica,sans-serif;'>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#f0f4f0;padding:32px 8px;'><tr><td align='center'>
<table width='600' cellpadding='0' cellspacing='0' border='0' style='max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(50,106,51,0.10);'>
  <tr><td style='background:linear-gradient(135deg,#1e4520 0%,#326a33 100%);padding:32px 36px;text-align:center;'>
    <div style='font-size:11px;color:#a8d5a2;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;'>FATA University Hostel Management System</div>
    <div style='font-size:28px;margin-bottom:6px;'>&#10003;</div>
    <div style='font-size:22px;font-weight:800;color:#ffffff;margin-bottom:4px;'>Payment Confirmed</div>
    <div style='font-size:13px;color:#c8e6c9;'>Your hostel fee has been verified</div>
  </td></tr>
  <tr><td style='padding:32px 36px;'>
    <p style='font-size:15px;color:#1e4520;font-weight:700;margin:0 0 6px;'>Dear ${e(fullName)},</p>
    <p style='font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;'>Your hostel fee payment for <strong>${e(monthYear)}</strong> has been <strong style='color:#326a33;'>verified and confirmed</strong> by the administration.</p>
    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#f4f9f4;border-left:4px solid #937C3D;border-radius:0 8px 8px 0;margin-bottom:24px;'>
      <tr><td style='padding:18px 20px;'>
        <div style='font-size:11px;color:#937C3D;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;'>Payment Receipt</div>
        <table width='100%' cellpadding='0' cellspacing='0' border='0'>
          <tr><td style='padding:5px 0;font-size:13px;color:#777;width:140px;'>Period</td><td style='padding:5px 0;font-size:13px;color:#1e1e1e;font-weight:600;'>${e(monthYear)}</td></tr>
          <tr><td style='padding:5px 0;font-size:13px;color:#777;'>Amount Paid</td><td style='padding:5px 0;font-size:16px;color:#326a33;font-weight:800;'>${amountFmt}</td></tr>
          <tr><td style='padding:5px 0;font-size:13px;color:#777;'>Status</td><td style='padding:5px 0;font-size:13px;color:#326a33;font-weight:700;'>&#10003; Paid</td></tr>
        </table>
      </td></tr>
    </table>
    <table width='100%' cellpadding='0' cellspacing='0' border='0'><tr><td align='center'>
      <a href='${clientUrl()}/student/dashboard' style='display:inline-block;background:#326a33;color:#ffffff;font-size:14px;font-weight:700;padding:13px 32px;border-radius:7px;text-decoration:none;'>View My Ledger &rarr;</a>
    </td></tr></table>
  </td></tr>
  <tr><td style='background:#f4f9f4;border-top:1px solid #e0ede0;padding:18px 36px;text-align:center;'>
    <p style='font-size:11px;color:#999;margin:0;'>&copy; ${yearNow} FATA University Hostel Management System &mdash; Automated Notification. Do not reply.</p>
  </td></tr>
</table>
</td></tr></table>
</div>`;
  return { subject: `\u2705 Fee Payment Confirmed \u2014 ${monthYear}`, html };
}

function complaintUpdate({ fullName, title, status, response }) {
  const yearNow = currentYear();
  const statusColor = status === 'Resolved' ? '#326a33' : '#e58c0c';
  const statusIcon = status === 'Resolved' ? '&#9989;' : '&#128161;';

  const html = `
<div style='margin:0;padding:0;background:#f0f4f0;font-family:Arial,Helvetica,sans-serif;'>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#f0f4f0;padding:32px 8px;'><tr><td align='center'>
<table width='600' cellpadding='0' cellspacing='0' border='0' style='max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(50,106,51,0.10);'>
  <tr><td style='background:linear-gradient(135deg,#1C2331 0%,#326a33 100%);padding:32px 36px;text-align:center;'>
    <div style='font-size:11px;color:#a8d5a2;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;'>FATA University Hostel Management System</div>
    <div style='font-size:28px;margin-bottom:6px;'>${statusIcon}</div>
    <div style='font-size:22px;font-weight:800;color:#ffffff;margin-bottom:4px;'>Complaint ${e(status)}</div>
    <div style='font-size:13px;color:#c8e6c9;'>Your complaint has been reviewed</div>
  </td></tr>
  <tr><td style='padding:32px 36px;'>
    <p style='font-size:15px;color:#1C2331;font-weight:700;margin:0 0 6px;'>Dear ${e(fullName)},</p>
    <p style='font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;'>Your complaint has been updated to <strong style='color:${statusColor};'>${e(status)}</strong> by the hostel administration.</p>
    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#f8fafc;border-left:4px solid #937C3D;border-radius:0 8px 8px 0;margin-bottom:16px;'>
      <tr><td style='padding:16px 20px;'>
        <div style='font-size:11px;color:#937C3D;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;'>Complaint Title</div>
        <div style='font-size:14px;color:#1C2331;font-weight:600;'>${e(title)}</div>
      </td></tr>
    </table>
    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#f4f9f4;border-left:4px solid ${statusColor};border-radius:0 8px 8px 0;margin-bottom:28px;'>
      <tr><td style='padding:16px 20px;'>
        <div style='font-size:11px;color:${statusColor};font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;'>Admin Response</div>
        <div style='font-size:13px;color:#555;line-height:1.7;white-space:pre-wrap;'>${e(response)}</div>
      </td></tr>
    </table>
    <table width='100%' cellpadding='0' cellspacing='0' border='0'><tr><td align='center'>
      <a href='${clientUrl()}/student/dashboard' style='display:inline-block;background:#326a33;color:#ffffff;font-size:14px;font-weight:700;padding:13px 32px;border-radius:7px;text-decoration:none;'>View My Complaints &rarr;</a>
    </td></tr></table>
  </td></tr>
  <tr><td style='background:#f4f9f4;border-top:1px solid #e0ede0;padding:18px 36px;text-align:center;'>
    <p style='font-size:11px;color:#999;margin:0;'>&copy; ${yearNow} FATA University Hostel Management System &mdash; Automated Notification. Do not reply.</p>
  </td></tr>
</table>
</td></tr></table>
</div>`;
  return { subject: `\uD83D\uDCE2 Complaint Update: ${title}`, html };
}

// ---------- user.php ----------

function adminNewApplication({ userName, userEmail, userPhone, role, hostelName, roomNo, duration }) {
  const yearNow = currentYear();
  const timeNow = dateTimeLabel();

  const html = `
<div style='margin:0;padding:0;background:#f0f4f0;font-family:Arial,Helvetica,sans-serif;'>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#f0f4f0;padding:32px 8px;'><tr><td align='center'>
<table width='600' cellpadding='0' cellspacing='0' border='0' style='max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(50,106,51,0.10);'>

  <!-- HEADER -->
  <tr><td style='background:linear-gradient(135deg,#1e4520 0%,#326a33 100%);padding:32px 36px;text-align:center;'>
    <div style='font-size:11px;color:#a8d5a2;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;'>FATA University Hostel Management System</div>
    <div style='font-size:24px;font-weight:800;color:#ffffff;margin-bottom:4px;'>&#127968; New Room Application</div>
    <div style='font-size:13px;color:#c8e6c9;'>A new application is awaiting your review</div>
  </td></tr>

  <!-- BODY -->
  <tr><td style='padding:32px 36px;'>
    <p style='font-size:15px;color:#1e4520;font-weight:700;margin:0 0 6px;'>Hello, Admin</p>
    <p style='font-size:14px;color:#555;line-height:1.7;margin:0 0 28px;'>A new hostel room application has just been submitted on <strong>${timeNow}</strong> and is pending your approval.</p>

    <!-- Applicant Card -->
    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#f4f9f4;border-left:4px solid #326a33;border-radius:0 8px 8px 0;margin-bottom:20px;'>
      <tr><td style='padding:18px 20px;'>
        <div style='font-size:11px;color:#326a33;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;'>Applicant Details</div>
        <table width='100%' cellpadding='0' cellspacing='0' border='0'>
          <tr><td style='padding:5px 0;font-size:13px;color:#777;width:140px;'>Full Name</td><td style='padding:5px 0;font-size:13px;color:#1e1e1e;font-weight:600;'>${e(userName)}</td></tr>
          <tr><td style='padding:5px 0;font-size:13px;color:#777;'>Role</td><td style='padding:5px 0;font-size:13px;color:#1e1e1e;font-weight:600;'>${e(role)}</td></tr>
          <tr><td style='padding:5px 0;font-size:13px;color:#777;'>Email</td><td style='padding:5px 0;font-size:13px;color:#326a33;font-weight:600;'>${e(userEmail)}</td></tr>
          <tr><td style='padding:5px 0;font-size:13px;color:#777;'>Phone</td><td style='padding:5px 0;font-size:13px;color:#1e1e1e;font-weight:600;'>${e(userPhone)}</td></tr>
        </table>
      </td></tr>
    </table>

    <!-- Room Card -->
    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#f4f9f4;border-left:4px solid #937C3D;border-radius:0 8px 8px 0;margin-bottom:28px;'>
      <tr><td style='padding:18px 20px;'>
        <div style='font-size:11px;color:#937C3D;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;'>Requested Room</div>
        <table width='100%' cellpadding='0' cellspacing='0' border='0'>
          <tr><td style='padding:5px 0;font-size:13px;color:#777;width:140px;'>Hostel Block</td><td style='padding:5px 0;font-size:13px;color:#1e1e1e;font-weight:600;'>${e(hostelName)}</td></tr>
          <tr><td style='padding:5px 0;font-size:13px;color:#777;'>Room Number</td><td style='padding:5px 0;font-size:13px;color:#1e1e1e;font-weight:600;'>${e(roomNo)}</td></tr>
          <tr><td style='padding:5px 0;font-size:13px;color:#777;'>Duration</td><td style='padding:5px 0;font-size:13px;color:#1e1e1e;font-weight:600;'>${e(duration)}</td></tr>
        </table>
      </td></tr>
    </table>

    <!-- CTA -->
    <table width='100%' cellpadding='0' cellspacing='0' border='0'><tr><td align='center'>
      <a href='${clientUrl()}/admin/dashboard' style='display:inline-block;background:#326a33;color:#ffffff;font-size:14px;font-weight:700;padding:13px 32px;border-radius:7px;text-decoration:none;letter-spacing:0.5px;'>Open Admin Dashboard &rarr;</a>
    </td></tr></table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style='background:#f4f9f4;border-top:1px solid #e0ede0;padding:18px 36px;text-align:center;'>
    <p style='font-size:11px;color:#999;margin:0;'>&copy; ${yearNow} FATA University Hostel Management System &mdash; Automated Notification. Do not reply.</p>
  </td></tr>

</table>
</td></tr></table>
</div>`;
  return { subject: `\uD83C\uDFE0 New Room Application \u2014 ${userName}`, html };
}

function leaveBlockedDues({ fullName, dueMessage, dueCount, dueTotal, role }) {
  const yearNow = currentYear();
  const amount = numberFormat(dueTotal, 2);
  const link = dashboardLink(role);

  const html = `
<div style='font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;padding:24px 8px;'>
  <div style='max-width:540px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border-top:4px solid #dc3545;'>
    <div style='padding:22px 26px;text-align:center;background:#f8fafc;'>
      <div style='font-size:18px;font-weight:800;color:#1e293b;'>FATA University Hostel</div>
      <div style='font-size:12px;color:#64748b;margin-top:4px;'>Room Leave Request Blocked</div>
    </div>
    <div style='padding:24px 26px;'>
      <p style='font-size:15px;color:#1e293b;font-weight:700;margin:0 0 8px;'>Dear ${e(fullName)},</p>
      <p style='font-size:14px;color:#475569;line-height:1.7;margin:0 0 18px;'>${e(dueMessage)}</p>
      <table width='100%' cellpadding='0' cellspacing='0' style='background:#fff5f5;border-left:4px solid #dc3545;border-radius:0 8px 8px 0;margin-bottom:18px;'>
        <tr><td style='padding:16px 18px;font-size:13px;color:#334155;line-height:1.9;'>
          <strong>Pending fee records:</strong> ${dueCount}<br>
          <strong>Total dues:</strong> Rs. ${amount}
        </td></tr>
      </table>
      <div style='text-align:center;'>
        <a href='${link}' style='background:#326a33;color:#ffffff;padding:11px 22px;border-radius:7px;text-decoration:none;font-size:13px;font-weight:700;display:inline-block;'>Open Dashboard</a>
      </div>
    </div>
    <div style='background:#f8fafc;border-top:1px solid #e2e8f0;padding:12px 26px;text-align:center;font-size:11px;color:#94a3b8;'>&copy; ${yearNow} FATA University Hostel. Automated notification.</div>
  </div>
</div>`;
  return { subject: 'Clear Dues Before Room Leave Request - FATA University Hostel', html };
}

function adminLeaveRequest({ userName, userEmail, userPhone, role, hostelName, roomNo }) {
  const timeNow = dateTimeLabel();
  const yearNow = currentYear();

  const html = `
<div style='font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;padding:24px 8px;'>
  <div style='max-width:560px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border-top:4px solid #937C3D;'>
    <div style='padding:22px 26px;text-align:center;background:#f8fafc;'>
      <div style='font-size:18px;font-weight:800;color:#1e293b;'>FATA University Hostel</div>
      <div style='font-size:12px;color:#64748b;margin-top:4px;'>New Room Leave Request</div>
    </div>
    <div style='padding:24px 26px;'>
      <p style='font-size:15px;color:#1e293b;font-weight:700;margin:0 0 8px;'>Hello, Admin</p>
      <p style='font-size:14px;color:#475569;line-height:1.7;margin:0 0 18px;'>A user has requested to leave their assigned room on <strong>${timeNow}</strong>. Fee dues were checked before submitting this request.</p>
      <table width='100%' cellpadding='0' cellspacing='0' style='background:#f8fafc;border-left:4px solid #326a33;border-radius:0 8px 8px 0;margin-bottom:16px;'>
        <tr><td style='padding:16px 18px;font-size:13px;color:#334155;line-height:1.9;'>
          <strong>Name:</strong> ${e(userName)}<br>
          <strong>Role:</strong> ${e(role)}<br>
          <strong>Email:</strong> ${e(userEmail)}<br>
          <strong>Phone:</strong> ${e(userPhone)}
        </td></tr>
      </table>
      <table width='100%' cellpadding='0' cellspacing='0' style='background:#fff7ed;border-left:4px solid #937C3D;border-radius:0 8px 8px 0;margin-bottom:18px;'>
        <tr><td style='padding:16px 18px;font-size:13px;color:#334155;line-height:1.9;'>
          <strong>Hostel:</strong> ${e(hostelName)}<br>
          <strong>Room:</strong> ${e(roomNo)}<br>
          <strong>Fee Dues:</strong> Cleared
        </td></tr>
      </table>
      <div style='text-align:center;'>
        <a href='${clientUrl()}/admin/dashboard' style='background:#326a33;color:#ffffff;padding:11px 22px;border-radius:7px;text-decoration:none;font-size:13px;font-weight:700;display:inline-block;'>Open Admin Dashboard</a>
      </div>
    </div>
    <div style='background:#f8fafc;border-top:1px solid #e2e8f0;padding:12px 26px;text-align:center;font-size:11px;color:#94a3b8;'>&copy; ${yearNow} FATA University Hostel. Automated notification.</div>
  </div>
</div>`;
  return { subject: `Room Leave Request - ${userName}`, html };
}

function adminNewComplaint({ title, description, role }) {
  const yearNow = currentYear();
  const timeNow = dateTimeLabel();

  const html = `
<div style='margin:0;padding:0;background:#f0f4f0;font-family:Arial,Helvetica,sans-serif;'>
<table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#f0f4f0;padding:32px 8px;'><tr><td align='center'>
<table width='600' cellpadding='0' cellspacing='0' border='0' style='max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(50,106,51,0.10);'>

  <!-- HEADER -->
  <tr><td style='background:linear-gradient(135deg,#7a2a00 0%,#e58c0c 100%);padding:32px 36px;text-align:center;'>
    <div style='font-size:11px;color:#ffe0b2;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;'>FATA University Hostel Management System</div>
    <div style='font-size:24px;font-weight:800;color:#ffffff;margin-bottom:4px;'>&#128680; New Complaint Received</div>
    <div style='font-size:13px;color:#ffe0b2;'>Submitted on ${timeNow}</div>
  </td></tr>

  <!-- BODY -->
  <tr><td style='padding:32px 36px;'>
    <p style='font-size:15px;color:#7a2a00;font-weight:700;margin:0 0 6px;'>Hello, Admin</p>
    <p style='font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;'>A <strong>${e(role)}</strong> has submitted a new complaint ticket that requires your attention.</p>

    <!-- Complaint Card -->
    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#fff8f0;border-left:4px solid #e58c0c;border-radius:0 8px 8px 0;margin-bottom:20px;'>
      <tr><td style='padding:18px 20px;'>
        <div style='font-size:11px;color:#e58c0c;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;'>Complaint Details</div>
        <div style='font-size:15px;font-weight:700;color:#1C2331;margin-bottom:10px;'>${e(title)}</div>
        <div style='font-size:13px;color:#555;line-height:1.7;white-space:pre-wrap;'>${e(description)}</div>
      </td></tr>
    </table>

    <!-- Submitted By -->
    <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background:#f4f9f4;border-left:4px solid #326a33;border-radius:0 8px 8px 0;margin-bottom:28px;'>
      <tr><td style='padding:14px 20px;'>
        <div style='font-size:11px;color:#326a33;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;'>Submitted By</div>
        <div style='font-size:13px;color:#1e1e1e;font-weight:600;'>Role: ${e(role)}</div>
      </td></tr>
    </table>

    <!-- CTA -->
    <table width='100%' cellpadding='0' cellspacing='0' border='0'><tr><td align='center'>
      <a href='${clientUrl()}/admin/dashboard' style='display:inline-block;background:#e58c0c;color:#ffffff;font-size:14px;font-weight:700;padding:13px 32px;border-radius:7px;text-decoration:none;letter-spacing:0.5px;'>Review Complaint &rarr;</a>
    </td></tr></table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style='background:#f4f9f4;border-top:1px solid #e0ede0;padding:18px 36px;text-align:center;'>
    <p style='font-size:11px;color:#999;margin:0;'>&copy; ${yearNow} FATA University Hostel Management System &mdash; Automated Notification. Do not reply.</p>
  </td></tr>

</table>
</td></tr></table>
</div>`;
  return { subject: `\uD83D\uDEA8 New Complaint \u2014 ${title}`, html };
}

// ---------- public.php ----------

function contactMessage({ name, email, subject }, message) {
  const subj = subject || 'General Inquiry';
  const html = `
            <div style='font-family: Arial, sans-serif; color: #333;'>
                <h3>New Message from Hostel Contact Form</h3>
                <p><strong>Name:</strong> ${e(name)}</p>
                <p><strong>Email:</strong> ${e(email)}</p>
                <p><strong>Subject:</strong> ${e(subj)}</p>
                <hr style='border: 1px solid #eee;'>
                <p><strong>Message:</strong></p>
                <p style='background: #f9f9f9; padding: 15px; border-radius: 5px; border: 1px solid #ddd;'>
                    ${e(message).replace(/\r?\n/g, '<br>')}
                </p>
            </div>`;
  return { subject: `New Contact Message: ${subj}`, html };
}

module.exports = {
  loginNotification,
  welcome,
  forgotPasswordOtp,
  applicationUpdate,
  feeReminder,
  feeReport,
  feePaymentConfirmed,
  complaintUpdate,
  adminNewApplication,
  leaveBlockedDues,
  adminLeaveRequest,
  adminNewComplaint,
  contactMessage
};
