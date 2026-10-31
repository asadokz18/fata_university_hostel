// admin/dashboard.html + admin_dashboard.js
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Page from '../components/Page';
import LogoutModal from '../components/LogoutModal';
import { ConfirmModal, SuccessModal } from '../components/ConfirmModal';
import { api, uploadUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { initialsOf } from '../helpers';

import DashboardSection from '../components/admin/DashboardSection';
import UsersSection from '../components/admin/UsersSection';
import RoomsSection from '../components/admin/RoomsSection';
import ApplicationsSection from '../components/admin/ApplicationsSection';
import FeesSection from '../components/admin/FeesSection';
import ComplaintsSection from '../components/admin/ComplaintsSection';
import NoticesSection from '../components/admin/NoticesSection';
import GallerySection from '../components/admin/GallerySection';
import ProfileSection from '../components/admin/ProfileSection';

const TITLES = {
  dashboard: 'Admin Dashboard', students: 'Students & Faculty', rooms: 'Manage Rooms',
  applications: 'Room Applications', fees: 'Fee Management', complaints: 'Complaints',
  notices: 'Notices', gallery: 'Gallery Management', profile: 'Admin Profile'
};

function AdminContent() {
  const navigate = useNavigate();
  const { user, refresh, logout } = useAuth();

  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const [stats, setStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState(null);
  const [recentApps, setRecentApps] = useState(null);

  const [confirmState, setConfirmState] = useState(null);
  const [successState, setSuccessState] = useState(null);

  const confirm = (title, message, onConfirm) => setConfirmState({ title, message, onConfirm });
  const success = (title, message) => setSuccessState({ title, message });

  // ============ DASHBOARD ============
  const loadDashboard = useCallback(async () => {
    const res = await api.get('/admin/stats');
    if (res.success) setStats(res);
    const r2 = await api.get('/admin/recent-students');
    setRecentStudents(r2.success ? r2.students : []);
    const r3 = await api.get('/admin/recent-applications');
    setRecentApps(r3.success ? r3.applications : []);
  }, []);

  useEffect(() => {
    loadDashboard();
    // Auto-refresh stats every 60 seconds
    const id = setInterval(loadDashboard, 60000);
    return () => clearInterval(id);
  }, [loadDashboard]);

  // ============ SIDEBAR ============
  const toggleSidebar = () => setSidebarOpen(o => !o);

  const showSection = (id, e) => {
    if (e) e.preventDefault();
    setSection(id);
    if (window.innerWidth <= 900) setSidebarOpen(false);
  };

  const confirmLogout = async () => {
    await logout();
    navigate('/login');
  };

  const name = user ? user.user_name : 'Main Admin';
  const initials = user ? initialsOf(user.user_name) : 'MA';
  const avatar = user && user.user_photo
    ? <img src={uploadUrl(user.user_photo)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="Admin" />
    : null;

  const badge = (id, value) => (
    <span className="badge-count" id={id} style={{ display: !value || value == 0 ? 'none' : 'inline-flex' }}>{value || 0}</span>
  );

  const link = (id, icon, label, extra) => (
    <a href="#" className={`sidebar-link${section === id ? ' active' : ''}`} onClick={e => showSection(id, e)}>
      <i className={`fas ${icon}`}></i> {label} {extra}
    </a>
  );

  return (
    <>
      <div className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`} id="sidebarOverlay" onClick={toggleSidebar}></div>

      {/* ============ SIDEBAR ============ */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-avatar" id="sidebarAvatar" style={{ overflow: 'hidden' }}>
            {avatar || <span className="initials">{initials}</span>}
          </div>
          <div className="sidebar-name" id="sidebarName">{name}</div>
          <div className="sidebar-role">Admin Panel</div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Admin Panel</div>
          <Link to="/" className="sidebar-link"><i className="fas fa-home"></i> Home</Link>
          {link('dashboard', 'fa-th-large', 'Dashboard')}
          {link('students', 'fa-users', 'Students & Faculty')}
          {link('rooms', 'fa-building', 'Manage Rooms')}
          {link('applications', 'fa-file-alt', 'Applications', badge('pendingBadge', stats && stats.pending_apps))}
          {link('fees', 'fa-money-bill-wave', 'Fees', badge('feesBadge', stats && stats.pending_fees))}
          {link('complaints', 'fa-exclamation-circle', 'Complaints', badge('complaintsBadge', stats && stats.complaints))}
          {link('notices', 'fa-bullhorn', 'Notices')}
          {link('gallery', 'fa-images', 'Gallery', badge('galleryBadge', stats && stats.pending_gallery))}
          {link('profile', 'fa-user-cog', 'Admin Profile')}
        </nav>
        <div className="sidebar-footer">
          <a href="#" className="logout-btn" onClick={e => { e.preventDefault(); setLogoutOpen(true); }}><i className="fas fa-sign-out-alt"></i> Logout</a>
        </div>
      </aside>

      {/* ============ MAIN CONTENT ============ */}
      <div className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <button className="hamburger-toggle" onClick={toggleSidebar}><i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`} id="hamIcon"></i></button>
            <div className="topbar-title">
              <h2 id="pageTitle">{TITLES[section] || 'Dashboard'}</h2>
              <p id="pageSubtitle">Overview of hostel management</p>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-admin">
              <div className="topbar-admin-avatar" id="topbarAvatar" style={{ overflow: 'hidden' }}>
                {avatar || initials}
              </div>
              <span className="topbar-admin-name" id="topbarName">{name}</span>
            </div>
          </div>
        </div>

        <div className="page-content">
          {section === 'dashboard' && <DashboardSection stats={stats} recentStudents={recentStudents} recentApps={recentApps} go={id => showSection(id)} />}
          {section === 'students' && <UsersSection />}
          {section === 'rooms' && <RoomsSection refreshDashboard={loadDashboard} />}
          {section === 'applications' && <ApplicationsSection confirm={confirm} refreshDashboard={loadDashboard} />}
          {section === 'fees' && <FeesSection confirm={confirm} success={success} refreshDashboard={loadDashboard} />}
          {section === 'complaints' && <ComplaintsSection confirm={confirm} refreshDashboard={loadDashboard} />}
          {section === 'notices' && <NoticesSection />}
          {section === 'gallery' && <GallerySection confirm={confirm} refreshDashboard={loadDashboard} />}
          {section === 'profile' && <ProfileSection success={success} onProfileUpdated={refresh} />}
        </div>
      </div>

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
      <SuccessModal state={successState} onClose={() => setSuccessState(null)} />
      <LogoutModal
        open={logoutOpen}
        text="Are you sure you want to log out of your admin dashboard?"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}

export default function AdminDashboard() {
  return (
    <Page styles={['style.css', 'admin_dashboard.css']} title="Admin Dashboard - FATA University Hostel">
      <AdminContent />
    </Page>
  );
}
