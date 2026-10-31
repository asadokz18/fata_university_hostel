// student/student_id_card.html + faculty/faculty_id_card.html (+ their JS)
import { useEffect, useRef, useState } from 'react';
import { api, uploadUrl } from '../api';
import { loadScript, QR_SCRIPT } from '../helpers';

// dd Mon yyyy
const formatDate = str => {
  if (!str) return '—';
  try { return new Date(str).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return str; }
};

function calculateExpiryDate(joinDateStr, bookingDuration, defaultYears) {
  if (!joinDateStr) return '—';
  try {
    const d = new Date(joinDateStr);
    const durationStr = (bookingDuration || '').toLowerCase().trim();
    if (bookingDuration && bookingDuration.trim().match(/^\d{2}\/\d{2}\/\d{4}$/)) return bookingDuration.trim();

    if (!durationStr || durationStr === '—' || durationStr === 'not assigned') {
      d.setFullYear(d.getFullYear() + defaultYears);
    } else if (durationStr.includes('month')) {
      const match = durationStr.match(/(\d+)\s*month/);
      d.setMonth(d.getMonth() + (match ? parseInt(match[1]) : 1));
    } else if (durationStr.includes('year')) {
      const match = durationStr.match(/(\d+)\s*year/);
      d.setFullYear(d.getFullYear() + (match ? parseInt(match[1]) : 1));
    } else if (durationStr.includes('semester')) {
      if (durationStr.includes('spring') || durationStr.includes('summer')) {
        d.setMonth(d.getMonth() + 4);
      } else {
        const match = durationStr.match(/(\d+)\s*semester/);
        d.setMonth(d.getMonth() + ((match ? parseInt(match[1]) : 1) * 6));
      }
    } else {
      const matchMonth = durationStr.match(/(\d+)\s*m/);
      const matchYear = durationStr.match(/(\d+)\s*y/);
      if (matchMonth) d.setMonth(d.getMonth() + parseInt(matchMonth[1]));
      else if (matchYear) d.setFullYear(d.getFullYear() + parseInt(matchYear[1]));
      else d.setFullYear(d.getFullYear() + defaultYears);
    }
    return d.toLocaleDateString('en-PK', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

function avatarDataURL(name, faculty) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 200;
  const ctx = canvas.getContext('2d');
  if (faculty) {
    ctx.fillStyle = '#ffffff';            // white background
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#2d5a27';            // dark green circle
    ctx.beginPath();
    ctx.arc(100, 100, 95, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#326a33';
    ctx.fillRect(0, 0, 200, 200);
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((name || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(), 100, 100);
  return canvas.toDataURL();
}

function ErrorScreen({ msg, title }) {
  const isNotice = title !== 'Error Loading ID Card';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'DM Sans,sans-serif', background: '#f0f2f5' }}>
      <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.1)', maxWidth: 400 }}>
        <i className={`fas ${isNotice ? 'fa-info-circle' : 'fa-exclamation-triangle'}`} style={{ fontSize: '3rem', color: isNotice ? '#f39c12' : '#dc3545', marginBottom: 16 }}></i>
        <h3 style={{ marginBottom: 10 }}>{title}</h3>
        <p style={{ color: '#6c757d' }}>{msg}</p>
        <button onClick={() => window.history.back()} style={{ display: 'inline-block', marginTop: 20, padding: '10px 24px', background: '#326a33', color: '#fff', borderRadius: 8, textDecoration: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }}>Go Back</button>
      </div>
    </div>
  );
}

const Row = ({ id, label, children, link }) => (
  <div className="detail-row"><span className="detail-label">{label}</span><span className={`detail-value${link ? ' detail-link' : ''}`} id={id}>{children}</span></div>
);
const BackRow = ({ id, label, children }) => (
  <div className="back-detail-row"><span className="back-label">{label}</span><span className="back-value" id={id}>{children}</span></div>
);

export default function IdCardView({ faculty }) {
  const [state, setState] = useState({ status: 'loading' }); // loading | error | ready
  const qrRef = useRef(null);
  const roleName = faculty ? 'Faculty' : 'Student';
  const years = faculty ? 5 : 4;

  useEffect(() => {
    (async () => {
      const data = await api.get('/user/id-card-data');
      if (!data.success) {
        setState({ status: 'error', msg: data.message || 'Could not load ID card data.', title: 'Error Loading ID Card' });
        return;
      }
      const u = data.profile || data.user;
      if (!u.room_no || u.room_no.trim() === '' || u.room_no === 'Not Assigned') {
        setState({ status: 'error', msg: 'You have not assigned room please wait for approval.', title: 'Room Not Assigned' });
        return;
      }
      setState({ status: 'ready', u });
    })();
  }, []);

  // QR code (generated once the card is on screen)
  useEffect(() => {
    if (state.status !== 'ready' || !qrRef.current) return;
    const u = state.u;
    const el = qrRef.current;
    const qrData = JSON.stringify(faculty
      ? { name: u.full_name, id: u.employee_id, dept: u.department || u.designation, hostel: u.hostel_name, room: u.room_no, phone: u.phone }
      : { name: u.full_name, id: u.registration_no, dept: u.department, hostel: u.hostel_name, room: u.room_no, phone: u.phone });
    loadScript(QR_SCRIPT).then(() => {
      el.innerHTML = '';
      // eslint-disable-next-line no-undef
      new window.QRCode(el, { text: qrData, width: 90, height: 90, colorDark: '#1C2331', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.H });
    }).catch(() => {
      el.innerHTML = `<div style="width:90px;height:90px;border:2px dashed #ccc;display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:#999;text-align:center">QR Code<br>${faculty ? u.employee_id : u.registration_no}</div>`;
    });
  }, [state, faculty]);

  if (state.status === 'error') return <ErrorScreen msg={state.msg} title={state.title} />;
  if (state.status === 'loading') {
    return (
      <div id="loadingState" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="spinner"></div>
        <p style={{ color: '#666', marginTop: 12 }}>Loading ID Card...</p>
      </div>
    );
  }

  const u = state.u;
  const expDate = calculateExpiryDate(u.joining_date, u.booking_duration, years);
  const photo = u.profile_photo ? uploadUrl(u.profile_photo) : avatarDataURL(u.full_name, faculty);

  return (
    <div id="idCardContainer" style={{ display: 'block' }}>
      <div className="id-card-wrapper">

        {/* FRONT CARD */}
        <div className="id-card id-card-front">
          <div className="card-header">
            <img src="/assets/images/logo.png" alt="Logo" className="main-logo" />
            <div className="header-content">
              <h3>FATA University</h3>
              <p>HOSTEL</p>
            </div>
          </div>
          <div className="card-body">
            <img id="cardPhoto" src={photo} alt="Photo" className="photo-circle" />
            <div className="card-name">
              <h2 id="cardName">{u.full_name || '—'}</h2>
              <p id="cardDept">{faculty ? (u.designation || 'Faculty Member') : (u.department || 'Student')}</p>
            </div>
            <div className="card-details">
              <Row id="cardFather" label="F/Name :">{u.father_name || '—'}</Row>
              <Row id="cardGender" label="Gender :">{u.gender || '—'}</Row>
              {faculty && <Row id="cardQual" label="Qualification :">{u.qualification || '—'}</Row>}
              <Row id="cardHostel" label="Hostel Name :" link>{u.hostel_name || 'Not Assigned'}</Row>
              <Row id="cardRoom" label="Room No :" link>{u.room_no || 'Not Assigned'}</Row>
              {!faculty && <Row id="cardSemester" label="Semester :">{u.semester || '—'}</Row>}
              <Row id="cardAddress" label="Address :">{u.home_address || '—'}</Row>
            </div>
          </div>
          <div className="card-footer" style={faculty ? { justifyContent: 'space-between' } : undefined}>
            <span className="join-date">Check-in Date<br /><strong id="cardJoinDate">{formatDate(u.joining_date)}</strong></span>
            <span className="join-date" style={{ textAlign: 'right' }}>Validity<br /><strong id="cardExpiry" style={{ color: '#ffffff' }}>{expDate}</strong></span>
          </div>
        </div>

        {/* BACK CARD */}
        <div className="id-card id-card-back">
          <div className="card-header">
            <h3>FATA UNIVERSITY HOSTEL</h3>
            <p style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: 4 }}>Scan QR code to verify {faculty ? 'faculty' : 'student'} hostel information</p>
          </div>
          <div className="qr-section">
            <div id="qrCode" ref={qrRef}></div>
            <p>{faculty ? 'SCAN TO VIEW FACULTY HOSTEL DETAILS' : 'scan to view student hostel details'}</p>
          </div>
          <div className="back-details">
            <BackRow id="backName" label={`${roleName} :`}>{u.full_name || '—'}</BackRow>
            <BackRow id="backRegNo" label={faculty ? 'Employee ID :' : 'Registration No :'}>{(faculty ? u.employee_id : u.registration_no) || '—'}</BackRow>
            {faculty && <BackRow id="backQual" label="Qualification :">{u.qualification || '—'}</BackRow>}
            <BackRow id="backDept" label="Dept :">{(faculty ? (u.department || u.designation) : u.department) || '—'}</BackRow>
            {!faculty && <BackRow id="backSemester" label="Semester :">{u.semester || '—'}</BackRow>}
            <BackRow id="backContact" label="Contact :">{u.phone || '—'}</BackRow>
            <BackRow id="backDob" label="DOB :">{formatDate(u.dob)}</BackRow>
          </div>
          <div className="back-notice">This card is property of FATA University. If found, please return to hostel administration.<br /><strong>info@fu.edu.pk &nbsp; 0922-XXXXXX</strong></div>
          <div className="card-footer" style={{ justifyContent: 'space-between' }}>
            <span className="join-date">Check-in Date<br /><strong id="backJoinDate">{formatDate(u.joining_date)}</strong></span>
            <span className="join-date" style={{ textAlign: 'right' }}>Validity<br /><strong id="backExpiry" style={{ color: '#ffffff' }}>{expDate}</strong></span>
          </div>
        </div>

      </div>

      {/* Print Buttons */}
      <div className="print-btns">
        <button className="print-btn secondary" onClick={() => window.history.back()}><i className="fas fa-arrow-left"></i> Back</button>
        <button className="print-btn primary" onClick={() => window.print()}><i className="fas fa-print"></i> Print / Download PDF</button>
      </div>
    </div>
  );
}

