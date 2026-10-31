import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../public/assets/css/header.css';

export default function Header({ variant = 'site', currentPage = '', scrolled = false }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const smoothScroll = e => {
    const href = e.currentTarget.getAttribute('href');
    if (href === '#' || href === '#!') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (variant === 'landing') {
    return (
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="navbar">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <img src="/assets/images/logo.png" alt="Logo" />
            <span>FATA University Hostel</span>
          </Link>
          <button
            className={`hamburger${menuOpen ? ' active' : ''}`}
            id="hamburger"
            aria-label="Menu"
            onClick={() => setMenuOpen(o => !o)}
          >
            <span></span><span></span><span></span>
          </button>
          <ul className={`navbar-nav${menuOpen ? ' open' : ''}`} id="navMenu">
            {['home:Home', 'features:Features', 'hostels:Hostels', 'rooms:Rooms', 'notices:Notices', 'gallery:Gallery', 'contact:Contact'].map(s => {
              const [id, label] = s.split(':');
              return (
                <li key={id}>
                  <a href={`#${id}`} onClick={e => { smoothScroll(e); setMenuOpen(false); }}>
                    {label}
                  </a>
                </li>
              );
            })}
            <li><Link to="/login" className="btn-login" onClick={() => setMenuOpen(false)}>Login</Link></li>
            <li><Link to="/register" className="btn-register" onClick={() => setMenuOpen(false)}>Register</Link></li>
          </ul>
        </div>
      </nav>
    );
  }

  // Standard site header (used in Login, Register, Forgot Password, etc.)
  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" className="header-brand">
          <img src="/assets/images/logo.png" alt="Logo" />
          <span>FATA University Hostel</span>
        </Link>
        <nav className="header-nav">
          <Link to="/" className="btn-home" title="Home"><i className="fas fa-home"></i> <span>Home</span></Link>
          {currentPage === 'login' && (
            <Link to="/register" className="btn-login" title="Register"><i className="fas fa-user-plus"></i> <span>Register</span></Link>
          )}
          {currentPage === 'register' && (
            <Link to="/login" className="btn-login" title="Login"><i className="fas fa-sign-in-alt"></i> <span>Login</span></Link>
          )}
          {currentPage === 'forgot-password' && (
            <Link to="/login" className="btn-login" title="Login"><i className="fas fa-sign-in-alt"></i> <span>Login</span></Link>
          )}
          {!currentPage && (
            <>
              <Link to="/login" className="btn-login" title="Login"><i className="fas fa-sign-in-alt"></i> <span>Login</span></Link>
              <Link to="/register" className="btn-home" title="Register"><i className="fas fa-user-plus"></i> <span>Register</span></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

