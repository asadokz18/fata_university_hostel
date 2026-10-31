// #sec-overview  (student: get_my_room + get_my_fees + user notices | faculty: get_stats + public notices)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, uploadUrl } from '../../api';
import { formatDatePK, localDate } from '../../helpers';

const FALLBACK_GALLERY = ['hero-image3.jpg', 'hero-image4.jpg', 'hero-image1.jpeg'];

const noteStyle = { marginBottom: 15, padding: 12, background: '#f8f9fa', borderLeft: '4px solid var(--primary)', borderRadius: 6, boxShadow: '0 2px 5px rgba(0,0,0,0.02)' };

function RoommateChips({ roommates }) {
  return (
    <div className="roommates-preview" style={{ marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Roommates</p>
      {roommates?.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {roommates.map((rm, i) => (
            <div key={i} title={rm.full_name} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, border: '2px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              {rm.profile_photo ? <img src={uploadUrl(rm.profile_photo)} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : rm.full_name[0]}
            </div>
          ))}
        </div>
      ) : <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No roommates yet.</p>}
    </div>
  );
}

export default function Overview({ faculty, base, go, goIdCard, hasRoom, setHasRoom, setNotices, showAllNotices }) {
  const fmt = faculty ? formatDatePK : localDate;
  const defaultRoomImg = faculty ? 'KHYBER_HOUSE.jpg' : 'FAQIR_IPI_HOUSE.jpg';

  const [ov, setOv] = useState({ room: '—', hostel: '—', paid: 'Rs. 0', due: 'Rs. 0' });
  const [room, setRoom] = useState(undefined);       // undefined = no data yet, null = none
  const [notices, setLocalNotices] = useState(null); // null = loading, [] = none
  const [gallery, setGallery] = useState(null);      // null = keep the static fallback images

  useEffect(() => {
    let alive = true;
    (async () => {
      if (faculty) {
        const data = await api.get('/user/stats');
        if (alive && data.success) {
          setOv({
            room: data.room_no ? 'Room ' + data.room_no : '—',
            hostel: data.hostel_name || '—',
            paid: 'Rs. ' + (data.fees_paid || '0'),
            due: 'Rs. ' + (data.fees_due || '0')
          });
          if (data.room_no) {
            setHasRoom(true);
            setRoom({ room_no: data.room_no, hostel_name: data.hostel_name, description: data.description, room_image: data.room_image, roommates: data.roommates });
          } else setRoom(null);
        }
      } else {
        const roomData = await api.get('/user/my-room');
        if (!alive) return;
        if (roomData.room) {
          setHasRoom(true);
          setRoom(roomData.room);
          setOv(o => ({ ...o, room: 'Room ' + roomData.room.room_no, hostel: roomData.room.hostel_name }));
        } else setRoom(null);
        const feeData = await api.get('/user/my-fees');
        if (alive && feeData.success) {
          setOv(o => ({
            ...o,
            paid: 'Rs. ' + parseFloat(feeData.total_paid || 0).toFixed(0),
            due: 'Rs. ' + parseFloat(feeData.total_due || 0).toFixed(0)
          }));
        }
      }

      // notices
      const nd = faculty ? await api.get('/public/notices?limit=4') : await api.get('/user/notices');
      if (alive) {
        const list = nd.notices || [];
        setLocalNotices(list);
        if (list.length) setNotices(list);
      }

      // gallery preview
      const g = await api.get(`/public/gallery?limit=${faculty ? 6 : 3}`);
      if (alive && g.gallery && g.gallery.length) setGallery(g.gallery);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line
  }, []);

  const roomImg = room && room.room_image ? uploadUrl(room.room_image) : `/assets/images/${defaultRoomImg}`;

  return (
    <div id="sec-overview">
      {hasRoom && (
        <div id="idReadyBanner" className="id-ready-banner" style={{ display: 'flex' }}>
          <div>
            <h4>🎉 Your Hostel ID Card is Ready!</h4>
            <p>Your room has been assigned. Access your printable ID card and digital E-Card now.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to={`${base}/id-card`} className="id-card-btn" onClick={goIdCard}><i className="fas fa-id-card"></i> Print ID Card</Link>
            <Link to={`${base}/ecard`} className="id-card-btn" onClick={goIdCard} style={faculty ? { background: '#d97706', borderColor: '#d97706' } : { background: '#10b981', borderColor: '#10b981' }}><i className="fas fa-mobile-alt"></i> View E-Card</Link>
          </div>
        </div>
      )}

      <div className="overview-grid">
        <div className="overview-card">
          <div className="overview-icon">🚪</div>
          <div className="overview-value" id="ovRoom">{ov.room}</div>
          <div className="overview-label">My Room</div>
        </div>
        <div className="overview-card hostel">
          <div className="overview-icon">🏠</div>
          <div className="overview-value" id="ovHostel">{ov.hostel}</div>
          <div className="overview-label">My Hostel</div>
        </div>
        <div className="overview-card fee-paid">
          <div className="overview-icon">💚</div>
          <div className="overview-value" id="ovPaid">{ov.paid}</div>
          <div className="overview-label">Fees Paid</div>
        </div>
        <div className="overview-card fee-due">
          <div className="overview-icon">❗</div>
          <div className="overview-value" id="ovDue">{ov.due}</div>
          <div className="overview-label">Fees Due</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* My Room */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3><i className="fas fa-door-open"></i> My Current Room</h3>
            <a href="#" onClick={e => { e.preventDefault(); go('myroom'); }}>Details</a>
          </div>
          <div className="dashboard-card-body" id="overviewRoom">
            {room ? (
              <div className="room-info-box">
                <img className="room-info-img" src={roomImg} alt="Room" />
                <div className="room-info-details">
                  <h4>Room {room.room_no}</h4>
                  <p>{room.description || (faculty ? 'Your assigned faculty room.' : 'Your assigned room.')}</p>
                  <span className="room-badge"><i className="fas fa-home"></i> {room.hostel_name || '—'}</span>
                  <RoommateChips roommates={room.roommates} />
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No room assigned yet.{' '}
                <a href="#" onClick={e => { e.preventDefault(); go('applications'); }} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  {faculty ? 'Apply for a room →' : 'Apply for a room'}
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Latest Notices */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3><i className="fas fa-bullhorn"></i> Latest Notices</h3>
            <span id="noticeCount" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {notices && notices.length > 0 && (
                <>{notices.length} notices <a href="#" onClick={showAllNotices} style={{ marginLeft: 10, color: 'var(--primary)', textDecoration: 'underline', fontWeight: 600 }}>View All</a></>
              )}
            </span>
          </div>
          <div className="dashboard-card-body" id="overviewNotices">
            {notices === null && <div className="spinner"></div>}
            {notices && !notices.length && <p style={{ color: 'var(--text-muted)', fontSize: faculty ? '0.88rem' : undefined }}>No active notices.</p>}
            {notices && notices.length > 0 && (
              <marquee
                behavior="scroll" direction="up" scrollamount="3"
                onMouseOver={e => e.currentTarget.stop()} onMouseOut={e => e.currentTarget.start()}
                style={{ height: 250, padding: 4 }}
              >
                {notices.slice(0, 3).map(n => (
                  <div className="notice-item" style={noteStyle} key={n.id}>
                    <div style={{ display: 'flex', alignItems: faculty ? 'center' : undefined, gap: 8, marginBottom: 6 }}>
                      <span className={`badge-status badge-${n.priority.toLowerCase()}`}>{n.priority}</span>
                      <span style={{ fontSize: faculty ? '0.75rem' : '0.76rem', color: 'var(--text-muted)' }}>{fmt(n.created_at)}</span>
                    </div>
                    <h4 style={{ marginBottom: 6, fontSize: '0.95rem' }}>{n.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: '#555', margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                  </div>
                ))}
              </marquee>
            )}
          </div>
        </div>
      </div>

      {/* Complaint Banner */}
      <div className="complaint-banner">
        <div>
          <h3><i className="fas fa-headset"></i> Lodge a Complaint</h3>
          <p>Having an issue? Submit a complaint to hostel administration.</p>
        </div>
        <a href="#" className="complaint-btn" onClick={e => { e.preventDefault(); go('complaints'); }}><i className="fas fa-paper-plane"></i> File Complaint</a>
      </div>

      {/* Gallery Preview */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h3><i className="fas fa-images"></i> Gallery</h3>
          <a href="#" onClick={e => { e.preventDefault(); go('gallery'); }}>View All</a>
        </div>
        <div className="dashboard-card-body">
          <div className="gallery-preview" id="overviewGallery">
            {gallery
              ? gallery.map(g => <div className="gallery-preview-img" key={g.id}><img src={uploadUrl(g.image_path)} alt={faculty ? (g.caption || '') : 'Gallery'} loading={faculty ? 'lazy' : undefined} /></div>)
              : FALLBACK_GALLERY.map(f => <div className="gallery-preview-img" key={f}><img src={`/assets/images/${f}`} alt="Campus" /></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
