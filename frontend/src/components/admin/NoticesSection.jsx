// #sec-notices
import { useEffect, useState } from 'react';
import { api } from '../../api';
import { Badge, Loading, Msg, NoData } from './common';

export default function NoticesSection() {
  const [notices, setNotices] = useState(null);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState({ title: '', message: '', priority: 'Normal', target_audience: 'All', expiry_date: '' });

  const loadNoticesAdmin = async () => {
    setNotices(null);
    const data = await api.get('/admin/notices');
    setNotices(data.notices || []);
  };

  useEffect(() => { loadNoticesAdmin(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const postNotice = async () => {
    const data = await api.post('/admin/notices', form);
    setAlert({ type: data.success ? 'success' : 'danger', msg: data.message });
    if (data.success) {
      setForm(f => ({ ...f, title: '', message: '' }));
      loadNoticesAdmin();
    }
  };

  const deleteNotice = async id => {
    await api.del(`/admin/notices/${id}`);
    loadNoticesAdmin();
  };

  return (
    <div id="sec-notices">
      <div className="content-card" style={{ marginBottom: 20 }}>
        <div className="content-card-header"><h3><i className="fas fa-bullhorn"></i> Post a Notice</h3></div>
        <div className="content-card-body">
          <div id="noticeAlert"><Msg a={alert} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group"><label>Title *</label><input type="text" className="form-control" id="noticeTitle" placeholder="Notice title" value={form.title} onChange={set('title')} /></div>
            <div className="form-group"><label>Priority</label>
              <select className="form-control" id="noticePriority" value={form.priority} onChange={set('priority')}>
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group"><label>Target Audience</label>
              <select className="form-control" id="noticeAudience" value={form.target_audience} onChange={set('target_audience')}>
                <option value="All">All</option>
                <option value="Students">Students Only</option>
                <option value="Faculty">Faculty Only</option>
              </select>
            </div>
            <div className="form-group"><label>Expiry Date (optional)</label><input type="date" className="form-control" id="noticeExpiry" value={form.expiry_date} onChange={set('expiry_date')} /></div>
            <div className="form-group full-width" style={{ gridColumn: '1/-1' }}><label>Message *</label><textarea className="form-control" id="noticeMessage" rows="3" placeholder="Notice message..." value={form.message} onChange={set('message')}></textarea></div>
          </div>
          <button className="btn btn-primary" onClick={postNotice}><i className="fas fa-paper-plane"></i> Post Notice</button>
        </div>
      </div>
      <div className="content-card">
        <div className="content-card-header"><h3><i className="fas fa-list"></i> All Notices</h3></div>
        <div className="content-card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Title</th><th>Priority</th><th>Audience</th><th>Expiry</th><th>Status</th><th>Action</th></tr></thead>
              <tbody id="noticesBody">
                {notices === null && <Loading cols={6} />}
                {notices && !notices.length && <NoData cols={6}>No notices.</NoData>}
                {notices && notices.map(n => (
                  <tr key={n.id}>
                    <td>{n.title}</td>
                    <td><Badge cls={n.priority.toLowerCase()}>{n.priority}</Badge></td>
                    <td>{n.target_audience}</td>
                    <td>{n.expiry_date || 'No expiry'}</td>
                    <td><Badge cls={n.status === 'Active' ? 'approved' : 'rejected'}>{n.status}</Badge></td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => deleteNotice(n.id)}><i className="fas fa-trash"></i></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
