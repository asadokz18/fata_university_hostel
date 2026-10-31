// #sec-myroom
import { useEffect, useState } from 'react';
import { api, uploadUrl } from '../../api';

export default function MyRoom({ faculty, go, notify }) {
  const [room, setRoom] = useState(undefined); // undefined = loading, null = none

  const loadMyRoom = async () => {
    const data = await api.get('/user/my-room');
    setRoom(data.success && data.room ? data.room : null);
  };

  useEffect(() => { loadMyRoom(); }, []);

  const leaveRoom = async () => {
    if (!window.confirm(faculty ? 'Submit a room leave request?' : 'Request to leave your room?')) return;
    const data = await api.post('/user/leave-room');
    notify(data.message || (faculty ? 'Error submitting request.' : ''), data.success ? 'success' : 'danger');
    if (data.success) loadMyRoom();
  };

  const defaultImg = faculty ? 'KHYBER_HOUSE.jpg' : 'FAQIR_IPI_HOUSE.jpg';

  let content;
  if (room === undefined) {
    content = <div className="spinner"></div>;
  } else if (room === null) {
    content = faculty ? (
      <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
        <i className="fas fa-door-open" style={{ fontSize: '3rem', color: '#ccc', marginBottom: 16 }}></i>
        <h3 style={{ marginBottom: 8 }}>No Room Assigned Yet</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Apply for a faculty room from the Applications section.</p>
        <a href="#" className="btn btn-primary" onClick={e => { e.preventDefault(); go('applications'); }}><i className="fas fa-plus"></i> Apply for Room</a>
      </div>
    ) : (
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚪</div>
        <h3>No Room Assigned Yet</h3>
        <p style={{ color: 'var(--text-muted)', margin: '10px 0 20px' }}>Apply for a room from the Applications section.</p>
        <a href="#" className="btn btn-primary" onClick={e => { e.preventDefault(); go('applications'); }}><i className="fas fa-plus"></i> Apply for Room</a>
      </div>
    );
  } else if (faculty) {
    const r = room;
    content = (
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #f0f0f0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center' }}>
          <div className="overview-card" style={{ margin: 0, borderTop: '3px solid var(--primary)' }}>
            <div className="overview-icon">🚪</div><div className="overview-value">{r.room_no || '—'}</div><div className="overview-label">Room No</div>
          </div>
          <div className="overview-card" style={{ margin: 0, borderTop: '3px solid var(--secondary)' }}>
            <div className="overview-icon">🛏</div><div className="overview-value">{r.capacity || '—'}</div><div className="overview-label">Capacity</div>
          </div>
          <div className="overview-card" style={{ margin: 0, borderTop: '3px solid #198754' }}>
            <div className="overview-icon">✅</div><div className="overview-value">{r.available_spaces ?? '—'}</div><div className="overview-label">Beds Left</div>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <img src={r.room_image ? uploadUrl(r.room_image) : `/assets/images/${defaultImg}`} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 10, marginBottom: 16 }} alt="Room" />
          <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{r.description || 'Faculty accommodation.'}</p>
          <div style={{ marginBottom: 20 }}>
            <span className="badge-status badge-approved"><i className="fas fa-home"></i> {r.hostel_name || '—'}</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={leaveRoom}><i className="fas fa-sign-out-alt"></i> Request to Leave Room</button>
        </div>
      </div>
    );
  } else {
    const r = room;
    const label = { fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 };
    content = (
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,.06)', overflow: 'hidden', maxWidth: 700 }}>
        <div style={{ padding: 20, borderBottom: '1px solid #f0f0f0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div><div style={label}>Room Number</div><div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{r.room_no}</div></div>
          <div><div style={label}>Capacity</div><div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{r.capacity} Beds</div></div>
          <div><div style={label}>Available</div><div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#198754' }}>{r.available_spaces} left</div></div>
        </div>
        <div style={{ padding: 20 }}>
          <img src={r.room_image ? uploadUrl(r.room_image) : `/assets/images/${defaultImg}`} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10, marginBottom: 14 }} alt="" />
          <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{r.description || 'Your assigned room.'}</p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: 16 }}><i className="fas fa-home"></i> {r.hostel_name}</span>
          <h4 style={{ marginBottom: 10 }}>Roommates</h4>
          {r.roommates?.length
            ? r.roommates.map((rm, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem' }}>{rm.full_name[0]}</div>
                <span style={{ fontWeight: 600 }}>{rm.full_name}</span>
              </div>
            ))
            : <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No roommates yet.</p>}
          <button className="btn btn-danger btn-sm" style={{ marginTop: 16 }} onClick={leaveRoom}><i className="fas fa-sign-out-alt"></i> Request Room Leave</button>
        </div>
      </div>
    );
  }

  return (
    <div id="sec-myroom">
      <div id="myRoomContent">{content}</div>
    </div>
  );
}
