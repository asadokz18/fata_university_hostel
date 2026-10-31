// #sec-applications (browse & apply for a room + my applications)
import { useEffect, useState } from 'react';
import { api, uploadUrl } from '../../api';
import { formatDatePK, localDate } from '../../helpers';

export default function Applications({ faculty, notify }) {
  const [status, setStatus] = useState('');
  const [rooms, setRooms] = useState(null);
  const [apps, setApps] = useState(null);
  const [durations, setDurations] = useState({});
  const fmt = faculty ? formatDatePK : localDate;

  const loadRooms = async (s = status) => {
    setRooms(null);
    const data = await api.get(`/user/rooms${s ? '?status=' + s : ''}`);
    setRooms(data.rooms || []);
  };
  const loadApps = async () => {
    setApps(null);
    const data = await api.get('/user/my-applications');
    setApps(data.applications || []);
  };

  useEffect(() => { loadRooms(status); /* eslint-disable-next-line */ }, [status]);
  useEffect(() => { loadApps(); }, []);

  const applyRoom = async roomId => {
    const rawDate = durations[roomId];
    if (!rawDate) { window.alert('Please select an expiry date.'); return; }
    const parts = rawDate.split('-'); // [YYYY, MM, DD]
    const duration = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : rawDate;

    if (!window.confirm(`Apply for this room with duration: ${duration}?`)) return;

    const data = await api.post('/user/apply-room', { room_id: roomId, booking_duration: duration });
    if (data.message === 'Connection error.' && !data.success) {
      notify('Error submitting application.', 'danger');
      return;
    }
    notify(data.message, data.success ? 'success' : 'danger');
    if (data.success) { loadApps(); loadRooms(); }
  };

  const dateInput = r => (
    <div style={{ marginBottom: 12, textAlign: 'left', width: faculty ? '100%' : undefined }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2c3e50', display: 'block', marginBottom: 4 }}>Expiry Date (DD/MM/YYYY) *</label>
      <input
        type="date" id={`customDurationInput-${r.id}`}
        value={durations[r.id] || ''} onChange={e => setDurations(d => ({ ...d, [r.id]: e.target.value }))}
        style={{ width: '100%', padding: 8, border: '1px solid #ced4da', borderRadius: 6, fontSize: '0.8rem', boxSizing: 'border-box' }}
      />
    </div>
  );

  const studentCard = r => (
    <div key={r.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.06)', transition: 'all 0.2s' }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseOut={e => { e.currentTarget.style.transform = ''; }}>
      <div style={{ height: 150, overflow: 'hidden', position: 'relative' }}>
        <img src={r.room_image ? uploadUrl(r.room_image) : '/assets/images/hero-image1.jpeg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        <span style={{ position: 'absolute', top: 10, right: 10, padding: '4px 10px', borderRadius: 16, fontSize: '0.75rem', fontWeight: 700, background: r.available_spaces > 0 ? '#198754' : '#dc3545', color: '#fff' }}>{r.available_spaces > 0 ? 'Available' : 'Full'}</span>
      </div>
      <div style={{ padding: 14 }}>
        <h4 style={{ marginBottom: 6, fontSize: '0.9rem' }}>Room {r.room_no}</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10 }}>{r.description?.substring(0, 60) || 'Standard room'}</p>
        <div style={{ display: 'flex', gap: 10, fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          <span><i className="fas fa-users"></i> {r.capacity} beds</span>
          <span><i className="fas fa-door-open"></i> {r.available_spaces} free</span>
        </div>
        {r.available_spaces > 0 ? (
          <>
            {dateInput(r)}
            <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => applyRoom(r.id)}><i className="fas fa-plus"></i> Apply</button>
          </>
        ) : <button className="btn btn-sm" style={{ width: '100%', background: 'var(--light-gray)', color: 'var(--text-muted)' }} disabled>Full</button>}
      </div>
    </div>
  );

  const facultyCard = r => {
    const open = r.available_spaces > 0 && r.status === 'Available';
    return (
      <div className={`room-card ${r.status.toLowerCase()}`} key={r.id}>
        <div className="room-card-img">
          <img src={r.room_image ? uploadUrl(r.room_image) : '/assets/images/KHYBER_HOUSE.jpg'} alt="Room" />
          <span className="room-card-badge">{r.status}</span>
        </div>
        <div className="room-card-content">
          <h4>Room {r.room_no}</h4>
          <p>{r.description || 'Faculty accommodation in ' + (r.hostel_name || 'assigned hostel') + '.'}</p>
          <div className="room-card-meta">
            <span><i className="fas fa-users"></i> {r.capacity} Seats</span>
            <span><i className="fas fa-bed"></i> {r.available_spaces} Free</span>
          </div>
          {open && dateInput(r)}
          <button className="btn btn-primary btn-sm btn-block" onClick={() => applyRoom(r.id)} disabled={!open}>
            {r.available_spaces <= 0 ? 'Full' : 'Apply Now'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div id="sec-applications">
      <div className="apply-room-card">
        <div className="section-head" style={{ padding: '18px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}><i className="fas fa-building" style={{ color: 'var(--primary)' }}></i> Browse &amp; Apply for a Room</h3>
        </div>
        <div style={{ padding: 20 }}>
          <div className="filter-bar" style={{ marginBottom: 16 }}>
            <select className="form-control" id="roomStatusFilter" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 'auto' }}>
              <option value="">All Rooms</option>
              <option value="Available">Available Only</option>
            </select>
          </div>
          <div className="rooms-grid" id="availableRoomsGrid"
            style={faculty ? undefined : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
            {rooms === null && <div className="spinner"></div>}
            {rooms && !rooms.length && (faculty
              ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No rooms found matching your criteria.</div>
              : <p style={{ color: 'var(--text-muted)' }}>No rooms available.</p>)}
            {rooms && rooms.map(r => (faculty ? facultyCard(r) : studentCard(r)))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}><i className="fas fa-file-alt" style={{ color: 'var(--primary)' }}></i> My Applications</h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Hostel</th><th>Room</th><th>Type</th><th>Duration</th><th>Status</th></tr>
            </thead>
            <tbody id="myAppsBody">
              {apps === null && <tr><td colSpan="6" className="no-data"><div className="spinner"></div></td></tr>}
              {apps && !apps.length && <tr><td colSpan="6" className="no-data">No applications yet.</td></tr>}
              {apps && apps.map(a => (
                <tr key={a.id}>
                  <td>{fmt(a.applied_at)}</td>
                  <td>{a.hostel_name || (faculty ? '—' : '')}</td>
                  <td>Room {a.room_no || (faculty ? '—' : '')}</td>
                  <td>{faculty
                    ? <span className={`badge-status badge-${(a.application_type || '').toLowerCase() === 'apply' ? 'approved' : 'pending'}`}>{a.application_type}</span>
                    : a.application_type}</td>
                  <td>{a.booking_duration || '—'}</td>
                  <td><span className={`badge-status badge-${(a.status || '').toLowerCase()}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
