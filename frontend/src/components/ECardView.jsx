// student/student_ecard.html + faculty/faculty_ecard.html (+ their JS)
import { useEffect, useRef, useState } from 'react';
import { api, uploadUrl } from '../api';
import { loadScript, QR_SCRIPT } from '../helpers';

// DD/MM/YYYY
const formatDate = dateStr => {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

function calculateExpiryDate(joinDateStr, bookingDuration, years) {
  if (bookingDuration && bookingDuration.trim().match(/^\d{2}\/\d{2}\/\d{4}$/)) return bookingDuration;
  if (!joinDateStr) return '—';
  const joinDate = new Date(joinDateStr);
  if (isNaN(joinDate.getTime())) return '—';
  joinDate.setFullYear(joinDate.getFullYear() + years);
  const dd = String(joinDate.getDate()).padStart(2, '0');
  const mm = String(joinDate.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${joinDate.getFullYear()}`;
}

function avatarDataURL(name, faculty) {
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = faculty ? '#d97706' : '#2e7530';
  ctx.fillRect(0, 0, 120, 120);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : (faculty ? 'F' : 'S');
  ctx.fillText(initials, 60, 60);
  return canvas.toDataURL();
}

export default function ECardView({ faculty }) {
  const [state, setState] = useState({ status: 'loading' });
  const [flipped, setFlipped] = useState(false);
  const qrRef = useRef(null);
  const roleName = faculty ? 'Faculty' : 'Student';
  const years = faculty ? 5 : 4;

  useEffect(() => {
    (async () => {
      const data = await api.get('/user/id-card-data');
      if (!data.success) {
        setState({ status: 'error', msg: data.message || 'Could not load E-card data.', title: 'Error' });
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

  useEffect(() => {
    if (state.status !== 'ready' || !qrRef.current) return;
    const u = state.u;
    const el = qrRef.current;
    loadScript(QR_SCRIPT).then(() => {
      el.innerHTML = '';
      const verifyUrl = `${window.location.origin}/hostel/verify_id.php?id=${u.id || 1}&role=${roleName}`;
      new window.QRCode(el, { text: verifyUrl, width: 90, height: 90, colorDark: '#000000', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.H });
    }).catch(() => { /* QR library could not be loaded (offline) - leave the box empty */ });
  }, [state, roleName]);

  if (state.status === 'loading') {
    return (
      <div id="loadingState" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="spinner"></div>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 12 }}>Accessing Digital E-Pass...</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div id="loadingState" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ maxWidth: 320, margin: '0 auto', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 12, padding: 24, textAlign: 'center' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#ef4444', marginBottom: 12 }}></i>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, color: '#fff' }}>{state.title}</h4>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 18 }}>{state.msg}</p>
          <button className="action-btn secondary" onClick={() => window.history.back()}>Go Back</button>
        </div>
      </div>
    );
  }

  const u = state.u;
  const expDate = calculateExpiryDate(u.joining_date, u.booking_duration, years);
  const photo = u.profile_photo ? uploadUrl(u.profile_photo) : avatarDataURL(u.full_name, faculty);

  const Box = ({ label, id, children, labelClass = '' }) => (
    <div className="ecard-info-box">
      <div className={`ecard-info-label ${labelClass}`.trim()}>{label}</div>
      <div className="ecard-info-value" id={id}>{children}</div>
    </div>
  );
  const backBox = (label, id, value) => (
    <div className="ecard-info-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px' }}>
      <span className="ecard-info-label" style={{ margin: 0 }}>{label}</span>
      <span className="ecard-info-value" id={id}>{value}</span>
    </div>
  );

  return (
    <div id="ecardWrapper" style={{ display: 'block', textAlign: 'center' }}>

      <div className={`ecard-container${flipped ? ' flipped' : ''}`} id="ecard" onClick={() => setFlipped(f => !f)}>
        <div className="ecard-inner">

          {/* FRONT SIDE */}
          <div className="ecard-face ecard-front">
            <div className="ecard-header">
              <img src="/assets/images/logo.png" alt="Logo" className="logo" />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <h3>FATA University</h3>
                <p>{faculty ? 'Faculty Digital Pass' : 'Hostel Digital Pass'}</p>
              </div>
            </div>
            <div className="ecard-body">
              <div className="photo-area">
                <img id="cardPhoto" src={photo} alt="Photo" className="ecard-photo" />
                <span className="status-badge">Active</span>
              </div>
              <div className="ecard-name">
                <h2 id="cardName">{u.full_name || '—'}</h2>
                <p id="cardDept">{u.department || roleName}</p>
              </div>

              <div className="ecard-details">
                {faculty ? (
                  <>
                    <Box label="Employee ID" id="cardRegNo">{u.employee_id || '—'}</Box>
                    <Box label="Designation" id="cardDesignation" labelClass="font-bold">{u.designation || '—'}</Box>
                    <Box label="Hostel Name" id="cardHostel">{u.hostel_name || '—'}</Box>
                    <Box label="Room No" id="cardRoom">{u.room_no || '—'}</Box>
                  </>
                ) : (
                  <>
                    <Box label="Registration No" id="cardRegNo">{u.registration_no || '—'}</Box>
                    <Box label="Hostel Hostel" id="cardHostel">{u.hostel_name || '—'}</Box>
                    <Box label="Room No" id="cardRoom">{u.room_no || '—'}</Box>
                    <Box label="Semester" id="cardSemester">{u.semester || '—'}</Box>
                  </>
                )}
              </div>
            </div>
            <div className="ecard-footer">
              <div className="ecard-date-box" style={{ textAlign: 'left' }}>
                <span className="ecard-date-label">Check-in Date</span>
                <span className="ecard-date-value" id="cardJoinDate">{formatDate(u.joining_date)}</span>
              </div>
              <div className="ecard-date-box" style={{ textAlign: 'right' }}>
                <span className="ecard-date-label">Validity</span>
                <span className="ecard-date-value" id="cardExpiry" style={{ color: '#ffb3b3' }}>{expDate}</span>
              </div>
            </div>
          </div>

          {/* BACK SIDE */}
          <div className="ecard-face ecard-back">
            <div className="ecard-header">
              <img src="/assets/images/logo.png" alt="Logo" className="logo" />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <h3>FATA University</h3>
                <p>Security Verification</p>
              </div>
            </div>
            <div className="ecard-body" style={{ paddingTop: 15 }}>
              <div className="qr-container">
                <div id="qrCode" ref={qrRef}></div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: '5px 0 15px' }}>Scan to authenticate hostel residency</p>

              <div className="ecard-details" style={{ gridTemplateColumns: '1fr', gap: 8, borderTop: 'none', padding: 0 }}>
                {backBox('Father Name:', 'backFather', u.father_name || '—')}
                {faculty ? backBox('Qualification:', 'backQual', u.qualification || '—') : backBox('CNIC No:', 'backCnic', u.cnic || '—')}
                {backBox('Contact No:', 'backPhone', u.phone || '—')}
              </div>
              <div className="back-notice-box">
                This digital pass is securely linked to the FATA University database. Any misuse or duplication is strictly prohibited.
              </div>
            </div>
            <div className="ecard-footer">
              <div className="ecard-date-box" style={{ textAlign: 'left' }}>
                <span className="ecard-date-label">Check-in Date</span>
                <span className="ecard-date-value" id="backJoinDate">{formatDate(u.joining_date)}</span>
              </div>
              <div className="ecard-date-box" style={{ textAlign: 'right' }}>
                <span className="ecard-date-label">Validity</span>
                <span className="ecard-date-value" id="backExpiry" style={{ color: '#ffb3b3' }}>{expDate}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="flip-hint"><i className="fas fa-sync-alt"></i> Tap card to flip and show QR code</div>

      <div className="action-panel" style={{ marginTop: 24, justifyContent: 'center' }}>
        <button className="action-btn secondary" onClick={() => window.history.back()}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <button className="action-btn primary" onClick={() => setFlipped(f => !f)}>
          <i className="fas fa-sync"></i> Flip Card
        </button>
      </div>

    </div>
  );
}
