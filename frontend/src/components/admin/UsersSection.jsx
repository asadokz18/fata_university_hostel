// #sec-students (Students & Faculty)
import { useEffect, useState } from 'react';
import { api, uploadUrl } from '../../api';
import { Badge, Loading, NoData, genderBadge } from './common';

export default function UsersSection() {
  const [role, setRole] = useState('student');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState(null);

  const loadUsers = async (r = role) => {
    setUsers(null);
    const data = await api.get(`/admin/users?role=${r}`);
    setUsers(data.users || []);
  };

  useEffect(() => { loadUsers(role); /* eslint-disable-next-line */ }, [role]);

  const deleteUser = async id => {
    if (!window.confirm('Delete this user permanently?')) return;
    const data = await api.del(`/admin/users/${role}/${id}`);
    if (data.success) loadUsers();
    else window.alert(data.message);
  };

  const q = search.toLowerCase();
  const shown = (users || []).filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));

  return (
    <div id="sec-students">
      <div className="content-card">
        <div className="content-card-header">
          <h3><i className="fas fa-users"></i> Registered Users</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="form-control" id="userTypeFilter" value={role} onChange={e => { setRole(e.target.value); setSearch(''); }} style={{ width: 'auto', padding: '8px 12px', fontSize: '0.88rem' }}>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
        </div>
        <div className="content-card-body">
          <div className="filter-bar">
            <input type="text" id="userSearch" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Photo</th><th>Name</th><th>Email</th><th>Phone</th><th>Gender</th><th>Joined</th><th>Action</th></tr>
              </thead>
              <tbody id="usersTableBody">
                {users === null && <Loading cols={8} />}
                {users !== null && !shown.length && <NoData cols={8}>No users found.</NoData>}
                {shown.map((u, i) => (
                  <tr key={u.id}>
                    <td>{i + 1}</td>
                    <td>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', overflow: 'hidden' }}>
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
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td><Badge cls={genderBadge(u.gender)}>{u.gender}</Badge></td>
                    <td>{new Date(u.created_at || u.joining_date).toLocaleDateString()}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}><i className="fas fa-trash"></i></button></td>
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
