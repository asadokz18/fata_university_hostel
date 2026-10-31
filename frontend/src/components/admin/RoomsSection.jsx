// #sec-rooms + Add/Edit Room modal
import { useEffect, useRef, useState } from 'react';
import { api, toFormData, uploadUrl } from '../../api';
import { openTableReport, compressImage } from '../../helpers';
import { Badge, Msg } from './common';

const HOSTELS = ['FAQIR IPI HOUSE', 'FATIMA HOUSE', 'KHYBER HOUSE'];
const EMPTY = { id: '', hostel_name: '', room_no: '', capacity: 2, description: '' };

export default function RoomsSection({ refreshDashboard }) {
  const [hostel, setHostel] = useState('');
  const [rooms, setRooms] = useState(null);
  const [modal, setModal] = useState(null);   // null | { mode: 'add'|'edit' }
  const [form, setForm] = useState(EMPTY);
  const [alert, setAlert] = useState(null);
  const imgRef = useRef(null);

  const loadRoomsAdmin = async (h = hostel) => {
    setRooms(null);
    const data = await api.get(`/admin/rooms${h ? '?hostel=' + encodeURIComponent(h) : ''}`);
    setRooms(data.rooms || []);
  };

  useEffect(() => { loadRoomsAdmin(hostel); /* eslint-disable-next-line */ }, [hostel]);

  const openAddRoomModal = () => {
    setForm(EMPTY); setAlert(null); setModal({ mode: 'add' });
  };

  const openEditRoomModal = r => {
    setForm({ id: r.id, hostel_name: r.hostel_name, room_no: r.room_no, capacity: r.capacity, description: r.description || '' });
    setAlert(null);
    setModal({ mode: 'edit' });
  };

  const closeModal = () => setModal(null);

  const saveRoom = async () => {
    const fd = toFormData({
      hostel_name: form.hostel_name, room_no: form.room_no, capacity: form.capacity, description: form.description
    });
    let img = imgRef.current?.files[0];
    if (img) {
      img = await compressImage(img);
      fd.append('room_image', img);
    }

    const data = form.id ? await api.put(`/admin/rooms/${form.id}`, fd) : await api.post('/admin/rooms', fd);
    setAlert({ type: data.success ? 'success' : 'danger', msg: data.message });
    if (data.success) {
      setTimeout(() => { closeModal(); loadRoomsAdmin(); refreshDashboard(); }, 1000);
    }
  };

  const deleteRoom = async id => {
    if (!window.confirm('Delete this room?')) return;
    const data = await api.del(`/admin/rooms/${id}`);
    if (data.success) { loadRoomsAdmin(); refreshDashboard(); }
  };

  const downloadRoomsPDF = async () => {
    const data = await api.get('/admin/rooms');
    if (!data.success || !data.rooms?.length) { window.alert('No rooms found to generate PDF.'); return; }
    openTableReport({
      title: 'Hostel Rooms Report',
      headerLines: [`Hostel Rooms &amp; Availability Report | Generated on ${new Date().toLocaleDateString()}`, 'Contact: info@fu.edu.pk'],
      columns: ['#', 'Hostel Name', 'Room No', 'Capacity', 'Available Spaces', 'Status', 'Description'],
      rows: data.rooms.map((r, i) => [i + 1, r.hostel_name, `Room ${r.room_no}`, r.capacity, r.available_spaces, r.status, r.description || '—'])
    });
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <div id="sec-rooms">
        <div className="content-card">
          <div className="content-card-header">
            <h3><i className="fas fa-building"></i> Manage Rooms</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="quick-btn primary" onClick={openAddRoomModal}><i className="fas fa-plus"></i> Add New Room</button>
              <button className="quick-btn secondary" onClick={downloadRoomsPDF}><i className="fas fa-file-pdf"></i> Download PDF</button>
            </div>
          </div>
          <div className="content-card-body">
            <div className="filter-bar">
              <select className="form-control" id="roomHostelFilter" value={hostel} onChange={e => setHostel(e.target.value)} style={{ width: 'auto', padding: '8px 12px', fontSize: '0.88rem' }}>
                <option value="">All Hostels</option>
                {HOSTELS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div className="rooms-manage-grid" id="roomsManageGrid">
              {rooms === null && <div className="spinner"></div>}
              {rooms && !rooms.length && <p style={{ color: 'var(--text-muted)' }}>No rooms found.</p>}
              {rooms && rooms.map(r => (
                <div className="room-manage-card" key={r.id}>
                  <div className="room-manage-img">
                    {r.room_image ? <img src={uploadUrl(r.room_image)} alt="Room" /> : <div className="no-img"><i className="fas fa-building"></i></div>}
                  </div>
                  <div className="room-manage-body">
                    <h4>{r.hostel_name} — Room {r.room_no}</h4>
                    <div className="room-manage-meta">
                      <span><i className="fas fa-users"></i> Cap: {r.capacity}</span>
                      <span><i className="fas fa-door-open"></i> Avail: {r.available_spaces}</span>
                      <Badge cls={r.status === 'Available' ? 'approved' : 'rejected'}>{r.status}</Badge>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>{r.description || 'No description.'}</p>
                    <div className="room-manage-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => openEditRoomModal(r)}><i className="fas fa-edit"></i></button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteRoom(r.id)}><i className="fas fa-trash"></i></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ======== ADD ROOM MODAL ======== */}
      <div className={`modal-overlay${modal ? ' active' : ''}`} id="addRoomModal" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal">
          <div className="modal-header">
            <h3 id="roomModalTitle">{modal?.mode === 'edit'
              ? <><i className="fas fa-edit"></i> Edit Room</>
              : <><i className="fas fa-building"></i> Add New Room</>}</h3>
            <button className="modal-close" onClick={closeModal}><i className="fas fa-times"></i></button>
          </div>
          <div className="modal-body">
            <div id="roomModalAlert"><Msg a={alert} /></div>
            <div className="form-row">
              <div className="form-group full">
                <label>Hostel *</label>
                <select className="form-control" id="roomHostel" value={form.hostel_name} onChange={set('hostel_name')}>
                  <option value="">Select Hostel</option>
                  {HOSTELS.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Room No *</label><input type="text" className="form-control" id="roomNo" placeholder="e.g. 101" value={form.room_no} onChange={set('room_no')} /></div>
              <div className="form-group"><label>Capacity *</label><input type="number" className="form-control" id="roomCapacity" min="1" max="10" value={form.capacity} onChange={set('capacity')} /></div>
              <div className="form-group full"><label>Description</label><textarea className="form-control" id="roomDesc" rows="2" placeholder="Room description..." value={form.description} onChange={set('description')}></textarea></div>
              <div className="form-group full"><label>Room Image</label><input type="file" className="form-control" id="roomImage" accept="image/*" ref={imgRef} key={modal ? 'open' : 'closed'} /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={saveRoom}><i className="fas fa-save"></i> Save Room</button>
          </div>
        </div>
      </div>
    </>
  );
}
