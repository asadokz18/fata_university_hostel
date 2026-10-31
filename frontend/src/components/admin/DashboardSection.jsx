// #sec-dashboard
import { Badge, genderBadge, roleBadge } from './common';

export default function DashboardSection({ stats, recentStudents, recentApps, go }) {
  const link = (sec, e) => { e.preventDefault(); go(sec); };
  return (
    <div id="sec-dashboard">
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon"><i className="fas fa-user-graduate"></i></div>
          <div className="stat-value" id="statStudents">{stats ? parseInt(stats.students) + parseInt(stats.faculty) : 0}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon"><i className="fas fa-building"></i></div>
          <div className="stat-value" id="statRooms">{stats ? stats.rooms : 0}</div>
          <div className="stat-label">Total Rooms</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><i className="fas fa-money-bill-wave"></i></div>
          <div className="stat-value" id="statFees">{stats ? 'Rs. ' + stats.fees_collected : 'Rs. 0'}</div>
          <div className="stat-label">Fee Collected</div>
        </div>
        <div className="stat-card teal">
          <div className="stat-icon"><i className="fas fa-door-open"></i></div>
          <div className="stat-value" id="statAvail">{stats ? stats.available_rooms : 0}</div>
          <div className="stat-label">Available Rooms</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><i className="fas fa-exclamation-circle"></i></div>
          <div className="stat-value" id="statComplaints">{stats ? stats.complaints : 0}</div>
          <div className="stat-label">Pending Complaints</div>
        </div>
      </div>

      <div className="quick-actions">
        <a href="#" className="quick-btn primary" onClick={e => link('students', e)}><i className="fas fa-users"></i> View Students</a>
        <a href="#" className="quick-btn blue" onClick={e => link('rooms', e)}><i className="fas fa-building"></i> Manage Rooms</a>
        <a href="#" className="quick-btn orange" onClick={e => link('applications', e)}><i className="fas fa-file-alt"></i> Applications</a>
        <a href="#" className="quick-btn teal" onClick={e => link('complaints', e)}><i className="fas fa-exclamation-circle"></i> Complaints</a>
        <a href="#" className="quick-btn" style={{ background: '#198754', color: '#fff' }} onClick={e => link('notices', e)}><i className="fas fa-bullhorn"></i> Post Notice</a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="content-card">
          <div className="content-card-header">
            <h3><i className="fas fa-users"></i> Recent Students</h3>
            <a href="#" onClick={e => link('students', e)}>View All</a>
          </div>
          <div className="content-card-body" id="recentStudents">
            {recentStudents === null && <div className="spinner"></div>}
            {recentStudents && recentStudents.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No students registered yet.</p>}
            {recentStudents && recentStudents.length > 0 && (
              <div className="table-responsive"><table className="data-table">
                <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Gender</th></tr></thead>
                <tbody>{recentStudents.map((s, i) => (
                  <tr key={s.id}><td>{i + 1}</td><td>{s.full_name}</td><td>{s.email}</td><td>{s.phone}</td><td><Badge cls={genderBadge(s.gender)}>{s.gender}</Badge></td></tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        </div>
        <div className="content-card">
          <div className="content-card-header">
            <h3><i className="fas fa-file-alt"></i> Recent Applications</h3>
            <a href="#" onClick={e => link('applications', e)}>View All</a>
          </div>
          <div className="content-card-body" id="recentApplications">
            {recentApps === null && <div className="spinner"></div>}
            {recentApps && recentApps.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No applications yet.</p>}
            {recentApps && recentApps.length > 0 && (
              <div className="table-responsive"><table className="data-table">
                <thead><tr><th>Date</th><th>User</th><th>Role</th><th>Hostel — Room</th><th>Status</th></tr></thead>
                <tbody>{recentApps.map(a => (
                  <tr key={a.id}>
                    <td>{new Date(a.applied_at).toLocaleDateString()}</td>
                    <td>{a.user_name || '—'}</td>
                    <td><Badge cls={roleBadge(a.user_role)}>{a.user_role}</Badge></td>
                    <td>{a.hostel_name} — Room {a.room_no}</td>
                    <td><Badge cls={a.status.toLowerCase()}>{a.status}</Badge></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
