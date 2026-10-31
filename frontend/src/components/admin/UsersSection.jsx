// #sec-students (Students & Faculty Management with Room Assignments)
import { useEffect, useState } from 'react';
import { api, uploadUrl } from '../../api';
import { openTableReport } from '../../helpers';
import { Badge, Loading, NoData, genderBadge, roleBadge } from './common';

export default function UsersSection({ refreshDashboard }) {
  const [role, setRole] = useState('student');
  const [roomFilter, setRoomFilter] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsers = async (r = role) => {
    setUsers(null);
    const data = await api.get(`/admin/users?role=${r}`);
    setUsers(data.users || []);
  };

  useEffect(() => {
    loadUsers(role);
    /* eslint-disable-next-line */
  }, [role]);

  const deleteUser = async (id, userRole) => {
    if (!window.confirm('Delete this user permanently? This will also remove their applications and free any assigned room.')) return;
    const targetRole = (userRole || role).toLowerCase();
    const data = await api.del(`/admin/users/${targetRole}/${id}`);
    if (data.success) {
      loadUsers();
      if (refreshDashboard) refreshDashboard();
      if (selectedUser?.id === id) setSelectedUser(null);
    } else {
      window.alert(data.message);
    }
  };

  const q = search.trim().toLowerCase();
  const shown = (users || []).filter(u => {
    const matchesSearch =
      !q ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.cnic || '').toLowerCase().includes(q) ||
      (u.registration_no || '').toLowerCase().includes(q) ||
      (u.employee_id || '').toLowerCase().includes(q) ||
      (u.assigned_room || '').toLowerCase().includes(q);

    const matchesRoom =
      !roomFilter ||
      (roomFilter === 'assigned' && !!u.assigned_room) ||
      (roomFilter === 'unassigned' && !u.assigned_room);

    return matchesSearch && matchesRoom;
  });

  const downloadReport = () => {
    if (!shown.length) {
      window.alert('No records available to download.');
      return;
    }
    const roleLabel =
      role === 'faculty'
        ? 'Faculty Members'
        : role === 'all'
        ? 'All Residents (Students & Faculty)'
        : 'Students';

    openTableReport({
      title: `${roleLabel} & Room Allocation Report`,
      headerLines: [
        `Hostel Resident Directory & Room Assignment Report | Generated: ${new Date().toLocaleDateString()}`,
        `Category: ${roleLabel} | Filter: ${roomFilter ? (roomFilter === 'assigned' ? 'Assigned Rooms Only' : 'Unassigned Only') : 'All'} | Total Listed: ${shown.length}`
      ],
      columns: [
        '#',
        'Name',
        'Role',
        'Reg / Emp ID',
        'CNIC',
        'Department',
        'Assigned Room & Hostel',
        'Phone',
        'Email',
        'Joined'
      ],
      rows: shown.map((u, i) => [
        i + 1,
        u.full_name,
        u.user_role || (role === 'faculty' ? 'Faculty' : 'Student'),
        u.registration_no || u.employee_id || '—',
        u.cnic || '—',
        u.department + (u.semester ? ` (${u.semester})` : u.designation ? ` (${u.designation})` : ''),
        u.assigned_room || 'Not Assigned',
        u.phone,
        u.email,
        new Date(u.created_at || u.joining_date).toLocaleDateString()
      ])
    });
  };

  const printSingleUser = u => {
    const userRole = u.user_role || (role === 'faculty' ? 'Faculty' : 'Student');
    openTableReport({
      title: `Resident Details — ${u.full_name}`,
      headerLines: [
        `Official FATA University Hostel Resident Dossier | Generated: ${new Date().toLocaleDateString()}`
      ],
      columns: ['Information Field', 'Details'],
      rows: [
        ['Full Name', u.full_name],
        ['Role', userRole],
        ['Assigned Room', u.assigned_room || 'Not Assigned'],
        ['Father Name', u.father_name || '—'],
        ['CNIC Number', u.cnic || '—'],
        ['Registration / Employee ID', u.registration_no || u.employee_id || '—'],
        ['Department', u.department || '—'],
        ['Semester / Designation', u.semester || u.designation || '—'],
        ['Qualification', u.qualification || '—'],
        ['Phone Number', u.phone || '—'],
        ['Email Address', u.email || '—'],
        ['Gender', u.gender || '—'],
        ['Date of Birth', u.dob || '—'],
        ['Home Address', u.home_address || '—'],
        ['Account Status', u.status || 'Active'],
        ['Registration Date', new Date(u.created_at || u.joining_date).toLocaleDateString()]
      ]
    });
  };

  return (
    <div id="sec-students">
      <div className="content-card">
        <div className="content-card-header">
          <h3>
            <i className="fas fa-users"></i> Registered Users &amp; Room Allocations
          </h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              className="form-control"
              id="userTypeFilter"
              value={role}
              onChange={e => {
                setRole(e.target.value);
                setSearch('');
              }}
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.88rem' }}
            >
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
              <option value="all">All (Students &amp; Faculty)</option>
            </select>
            <button className="quick-btn secondary" onClick={downloadReport}>
              <i className="fas fa-file-pdf"></i> Download Report
            </button>
          </div>
        </div>

        <div className="content-card-body">
          <div className="filter-bar">
            <input
              type="text"
              id="userSearch"
              placeholder="Search by name, email, phone, room, or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="form-control"
              id="userRoomFilter"
              value={roomFilter}
              onChange={e => setRoomFilter(e.target.value)}
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.88rem' }}
            >
              <option value="">All Allocation Status</option>
              <option value="assigned">Assigned Room Only</option>
              <option value="unassigned">Unassigned Only</option>
            </select>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Assigned Room</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="usersTableBody">
                {users === null && <Loading cols={8} />}
                {users !== null && !shown.length && <NoData cols={8}>No matching users found.</NoData>}
                {shown.map((u, i) => (
                  <tr key={u.id}>
                    <td>{i + 1}</td>
                    <td>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          overflow: 'hidden'
                        }}
                      >
                        {u.profile_photo ? (
                          <img
                            src={uploadUrl(u.profile_photo)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            alt=""
                            onError={e => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.parentElement) {
                                e.currentTarget.parentElement.innerText = (u.full_name || 'U')[0].toUpperCase();
                              }
                            }}
                          />
                        ) : (
                          (u.full_name || 'U')[0].toUpperCase()
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td>
                      <Badge cls={roleBadge(u.user_role || (role === 'faculty' ? 'Faculty' : 'Student'))}>
                        {u.user_role || (role === 'faculty' ? 'Faculty' : 'Student')}
                      </Badge>
                    </td>
                    <td>
                      {u.assigned_room ? (
                        <span
                          className="badge-status badge-approved"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            whiteSpace: 'nowrap',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            padding: '4px 9px'
                          }}
                        >
                          <i className="fas fa-bed"></i> {u.assigned_room}
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            color: '#842029',
                            background: '#f8d7da',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}
                        >
                          <i className="fas fa-minus-circle"></i> Not Assigned
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.84rem' }}>{u.phone}</td>
                    <td style={{ fontSize: '0.84rem' }}>
                      {u.department || '—'}
                      {u.semester && <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}> ({u.semester})</span>}
                      {u.designation && <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}> ({u.designation})</span>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'var(--primary)', color: '#fff', marginRight: 6 }}
                        onClick={() => setSelectedUser(u)}
                        title="View Full Details"
                      >
                        <i className="fas fa-eye"></i> Details
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteUser(u.id, u.user_role)}
                        title="Delete User"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay active" onClick={() => setSelectedUser(null)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-id-card" style={{ color: 'var(--primary)' }}></i>
                Resident Full Details
              </h3>
              <button className="modal-close" onClick={() => setSelectedUser(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              {/* Header Profile Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  background: 'linear-gradient(135deg, rgba(50, 106, 51, 0.08), rgba(30, 69, 32, 0.04))',
                  borderRadius: 12,
                  marginBottom: 18
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.5rem',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  {selectedUser.profile_photo ? (
                    <img
                      src={uploadUrl(selectedUser.profile_photo)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt=""
                    />
                  ) : (
                    (selectedUser.full_name || 'U')[0].toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 700 }}>
                    {selectedUser.full_name}
                  </h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge cls={roleBadge(selectedUser.user_role || (role === 'faculty' ? 'Faculty' : 'Student'))}>
                      {selectedUser.user_role || (role === 'faculty' ? 'Faculty' : 'Student')}
                    </Badge>
                    <Badge cls={genderBadge(selectedUser.gender)}>{selectedUser.gender}</Badge>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Joined: {new Date(selectedUser.created_at || selectedUser.joining_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned Room Highlight Box */}
              <div
                style={{
                  background: selectedUser.assigned_room ? '#d1e7dd' : '#f8d7da',
                  border: `1.5px solid ${selectedUser.assigned_room ? '#a3cfbb' : '#f5c2c7'}`,
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: selectedUser.assigned_room ? '#0f5132' : '#842029',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0
                  }}
                >
                  <i className={selectedUser.assigned_room ? 'fas fa-bed' : 'fas fa-door-closed'}></i>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: selectedUser.assigned_room ? '#0f5132' : '#842029' }}>
                    Assigned Hostel &amp; Room
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: selectedUser.assigned_room ? '#0a3622' : '#58151c' }}>
                    {selectedUser.assigned_room ? selectedUser.assigned_room : 'No room currently assigned'}
                  </div>
                  {selectedUser.room_details?.duration && (
                    <div style={{ fontSize: '0.78rem', color: '#0f5132', marginTop: 2 }}>
                      Duration: {selectedUser.room_details.duration}
                    </div>
                  )}
                </div>
              </div>

              {/* 2-Column Info Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px 16px',
                  fontSize: '0.88rem'
                }}
              >
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                    FATHER NAME
                  </label>
                  <div style={{ fontWeight: 600 }}>{selectedUser.father_name || '—'}</div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                    CNIC NUMBER
                  </label>
                  <div style={{ fontWeight: 600 }}>{selectedUser.cnic || '—'}</div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                    {selectedUser.employee_id ? 'EMPLOYEE ID' : 'REGISTRATION NO'}
                  </label>
                  <div style={{ fontWeight: 600 }}>
                    {selectedUser.registration_no || selectedUser.employee_id || '—'}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                    DEPARTMENT
                  </label>
                  <div style={{ fontWeight: 600 }}>{selectedUser.department || '—'}</div>
                </div>

                {selectedUser.semester && (
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                      SEMESTER
                    </label>
                    <div style={{ fontWeight: 600 }}>{selectedUser.semester}</div>
                  </div>
                )}

                {selectedUser.designation && (
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                      DESIGNATION
                    </label>
                    <div style={{ fontWeight: 600 }}>{selectedUser.designation}</div>
                  </div>
                )}

                {selectedUser.qualification && (
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                      QUALIFICATION
                    </label>
                    <div style={{ fontWeight: 600 }}>{selectedUser.qualification}</div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                    PHONE NUMBER
                  </label>
                  <div style={{ fontWeight: 600 }}>{selectedUser.phone || '—'}</div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                    EMAIL ADDRESS
                  </label>
                  <div style={{ fontWeight: 600, wordBreak: 'break-all' }}>{selectedUser.email || '—'}</div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                    DATE OF BIRTH
                  </label>
                  <div style={{ fontWeight: 600 }}>{selectedUser.dob || '—'}</div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                    HOME ADDRESS
                  </label>
                  <div style={{ fontWeight: 600 }}>{selectedUser.home_address || '—'}</div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => deleteUser(selectedUser.id, selectedUser.user_role)}
              >
                <i className="fas fa-trash"></i> Delete User
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => printSingleUser(selectedUser)}
                >
                  <i className="fas fa-print"></i> Print Details
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedUser(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
