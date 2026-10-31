// #sec-profile (Admin profile, Update password, SMTP configuration)
import { useEffect, useRef, useState } from 'react';
import { api, toFormData } from '../../api';
import { initialsOf } from '../../helpers';
import PasswordInput from '../PasswordInput';
import { Msg } from './common';

const pwdStyle = { paddingLeft: 16, paddingRight: 44 };

export default function ProfileSection({ success, onProfileUpdated }) {
  const [profile, setProfile] = useState({ username: '', full_name: '', email: '' });
  const [profileAlert, setProfileAlert] = useState(null);
  const photoRef = useRef(null);

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdAlert, setPwdAlert] = useState(null);

  const [smtp, setSmtp] = useState({ host: '', port: '', user: '', pass: '' });
  const [smtpAlert, setSmtpAlert] = useState(null);

  useEffect(() => {
    (async () => {
      const info = await api.get('/admin/info');
      if (info.success && info.admin) {
        setProfile({ username: info.admin.username || '', full_name: info.admin.full_name || '', email: info.admin.email || '' });
      }
      // Load SMTP Settings
      const s = await api.get('/settings/smtp');
      if (s.success && s.settings) {
        setSmtp({
          host: s.settings.smtp_host || '', port: s.settings.smtp_port || '',
          user: s.settings.smtp_user || '', pass: s.settings.smtp_pass || ''
        });
      }
    })();
  }, []);

  const saveSmtpSettings = async () => {
    const data = await api.post('/settings/smtp', {
      smtp_host: smtp.host, smtp_port: smtp.port, smtp_user: smtp.user, smtp_pass: smtp.pass
    });
    if (data.success) { success('Settings Saved!', data.message); setSmtpAlert(null); }
    else setSmtpAlert({ type: 'danger', msg: data.message === 'Connection error.' ? 'Connection error.' : data.message });
  };

  const updateAdminProfile = async () => {
    const fd = toFormData({ username: profile.username, full_name: profile.full_name, email: profile.email });
    const photo = photoRef.current?.files[0];
    if (photo) fd.append('profile_photo', photo);
    const data = await api.put('/admin/profile', fd);
    if (data.success) {
      success('Profile Updated', data.message);
      setProfileAlert(null);
      onProfileUpdated();
    } else {
      setProfileAlert({ type: 'danger', msg: data.message });
    }
  };

  const updateAdminPassword = async () => {
    if (!pwd.current || !pwd.next || !pwd.confirm) {
      setPwdAlert({ type: 'danger', msg: 'All password fields are required.' });
      return;
    }
    const data = await api.post('/auth/update-password', {
      current_password: pwd.current, new_password: pwd.next, confirm_password: pwd.confirm
    });
    if (data.success) {
      success('Password Updated', data.message);
      setPwdAlert(null);
      setPwd({ current: '', next: '', confirm: '' });
    } else {
      setPwdAlert({ type: 'danger', msg: data.message });
    }
  };

  const setP = k => e => setProfile(p => ({ ...p, [k]: e.target.value }));

  return (
    <div id="sec-profile">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>

        {/* Profile Card */}
        <div className="content-card" style={{ flex: '1 1 350px', margin: 0 }}>
          <div className="content-card-header"><h3><i className="fas fa-user-cog"></i> Admin Profile</h3></div>
          <div className="content-card-body">
            <div id="profileAlert"><Msg a={profileAlert} /></div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10 }}>Current Profile Photo</p>
              <div className="sidebar-avatar initials" id="profileAvatarBig" style={{ width: 80, height: 80, fontSize: '2rem', borderRadius: '50%', margin: 0 }}>{initialsOf(profile.full_name) || 'MA'}</div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Username</label><input type="text" className="form-control" id="profileUsername" value={profile.username} onChange={setP('username')} /></div>
              <div className="form-group"><label>Full Name *</label><input type="text" className="form-control" id="profileFullName" value={profile.full_name} onChange={setP('full_name')} /></div>
              <div className="form-group full"><label>Email *</label><input type="email" className="form-control" id="profileEmail" value={profile.email} onChange={setP('email')} /></div>
              <div className="form-group full"><label>Update Profile Photo</label><input type="file" className="form-control" id="profilePhoto" accept="image/*" ref={photoRef} /></div>
            </div>
            <button className="btn btn-primary" onClick={updateAdminProfile}><i className="fas fa-save"></i> Update Profile</button>
          </div>
        </div>

        {/* Update Password Card */}
        <div className="content-card" style={{ flex: '1 1 350px', margin: 0 }}>
          <div className="content-card-header"><h3><i className="fas fa-key"></i> Update Password</h3></div>
          <div className="content-card-body">
            <div id="passwordAlert"><Msg a={pwdAlert} /></div>
            <div className="form-row">
              <div className="form-group full">
                <label>Current Password</label>
                <PasswordInput id="adminCurrentPwd" placeholder="Current password" style={pwdStyle} value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <PasswordInput id="adminNewPwd" placeholder="New password" style={pwdStyle} value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <PasswordInput id="adminConfirmPwd" placeholder="Confirm new password" style={pwdStyle} value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-danger" onClick={updateAdminPassword}><i className="fas fa-key"></i> Update Password</button>
          </div>
        </div>

        {/* SMTP Configuration Card */}
        <div className="content-card" style={{ flex: '1 1 350px', margin: 0 }}>
          <div className="content-card-header"><h3><i className="fas fa-envelope"></i> SMTP Configuration</h3></div>
          <div className="content-card-body">
            <div id="smtpAlert"><Msg a={smtpAlert} /></div>
            <div className="form-row">
              <div className="form-group">
                <label>SMTP Host</label>
                <input type="text" className="form-control" id="smtpHost" placeholder="e.g. smtp.gmail.com" value={smtp.host} onChange={e => setSmtp(s => ({ ...s, host: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>SMTP Port</label>
                <input type="text" className="form-control" id="smtpPort" placeholder="e.g. 587" value={smtp.port} onChange={e => setSmtp(s => ({ ...s, port: e.target.value }))} />
              </div>
              <div className="form-group full">
                <label>Sender Email (Username)</label>
                <input type="email" className="form-control" id="smtpUser" placeholder="e.g. admin@example.com" value={smtp.user} onChange={e => setSmtp(s => ({ ...s, user: e.target.value }))} />
              </div>
              <div className="form-group full">
                <label>SMTP Password / App Password</label>
                <PasswordInput id="smtpPass" placeholder="App password" style={pwdStyle} value={smtp.pass} onChange={e => setSmtp(s => ({ ...s, pass: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={saveSmtpSettings}><i className="fas fa-save"></i> Save Email Setting</button>
          </div>
        </div>

      </div>
    </div>
  );
}
