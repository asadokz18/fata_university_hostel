// Shared implementation of student/dashboard.html and faculty/dashboard.html
// (the two original pages were the same page with a few role-specific differences,
//  all of which are controlled by the `faculty` prop)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Page from '../components/Page';
import LogoutModal from '../components/LogoutModal';
import AllNoticesModal from '../components/AllNoticesModal';
import { Toast, AccessDeniedToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { initialsOf, todayLong } from '../helpers';
import { uploadUrl } from '../api';

import Overview from '../components/resident/Overview';
import ProfileView from '../components/resident/ProfileView';
import MyRoom from '../components/resident/MyRoom';
import Applications from '../components/resident/Applications';
import Fees from '../components/resident/Fees';
import Complaints from '../components/resident/Complaints';
import Gallery from '../components/resident/Gallery';
import Settings from '../components/resident/Settings';

function ResidentContent({ faculty }) {
  const navigate = useNavigate();
  const { user, refresh, logout } = useAuth();
  const roleName = faculty ? 'Faculty' : 'Student';
  const base = faculty ? '/faculty' : '/student';

  const [section, setSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [hasRoom, setHasRoom] = useState(false);
  const [notices, setNotices] = useState([]);
  const [allNoticesOpen, setAllNoticesOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [denied, setDenied] = useState('');

  // student pages used alert(); the faculty page used toast messages
  const notify = (msg, type = 'success') => {
    if (faculty) setToast({ msg, type });
    else window.alert(msg);
  };

  const showSection = (id, e) => {
    if (e) e.preventDefault();
    setSection(id);
    if (window.innerWidth <= 992) setSidebarOpen(false);
  };

  // ID card / E-card links are blocked until a room has been assigned
  const goIdCard = e => {
    if (!hasRoom) {
      e.preventDefault();
      setDenied('You have not assigned room please wait for approval.');
    }
  };

  const showAllNotices = e => {
    if (e) e.preventDefault();
    if (!notices.length) { window.alert('No notices available.'); return; }
    setAllNoticesOpen(true);
  };

  const confirmLogout = async () => {
    await logout();
    navigate('/login');
  };

  const name = (user && user.user_name) || roleName;
  const initials = initialsOf(name);
  const firstName = name.split(' ')[0];
  const avatar = user && user.user_photo
    ? <img src={uploadUrl(user.user_photo)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="" />
    : null;

  const link = (id, icon, label) => (
    <a href="#" className={`sidebar-link${section === id ? ' active' : ''}`} onClick={e => showSection(id, e)}>
      <i className={`fas ${icon}`}></i> {label}
    </a>
  );

  return (
    <>
      <div className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`} id="sidebarOverlay" onClick={() => setSidebarOpen(o => !o)}></div>

      {/* ============ SIDEBAR ============ */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-avatar" id="sidebarAvatarImg">
            {avatar || <span id="sidebarInitials">{user ? initials : roleName[0]}</span>}
          </div>
          <div className="sidebar-name" id="sidebarName">{name}</div>
          <span className="sidebar-role">{roleName}</span>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          <Link to="/" className="sidebar-link"><i className="fas fa-home"></i> Home</Link>
          {link('overview', 'fa-th-large', 'Overview')}
          {link('profile', 'fa-user', 'My Profile')}
          {link('myroom', 'fa-door-open', 'My Room')}
          {link('applications', 'fa-file-alt', 'Applications')}
          {link('fees', 'fa-money-bill-wave', 'Fee Status')}
          {link('complaints', 'fa-exclamation-circle', 'Complaints')}
          {link('gallery', 'fa-images', 'Gallery')}
          {link('settings', 'fa-cog', 'Account Settings')}
          <Link to={`${base}/id-card`} className="sidebar-link" onClick={goIdCard}><i className="fas fa-id-card"></i> Download ID Card</Link>
          <Link to={`${base}/ecard`} className="sidebar-link" onClick={goIdCard}><i className="fas fa-mobile-alt"></i> View Digital E-Card</Link>
        </nav>
        <div className="sidebar-footer">
          <a href="#" className="logout-btn" onClick={e => { e.preventDefault(); setLogoutOpen(true); }}><i className="fas fa-sign-out-alt"></i> Logout</a>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <button className="hamburger-toggle" onClick={() => setSidebarOpen(o => !o)}><i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`} id="hamIcon"></i></button>
            <div>
              <div className="topbar-welcome" id="topbarWelcome">Welcome, {user ? firstName : roleName}! <span className="wave">👋</span></div>
              <div className="topbar-date" id="topbarDate">{todayLong()}</div>
            </div>
          </div>
          <div className="topbar-right">
            <Link to={`${base}/id-card`} className="id-card-btn" onClick={goIdCard} title="Download ID Card">
              <i className="fas fa-id-card"></i> <span>Download ID Card</span>
            </Link>
            <Link
              to={`${base}/ecard`} className="id-card-btn" onClick={goIdCard}
              title="View Digital E-Card"
              style={{ background: faculty ? '#d97706' : '#10b981', borderColor: faculty ? '#d97706' : '#10b981' }}
            >
              <i className="fas fa-mobile-alt"></i> <span>View E-Card</span>
            </Link>
            <div className="user-chip" onClick={() => showSection('profile')}>
              <div className="user-chip-avatar" id="userChipAvatar">{avatar || (user ? initials : roleName[0])}</div>
              <span className="user-chip-name" id="userChipName">{name}</span>
            </div>
          </div>
        </div>

        <div className="page-content">
          {/* The overview is loaded once (like the original) and only hidden when another tab is open */}
          <div style={{ display: section === 'overview' ? 'block' : 'none' }}>
            <Overview
              faculty={faculty} base={base} go={id => showSection(id)} goIdCard={goIdCard}
              hasRoom={hasRoom} setHasRoom={setHasRoom} setNotices={setNotices} showAllNotices={showAllNotices}
            />
          </div>
          {section === 'profile' && <ProfileView faculty={faculty} />}
          {section === 'myroom' && <MyRoom faculty={faculty} go={id => showSection(id)} notify={notify} />}
          {section === 'applications' && <Applications faculty={faculty} notify={notify} />}
          {section === 'fees' && <Fees faculty={faculty} />}
          {section === 'complaints' && <Complaints faculty={faculty} />}
          {section === 'gallery' && <Gallery faculty={faculty} />}
          {section === 'settings' && <Settings faculty={faculty} notify={notify} onPhotoUpdated={refresh} />}
        </div>
      </div>

      {allNoticesOpen && <AllNoticesModal notices={notices} faculty={faculty} onClose={() => setAllNoticesOpen(false)} />}
      <Toast toast={toast} onDone={() => setToast(null)} />
      <AccessDeniedToast msg={denied} onDone={() => setDenied('')} />
      <LogoutModal
        open={logoutOpen}
        text="Are you sure you want to log out of your dashboard?"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}

export default function ResidentDashboard({ faculty }) {
  return (
    <Page
      styles={['style.css', faculty ? 'faculty_dashboard.css' : 'student_dashboard.css']}
      title={`${faculty ? 'Faculty' : 'Student'} Dashboard — FATA University Hostel`}
    >
      <ResidentContent faculty={faculty} />
    </Page>
  );
}
