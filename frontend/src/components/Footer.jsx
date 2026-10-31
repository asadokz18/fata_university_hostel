import { Link } from 'react-router-dom';
import '../../public/assets/css/footer.css';

export default function Footer({ variant = 'site' }) {
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
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <img src="/assets/images/logo.png" alt="Logo" />
                <div>
                  <h3>FATA University Hostel</h3>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Est. FATA University</p>
                </div>
              </div>
              <p>We are committed to providing the best hostel accommodation with standard facilities ensuring a comfortable and student-friendly environment.</p>
              <div className="social-links">
                <a href="#" title="Facebook" onClick={e => e.preventDefault()}><i className="fab fa-facebook-f"></i></a>
                <a href="#" title="Twitter" onClick={e => e.preventDefault()}><i className="fab fa-twitter"></i></a>
                <a href="#" title="Instagram" onClick={e => e.preventDefault()}><i className="fab fa-instagram"></i></a>
              </div>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>
                {['home:Home', 'features:Features', 'hostels:Hostels', 'notices:Notice Board', 'gallery:Gallery'].map(s => {
                  const [id, label] = s.split(':');
                  return (
                    <li key={id}>
                      <a href={`#${id}`} onClick={smoothScroll}>
                        <i className="fas fa-angle-right" style={{ marginRight: 6 }}></i>{label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <h4>Get In Touch</h4>
              <div className="footer-contact-item">
                <i className="fas fa-map-marker-alt"></i>
                <span>FATA University, Tehsil Sub Division(TSD) Darra Adam Khel, Newly Merged District (NMD) Kohat, KPK, Pakistan 26100.</span>
              </div>
              <div className="footer-contact-item"><i className="fas fa-phone"></i><span>0922-XXXXXX</span></div>
              <div className="footer-contact-item"><i className="fas fa-envelope"></i><span>info@fu.edu.pk</span></div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p>&copy; 2026 FATA University Hostel Management System. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    );
  }

  // Standard compact footer (used in Login, Register, Forgot Password, etc.)
  return (
    <footer className="site-footer">
      <p>
        &copy; 2026 FATA University Hostel &nbsp;|&nbsp;{' '}
        <Link to="/">Home</Link> &nbsp;|&nbsp;{' '}
        <Link to="/login">Login</Link> &nbsp;|&nbsp;{' '}
        <Link to="/#contact">Contact</Link>
      </p>
    </footer>
  );
}

