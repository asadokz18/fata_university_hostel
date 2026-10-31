// #sec-complaints
import { useEffect, useState } from 'react';
import { api } from '../../api';
import { formatDatePK, localDate } from '../../helpers';

export default function Complaints({ faculty }) {
  const [list, setList] = useState(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [alert, setAlert] = useState(null);
  const fmt = faculty ? formatDatePK : localDate;

  const load = async () => {
    setList(null);
    const data = await api.get('/user/my-complaints');
    setList(data.complaints || []);
  };

  useEffect(() => { load(); }, []);

  const submitComplaint = async () => {
    const t = title.trim();
    const d = desc.trim();
    if (!t || !d) {
      setAlert({ type: 'warning', icon: faculty, msg: faculty ? 'Please fill all fields.' : 'Fill all fields.' });
      return;
    }
    const data = await api.post('/user/complaints', { title: t, description: d });
    setAlert({ type: data.success ? 'success' : 'danger', msg: data.message });
    if (data.success) { setTitle(''); setDesc(''); load(); }
  };

  return (
    <div id="sec-complaints">
      <div className="dashboard-card" style={{ maxWidth: 700, marginBottom: 20 }}>
        <div className="dashboard-card-header">
          <h3><i className="fas fa-paper-plane"></i> Submit New Grievance</h3>
        </div>
        <div className="dashboard-card-body">
          <div id="complaintAlert">
            {alert && (
              <div className={`alert alert-${alert.type}`}>
                {alert.icon && <><i className="fas fa-exclamation-triangle"></i>{' '}</>}{alert.msg}
              </div>
            )}
          </div>
          <div className="form-group"><label>Subject / Title *</label><input type="text" className="form-control" id="complaintTitle" placeholder="Subject / Title" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="form-group"><label>Detailed Description *</label><textarea className="form-control" id="complaintDesc" rows="4" placeholder="Detailed description of the issue..." value={desc} onChange={e => setDesc(e.target.value)}></textarea></div>
          <button className="btn btn-orange" onClick={submitComplaint}><i className="fas fa-paper-plane"></i> Dispatch Complaint</button>
        </div>
      </div>
      <div className="dashboard-card" style={{ maxWidth: 700 }}>
        <div className="dashboard-card-header">
          <h3><i className="fas fa-archive"></i> Archived Complaints</h3>
        </div>
        <div className="dashboard-card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Subject</th><th>Resolution Status</th></tr></thead>
              <tbody id="myComplaintsBody">
                {list === null && (faculty
                  ? <tr><td colSpan="3" className="no-data"><div className="spinner"></div></td></tr>
                  : <tr><td colSpan="3" className="no-data">Inbox is empty.</td></tr>)}
                {list && !list.length && <tr><td colSpan="3" className="no-data">Inbox is empty.</td></tr>}
                {list && list.map(c => (
                  <tr key={c.id}>
                    <td>{fmt(c.submitted_at)}</td>
                    <td>
                      {faculty ? <strong>{c.title}</strong> : c.title}
                      {faculty && c.admin_response && <><br /><small style={{ color: 'var(--text-muted)' }}>Reply: {c.admin_response}</small></>}
                    </td>
                    <td><span className={`badge-status badge-${c.status === 'Resolved' ? 'approved' : c.status === 'Pending' ? 'pending' : 'important'}`}>{c.status}</span></td>
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
