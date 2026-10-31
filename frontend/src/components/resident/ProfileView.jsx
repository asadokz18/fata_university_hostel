// #sec-profile
import { useEffect, useState } from 'react';
import { api, uploadUrl } from '../../api';
import { initialsOf } from '../../helpers';

export default function ProfileView({ faculty }) {
  const [p, setP] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await api.get('/user/profile');
      if (!data.success) return;
      setP(data.profile || data.user);
    })();
  }, []);

  const fields = !p ? [] : faculty ? [
    ['Full Name', p.full_name], ['Father Name', p.father_name], ['Email', p.email], ['Phone', p.phone],
    ['Gender', p.gender], ['Designation', p.designation], ['Department', p.department],
    ['Employee ID', p.employee_id], ['Qualification', p.qualification], ['Home Address', p.home_address],
    ['Date of Birth', p.dob]
  ] : [
    ['Full Name', p.full_name], ['Father Name', p.father_name], ['Email', p.email], ['Phone', p.phone],
    ['Gender', p.gender], ['Department', p.department], ['Semester', p.semester],
    ['Reg. No', p.registration_no || p.employee_id], ['Home Address', p.home_address]
  ];

  const roleName = faculty ? 'Faculty' : 'Student';
  const initial = p ? (faculty ? (p.full_name || 'F')[0].toUpperCase() : initialsOf(p.full_name)) : roleName[0];

  return (
    <div id="sec-profile">
      <div className="profile-section">
        <div className="profile-header-area" id="profileHeaderArea">
          <div className="profile-photo-large" id="profilePhotoDisplay">
            {p && p.profile_photo
              ? <img src={uploadUrl(p.profile_photo)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="" />
              : initial}
          </div>
          <div className="profile-info">
            <h3 id="profileNameDisplay">{p ? (p.full_name || '—') : roleName}</h3>
            <span className="role-tag">{roleName}</span>
          </div>
        </div>
        <div className="profile-detail-grid" id="profileDetails">
          {fields.map(([k, v]) => (
            <div className="profile-detail-item" key={k}><label>{k}</label><p>{v || '—'}</p></div>
          ))}
        </div>
      </div>
    </div>
  );
}
