// #sec-applications
import { useEffect, useState } from 'react';
import { api } from '../../api';
import { Badge, Loading, NoData, roleBadge } from './common';

export default function ApplicationsSection({ confirm, refreshDashboard }) {
  const [status, setStatus] = useState('');
  const [apps, setApps] = useState(null);

  const loadApplications = async (s = status) => {
    setApps(null);
    const data = await api.get(`/admin/applications${s ? '?status=' + s : ''}`);
    setApps(data.applications || []);
  };

  useEffect(() => { loadApplications(status); /* eslint-disable-next-line */ }, [status]);

  const updateApp = (id, newStatus) => {
    const actionText = newStatus === 'Approved' ? 'approve' : 'reject';
    confirm(`Confirm ${newStatus}`, `Are you sure you want to ${actionText} this application?`, async () => {
      const data = await api.put(`/admin/applications/${id}`, { status: newStatus });
      if (data.success) { loadApplications(); refreshDashboard(); }
    });
  };

  return (
    <div id="sec-applications">
      <div className="content-card">
        <div className="content-card-header">
          <h3><i className="fas fa-file-alt"></i> Room Applications</h3>
          <select className="form-control" id="appStatusFilter" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 'auto', padding: '8px 12px', fontSize: '0.88rem' }}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="content-card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>User</th><th>Role</th><th>Type</th><th>Hostel — Room</th><th>Duration</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody id="applicationsBody">
                {apps === null && <Loading cols={8} />}
                {apps && !apps.length && <NoData cols={8}>No applications found.</NoData>}
                {apps && apps.map(a => (
                  <tr key={a.id}>
                    <td>{new Date(a.applied_at).toLocaleDateString()}</td>
                    <td>{a.user_name}</td>
                    <td><Badge cls={roleBadge(a.user_role)}>{a.user_role}</Badge></td>
                    <td>{a.application_type}</td>
                    <td>{a.hostel_name} — Room {a.room_no}</td>
                    <td>{a.booking_duration || '—'}</td>
                    <td><Badge cls={a.status.toLowerCase()}>{a.status}</Badge></td>
                    <td>
                      {a.status === 'Pending' ? (
                        <>
                          <button className="btn btn-sm" style={{ background: '#198754', color: '#fff', marginRight: 4 }} onClick={() => updateApp(a.id, 'Approved')}><i className="fas fa-check"></i></button>
                          <button className="btn btn-danger btn-sm" onClick={() => updateApp(a.id, 'Rejected')}><i className="fas fa-times"></i></button>
                        </>
                      ) : '—'}
                    </td>
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
