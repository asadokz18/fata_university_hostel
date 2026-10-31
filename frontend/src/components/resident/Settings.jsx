// #sec-settings (profile management, password, account info)
import { useEffect, useState } from 'react';
import { api, toFormData } from '../../api';
import PasswordInput from '../PasswordInput';

const SEMESTERS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(s => `${s} Semester`);
const pwdStyle = { paddingLeft: 16, paddingRight: 44 };

const Msg = ({ a }) => (a ? <div className={`alert alert-${a.type}`}>{a.msg}</div> : null);

export default function Settings({ faculty, notify, onPhotoUpdated }) {
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [semester, setSemester] = useState('');
  const [settingsAlert, setSettingsAlert] = useState(null);

  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [conf, setConf] = useState('');
  const [pwdAlert, setPwdAlert] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await api.get('/user/profile');
      if (!data.success) return;
      const p = data.profile || data.user;
      if (!p) return;
      setPhone(p.phone || '');
      setAddress(p.home_address || '');
      setEmail(p.email || '');
      if (!faculty) setSemester(p.semester || '');
    })();
  }, [faculty]);

  const uploadProfilePhoto = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const fields = { phone, home_address: address };
    if (!faculty) fields.semester = semester;
    const fd = toFormData(fields);
    fd.append('profile_photo', file);
    const data = await api.put('/user/profile', fd);
    if (faculty) notify(data.message, data.success ? 'success' : 'danger');
    else setSettingsAlert({ type: data.success ? 'success' : 'danger', msg: data.success ? 'Photo updated!' : data.message });
    if (data.success) onPhotoUpdated();
    e.target.value = '';
  };

  const updateSettings = async () => {
    const fields = faculty
      ? { phone: phone.trim(), home_address: address.trim() }
      : { phone, home_address: address, semester };
    const data = await api.put('/user/profile', toFormData(fields));
    setSettingsAlert({ type: data.success ? 'success' : 'danger', msg: data.message });
  };

  const updatePassword = async () => {
    if (nw !== conf) { setPwdAlert({ type: 'warning', msg: 'Passwords do not match.' }); return; }
    const data = await api.post('/auth/update-password', { current_password: cur, new_password: nw, confirm_password: conf });
    setPwdAlert({ type: data.success ? 'success' : 'danger', msg: data.message });
    if (data.success) { setCur(''); setNw(''); setConf(''); }
  };

  const updateAccountInfo = async () => {
    const t = faculty ? v => v.trim() : v => v;
    const data = await api.put('/user/settings', { email: t(email), phone: t(phone), home_address: t(address) });
    setSettingsAlert({ type: data.success ? 'success' : 'danger', msg: data.message });
  };

  return (
    <div id="sec-settings">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>

        {/* Profile Management Card */}
        <div className="dashboard-card" style={{ flex: '1 1 350px', margin: 0 }}>
          <div className="dashboard-card-header">
            <h3><i className="fas fa-user-cog"></i> Profile Management</h3>
          </div>
          <div className="dashboard-card-body">
            <div id="settingsAlert"><Msg a={settingsAlert} /></div>
            <div style={{ background: 'var(--light-gray)', borderRadius: 10, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>Profile Picture</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Change your public photo</p>
              </div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--primary)', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }} htmlFor="settingsPhoto">
                <i className="fas fa-camera"></i> Upload
              </label>
              <input type="file" id="settingsPhoto" accept="image/*" style={{ display: 'none' }} onChange={uploadProfilePhoto} />
            </div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 12 }}>Contact Information</h4>
            <div className="form-group"><label>Phone Number</label><input type="tel" className="form-control" id="settingsPhone" placeholder="03XX-XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div className="form-group"><label>Residential Address</label><textarea className="form-control" id="settingsAddress" rows="2" value={address} onChange={e => setAddress(e.target.value)}></textarea></div>
            {!faculty && (
              <div className="form-group">
                <label>Semester</label>
                <select className="form-control" id="settingsSemester" value={semester} onChange={e => setSemester(e.target.value)}>
                  <option value="">Select Semester</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <button className="btn btn-primary btn-block" onClick={updateSettings}><i className="fas fa-save"></i> Update Profile Details</button>
          </div>
        </div>

        {/* Security & Password Card */}
        <div className="dashboard-card" style={{ flex: '1 1 350px', margin: 0 }}>
          <div className="dashboard-card-header">
            <h3><i className="fas fa-shield-alt"></i> Security &amp; Account</h3>
          </div>
          <div className="dashboard-card-body">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-lock"></i> Update Password
            </h4>
            <div id="passwordAlert"><Msg a={pwdAlert} /></div>
            <div className="form-group">
              <label>Current Password</label>
              <PasswordInput id="currentPwd" placeholder="Current password" style={pwdStyle} value={cur} onChange={e => setCur(e.target.value)} />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <PasswordInput id="newPwd" placeholder="New password" style={pwdStyle} value={nw} onChange={e => setNw(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <PasswordInput id="confirmPwd" placeholder="Confirm new password" style={pwdStyle} value={conf} onChange={e => setConf(e.target.value)} />
            </div>
            <button className="btn btn-outline btn-block" onClick={updatePassword}><i className="fas fa-key"></i> Save Password</button>

            <hr style={{ margin: '24px 0', borderColor: '#f0f0f0' }} />

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-envelope"></i> Account Information
            </h4>
            <div className="form-group"><label>Email Address</label><input type="email" className="form-control" id="settingsEmail" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <button className="btn btn-outline btn-block" onClick={updateAccountInfo}><i className="fas fa-save"></i> Update Info</button>
          </div>
        </div>

      </div>
    </div>
  );
}
