// #sec-complaints
import { useEffect, useState } from 'react';
import { api } from '../../api';
import { Badge, Loading, NoData } from './common';

export default function ComplaintsSection({ confirm, refreshDashboard }) {
  const [complaints, setComplaints] = useState(null);

  const loadComplaints = async () => {
    setComplaints(null);
    const data = await api.get('/admin/complaints');
    setComplaints(data.complaints || []);
  };

  useEffect(() => { loadComplaints(); }, []);

  const resolveComplaint = id => {
    confirm('Resolve Complaint', 'Are you sure you want to mark this complaint as resolved?', async () => {
      await api.put(`/admin/complaints/${id}`, { status: 'Resolved' });
      loadComplaints(); refreshDashboard();
    });
  };

  return (
    <div id="sec-complaints">
      <div className="content-card">
        <div className="content-card-header">
          <h3><i className="fas fa-exclamation-circle"></i> Complaints</h3>
        </div>
        <div className="content-card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>User</th><th>Title</th><th>Description</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody id="complaintsBody">
                {complaints === null && <Loading cols={6} />}
                {complaints && !complaints.length && <NoData cols={6}>No complaints found.</NoData>}
                {complaints && complaints.map(c => (
                  <tr key={c.id}>
                    <td>{new Date(c.submitted_at).toLocaleDateString()}</td>
                    <td>{c.full_name || c.user_name}</td>
                    <td>{c.title}</td>
                    <td style={{ maxWidth: 200, whiteSpace: 'normal' }}>{c.description.substring(0, 80)}...</td>
                    <td><Badge cls={c.status === 'Resolved' ? 'approved' : c.status === 'Pending' ? 'pending' : 'important'}>{c.status}</Badge></td>
                    <td>
                      {c.status !== 'Resolved'
                        ? <button className="btn btn-sm" style={{ background: '#198754', color: '#fff' }} onClick={() => resolveComplaint(c.id)}><i className="fas fa-check"></i> Resolve</button>
                        : '✓ Resolved'}
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
