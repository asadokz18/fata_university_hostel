// index.html + index.js (public landing page)
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Page from '../components/Page';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api, uploadUrl } from '../api';
import { dashboardFor } from '../context/AuthContext';
import { formatDatePK } from '../helpers';

const DEFAULT_TICKER = [
  'Water supply maintenance Sunday 9AM–12PM',
  'Welcome to FATA University Hostel — New session registrations open',
  'Dinner timing: 7:00 PM – 9:00 PM',
  'All hostel fees due by 15th of each month',
  'Fee submission after deadline incurs Rs. 200 fine',
  'Breakfast: 7AM–9AM \u00a0|\u00a0 Lunch: 1PM–2:30PM \u00a0|\u00a0 Dinner: 7PM–9PM'
];

const PLACEHOLDER_ROOMS = [
  { no: '101', hostel: 'FAQIR IPI HOUSE', cap: 2, avail: 2, desc: 'Student room on ground floor with study table and chair.' },
  { no: '102', hostel: 'FAQIR IPI HOUSE', cap: 2, avail: 1, desc: 'Spacious room with natural light and two study desks.' },
  { no: 'F101', hostel: 'FATIMA HOUSE', cap: 2, avail: 2, desc: 'Female hostel room with security and CCTV surveillance.' },
  { no: 'F102', hostel: 'FATIMA HOUSE', cap: 3, avail: 2, desc: 'Comfortable triple room with wardrobe and study area.' },
  { no: '12', hostel: 'KHYBER HOUSE', cap: 2, avail: 1, desc: 'Faculty room on ground floor with two beds.' },
  { no: '13', hostel: 'KHYBER HOUSE', cap: 1, avail: 1, desc: 'Single occupancy faculty room with attached bathroom.' }
];

const PLACEHOLDER_NOTICES = [
  { priority: 'Urgent', title: 'Water Supply Maintenance', message: 'Water supply suspended Sunday 9AM–12PM for maintenance. Please store water accordingly.', date: '21 Apr 2026' },
  { priority: 'Normal', title: 'Welcome to FATA University Hostel', message: 'Welcome to our hostel. Please read all hostel rules and regulations carefully.', date: '20 Apr 2026' },
  { priority: 'Important', title: 'Fee Submission Reminder', message: 'All hostel fees must be submitted by the 15th of each month. Late fees incur Rs. 200 fine.', date: '19 Apr 2026' },
  { priority: 'Important', title: 'New Schedule Update', message: 'Revised meal timings: Breakfast 7AM–9AM, Lunch 1PM–2:30PM, Dinner 7PM–9PM.', date: '18 Apr 2026' }
];

const PLACEHOLDER_GALLERY = [
  '/assets/images/FAQIR_IPI_HOUSE.jpg',
  '/assets/images/hero-image1.jpeg',
  '/assets/images/hero-image2.jpg',
  '/assets/images/FATIMA_HOUSE.jpg',
  '/assets/images/hero-image3.jpg',
  '/assets/images/KHYBER_HOUSE.jpg'
];

const hostelImage = h =>
  `/assets/images/${h === 'FAQIR IPI HOUSE' ? 'FAQIR_IPI_HOUSE' : h === 'FATIMA HOUSE' ? 'FATIMA_HOUSE' : 'KHYBER_HOUSE'}.jpg`;

const Spinner = () => <div className="spinner-box"><div className="spinner"></div></div>;

// smooth scroll for in-page anchors (a[href^="#"])
const smoothScroll = e => {
  const href = e.currentTarget.getAttribute('href');
  if (href === '#' || href === '#!') return;
  const target = document.querySelector(href);
  if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
};

function HomeContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const SLIDES = 4;

  const [ticker, setTicker] = useState(DEFAULT_TICKER);
  const [rooms, setRooms] = useState(null);     // null = loading
  const [notices, setNotices] = useState(null);
  const [gallery, setGallery] = useState(null);
  const [lightbox, setLightbox] = useState('');

  const [contact, setContact] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactAlert, setContactAlert] = useState(null);
  const rootRef = useRef(null);

  // ---- NAVBAR SCROLL ----
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ---- HERO SLIDER (auto advance every 5s) ----
  useEffect(() => {
    const id = setInterval(() => setSlide(s => (s + 1) % SLIDES), 5000);
    return () => clearInterval(id);
  }, []);

  // ---- LOAD DATA ----
  useEffect(() => {
    (async () => {
      // ticker
      const t = await api.get('/public/notices?limit=6');
      if (t.notices?.length) setTicker(t.notices.map(n => n.title));
    })();
    (async () => {
      const d = await api.get('/public/rooms?limit=6');
      setRooms(d.success && d.rooms?.length ? d.rooms : false);
    })();
    (async () => {
      const d = await api.get('/public/notices?limit=4');
      setNotices(d.notices?.length ? d.notices : false);
    })();
    (async () => {
      const d = await api.get('/public/gallery?limit=6');
      setGallery(d.gallery?.length ? d.gallery : false);
    })();
  }, []);

  // ---- SCROLL REVEAL (after content is rendered) ----
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.08 }
    );
    rootRef.current?.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // jump to #contact etc. when arriving from other pages (/#contact)
  useEffect(() => {
    if (!location.hash) return undefined;
    const t = setTimeout(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    return () => clearTimeout(t);
  }, [location.hash]);

  // ---- LANDING PAGE AUTH LOGIC ----
  const checkAuthAndGo = async dest => {
    const data = await api.get('/auth/check-session');
    if (data.logged_in) {
      navigate(dashboardFor(data.user_role) || dest);
    } else {
      sessionStorage.setItem('intended_url', dest);
      navigate('/login');
    }
  };
  const goStudent = e => { e.preventDefault(); checkAuthAndGo('/student/dashboard'); };

  // ---- CONTACT FORM ----
  const sendContact = async () => {
    const name = contact.name.trim();
    const email = contact.email.trim();
    const subject = contact.subject.trim();
    const message = contact.message.trim();

    if (!name || !email || !message) {
      setContactAlert({ type: 'warning', icon: 'exclamation-triangle', msg: 'Please fill all required fields.' });
      return;
    }
    const data = await api.post('/public/contact', { name, email, subject: subject || 'General Inquiry', message });
    if (data.message === 'Connection error.' && !data.success) {
      setContactAlert({ type: 'danger', icon: 'times-circle', msg: 'Could not send. Please try again.' });
      return;
    }
    setContactAlert({ type: data.success ? 'success' : 'danger', icon: data.success ? 'check-circle' : 'times-circle', msg: data.message });
    if (data.success) setContact({ name: '', email: '', subject: '', message: '' });
  };

  const setC = k => e => setContact(c => ({ ...c, [k]: e.target.value }));
  const closeMenu = () => setMenuOpen(false);

  const roomCard = (key, { img, alt, no, desc, hostel, cap, avail }) => (
    <div className="room-card" key={key}>
      <div className="room-img">
        <img src={img} alt={alt} loading="lazy" />
        <span className={`room-availability ${avail > 0 ? 'room-available' : 'room-full'}`}>
          {avail > 0 ? '✓ Available' : '✗ Full'}
        </span>
      </div>
      <div className="room-body">
        <h3>Room {no}</h3>
        <p>{desc}</p>
        <div className="room-meta">
          <span><i className="fas fa-home"></i> {hostel}</span>
          <span><i className="fas fa-bed"></i> {cap} Beds</span>
          <span><i className="fas fa-door-open"></i> {avail} Free</span>
        </div>
        <a href="#" className="btn btn-primary btn-sm" onClick={goStudent}>
          <i className="fas fa-plus"></i> Apply for this Room
        </a>
      </div>
    </div>
  );

  const noticeCard = (key, n, dateLabel, msg) => (
    <div className={`notice-card ${n.priority.toLowerCase()}`} key={key}>
      <div className="notice-meta">
        <span className={`badge-status badge-${n.priority.toLowerCase()}`}>{n.priority}</span>
        <span className="notice-date">{dateLabel}</span>
      </div>
      <h3>{n.title}</h3>
      <p>{msg}</p>
    </div>
  );

  const galleryItem = (key, src, alt) => (
    <div className="gallery-item" key={key} onClick={() => setLightbox(src)}>
      <img src={src} alt={alt} loading="lazy" />
      <div className="gallery-item-overlay"><i className="fas fa-expand"></i></div>
    </div>
  );

  return (
      <div ref={rootRef}>
        <Header variant="landing" scrolled={scrolled} />

        {/* ====== HERO SLIDER SECTION ====== */}
        <section className="hero" id="home">
          <div className="hero-slides" id="heroSlides">
            {[1, 2, 3, 4].map((n, i) => (
              <div key={n} className={`hero-slide${slide === i ? ' active' : ''} slide-${n}`}></div>
            ))}
          </div>
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <span className="badge-hero">🎓 FATA University — Official Hostel Portal</span>
            <h1>Welcome to <span>FATA University</span><br />Hostel</h1>
            <p>Experience comfort, security, and a great community. Your home away from home in the heart of FATA University campus.</p>
            <div className="hero-buttons">
              <a href="#" className="btn btn-primary" id="applyNowBtn" onClick={goStudent}><i className="fas fa-home"></i> Apply Now</a>
              <a
                href="#" className="btn btn-secondary" id="exploreRoomsBtn"
                onClick={e => { e.preventDefault(); document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' }); }}
              ><i className="fas fa-door-open"></i> Explore Rooms</a>
            </div>
          </div>
          <button className="hero-arrow prev" id="prevSlide" onClick={() => setSlide(s => (s - 1 + SLIDES) % SLIDES)}><i className="fas fa-chevron-left"></i></button>
          <button className="hero-arrow next" id="nextSlide" onClick={() => setSlide(s => (s + 1) % SLIDES)}><i className="fas fa-chevron-right"></i></button>
          <div className="hero-controls" id="heroDots">
            {[0, 1, 2, 3].map(i => (
              <button key={i} className={`hero-dot${slide === i ? ' active' : ''}`} aria-label={`Slide ${i + 1}`} onClick={() => setSlide(i)}></button>
            ))}
          </div>
          <div className="hero-ticker">
            <div className="ticker-label-box">
              <i className="fas fa-bullhorn"></i> NOTICE
            </div>
            <div className="ticker-scroll-wrapper">
              <div className="ticker-track" id="tickerTrack">
                {[...ticker, ...ticker].map((t, i) => <span className="ticker-item" key={i}>{t}</span>)}
              </div>
            </div>
          </div>
        </section>

        {/* ====== CORE FEATURES SECTION ====== */}
        <section className="features-section section-padding" id="features">
          <div className="container">
            <div className="section-header reveal">
              <span className="badge">Why Choose Us</span>
              <h2>Features</h2>
              <p>Everything you need for a comfortable and productive hostel life at FATA University.</p>
            </div>
            <div className="features-grid">
              {[
                ['fa-wifi', 'High-Speed Internet', 'High Speed Internet Facility is available in the hostel. Wi-Fi is available 24/7 in the entire hostel premises, including rooms, common areas, and study halls.'],
                ['fa-utensils', 'Mess Facility', 'A well-managed mess is available to provide hygienic and nutritious food to the students. The mess operates on a buffet system, offering a variety of dishes for breakfast, lunch, and dinner.'],
                ['fa-book', 'Study Zone', 'Every hostel rooms have a study table and Chair, in all hostel rooms there are almari for cloths.'],
                ['fa-users', 'Student-Friendly Hostel', 'Inclusive and welcoming community for students from all departments of FATA University.'],
                ['fa-shield-alt', '24/7 Security', 'There is a very secure enviroment for the students, there is a guard 24/7 at the gate of the hostel.'],
                ['fa-tshirt', 'Laundry Services', 'In Faqir Ipi House the laundry service is available. In Fatima House and Khyber House the laundry service is not available.']
              ].map(([icon, title, text]) => (
                <div className="feature-card reveal" key={title}>
                  <div className="feature-icon"><i className={`fas ${icon}`}></i></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== HOSTEL CATEGORIES SECTION ====== */}
        <section className="section-padding" id="hostels">
          <div className="container">
            <div className="section-header reveal">
              <span className="badge">Our Residences</span>
              <h2>Our Hostels</h2>
              <p>Three dedicated hostels catering to male students, female students, and faculty members.</p>
            </div>
            <div className="hostels-grid">
              {[
                { img: 'FAQIR_IPI_HOUSE.jpg', alt: 'Faqir Ipi House', tag: 'male', tagIcon: 'fa-mars', tagText: 'Male', title: 'FAQIR IPI HOUSE', text: 'Faqir Ipi House is a residential block designated for only undergraduate and graduate male students.', icon: 'fa-user-graduate', who: 'Male Students' },
                { img: 'FATIMA_HOUSE.jpg', alt: 'Fatima House', tag: 'female', tagIcon: 'fa-venus', tagText: 'Female', title: 'FATIMA HOUSE', text: 'Fatima House is a residential block designated for female students and female faculty members of FATA University.', icon: 'fa-female', who: 'Female Students' },
                { img: 'KHYBER_HOUSE.jpg', alt: 'Khyber House', tag: 'faculty', tagIcon: 'fa-chalkboard-teacher', tagText: 'Faculty', title: 'KHYBER HOUSE', text: 'Khyber House is a residential block designated for faculty members and staff of FATA University', icon: 'fa-user-tie', who: 'Faculty' }
              ].map(h => (
                <div className="hostel-card reveal" key={h.title}>
                  <div className="hostel-img">
                    <img src={`/assets/images/${h.img}`} alt={h.alt} loading="lazy" />
                    <span className={`hostel-tag ${h.tag}`}><i className={`fas ${h.tagIcon}`}></i> {h.tagText}</span>
                  </div>
                  <div className="hostel-info">
                    <h3>{h.title}</h3>
                    <p>{h.text}</p>
                    <div className="hostel-meta"><span><i className="fas fa-door-open"></i> Multiple Rooms</span><span><i className={`fas ${h.icon}`}></i> {h.who}</span></div>
                    <a href="#rooms" className="btn btn-outline btn-sm" onClick={smoothScroll}>View Rooms</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== AVAILABLE ROOMS SECTION ====== */}
        <section className="rooms-section section-padding" id="rooms">
          <div className="container">
            <div className="section-header reveal">
              <span className="badge">Available Spaces</span>
              <h2>Our Rooms</h2>
              <p>Choose from our range of comfortable and affordable rooms across all three hostels.</p>
            </div>
            <div className="rooms-grid" id="roomsGrid">
              {rooms === null && <Spinner />}
              {rooms === false && PLACEHOLDER_ROOMS.map(r => roomCard(r.no, {
                img: hostelImage(r.hostel), alt: 'Room', no: r.no, desc: r.desc, hostel: r.hostel, cap: r.cap, avail: r.avail
              }))}
              {rooms && rooms.map(r => roomCard(r.id, {
                img: r.room_image ? uploadUrl(r.room_image) : '/assets/images/hero-image1.jpeg',
                alt: `Room ${r.room_no}`, no: r.room_no,
                desc: (r.description || 'Comfortable room with standard facilities.').substring(0, 80),
                hostel: r.hostel_name, cap: r.capacity, avail: r.available_spaces
              }))}
            </div>
            <div className="text-center mt-3">
              <a href="#" className="btn btn-primary" id="viewAllRoomsBtn" onClick={goStudent}><i className="fas fa-th"></i> View All Rooms</a>
            </div>
          </div>
        </section>

        {/* ====== LATEST NOTICES SECTION ====== */}
        <section className="section-padding" id="notices">
          <div className="container">
            <div className="section-header reveal">
              <span className="badge">Announcements</span>
              <h2><i className="fas fa-bell text-orange"></i> Latest Notices</h2>
              <p>Official announcements from the hostel administration.</p>
            </div>
            <div className="notices-grid" id="noticesGrid">
              {notices === null && <Spinner />}
              {notices === false && PLACEHOLDER_NOTICES.map(n => noticeCard(n.title, n, n.date, n.message))}
              {notices && notices.map(n => noticeCard(n.id, n, formatDatePK(n.created_at), n.message.substring(0, 150) + (n.message.length > 150 ? '...' : '')))}
            </div>
            <div className="text-center mt-3">
              <a href="#" className="btn btn-primary" id="viewAllNoticesBtn" onClick={goStudent}>
                <i className="fas fa-bell"></i> View All Notices
              </a>
            </div>
          </div>
        </section>

        {/* ====== CAMPUS GALLERY SECTION ====== */}
        <section className="gallery-section section-padding" id="gallery">
          <div className="container">
            <div className="section-header reveal">
              <span className="badge">Photo Gallery</span>
              <h2>Our Gallery</h2>
              <p>Photos from our hostels shared by admin and students.</p>
            </div>
            <div className="gallery-grid" id="galleryGrid">
              {gallery === null && <Spinner />}
              {gallery === false && PLACEHOLDER_GALLERY.map(src => galleryItem(src, src, 'Gallery'))}
              {gallery && gallery.map(img => galleryItem(img.id, uploadUrl(img.image_path), img.caption || 'Gallery'))}
            </div>
            <div className="text-center mt-3">
              <a href="#" className="btn btn-primary" id="viewGalleryBtn" onClick={goStudent}><i className="fas fa-images"></i> View Full Gallery</a>
            </div>
          </div>
        </section>

        {/* ====== CONTACT US SECTION ====== */}
        <section className="section-padding" id="contact">
          <div className="container">
            <div className="section-header reveal">
              <span className="badge">Get In Touch</span>
              <h2>Contact Us</h2>
              <p>Have questions or need to apply? Contact our hostel administration.</p>
            </div>
            <div className="contact-grid reveal">
              <div className="contact-info">
                <h3>We're Here to Help</h3>
                <p className="text-muted-p">Feel free to reach out with any queries regarding hostel accommodation, facilities or admission.</p>
                <div className="contact-item">
                  <div className="contact-item-icon"><i className="fas fa-map-marker-alt"></i></div>
                  <div className="contact-item-text">
                    <h4>Location</h4>
                    <p>FATA University, Tehsil Sub Division(TSD) Darra Adam Khel,Newly Merged District (NMD) Kohat, KPK, Pakistan 26100.</p>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-item-icon"><i className="fas fa-phone"></i></div>
                  <div className="contact-item-text"><h4>Phone</h4><p>0922-XXXXXX</p></div>
                </div>
                <div className="contact-item">
                  <div className="contact-item-icon"><i className="fas fa-envelope"></i></div>
                  <div className="contact-item-text"><h4>Email</h4><p>info@fu.edu.pk</p></div>
                </div>
                <div className="contact-item">
                  <div className="contact-item-icon"><i className="fas fa-clock"></i></div>
                  <div className="contact-item-text"><h4>Office Hours</h4><p>Mon–Fri: 9am–5pm &nbsp;|&nbsp; Sat: 9am–1pm</p></div>
                </div>
              </div>
              <div className="contact-form">
                <h3>Send Us a Message</h3>
                <div id="contactAlert">
                  {contactAlert && (
                    <div className={`alert alert-${contactAlert.type}`}>
                      <i className={`fas fa-${contactAlert.icon}`}></i> {contactAlert.msg}
                    </div>
                  )}
                </div>
                <div className="form-group"><label>Full Name *</label><input type="text" className="form-control" id="cName" placeholder="Your Name" value={contact.name} onChange={setC('name')} /></div>
                <div className="form-group"><label>Email Address *</label><input type="email" className="form-control" id="cEmail" placeholder="your@email.com" value={contact.email} onChange={setC('email')} /></div>
                <div className="form-group"><label>Subject</label><input type="text" className="form-control" id="cSubject" placeholder="Subject" value={contact.subject} onChange={setC('subject')} /></div>
                <div className="form-group"><label>Message *</label><textarea className="form-control" id="cMessage" rows="5" placeholder="Your message..." value={contact.message} onChange={setC('message')}></textarea></div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={sendContact}><i className="fas fa-paper-plane"></i> Send Message</button>
              </div>
            </div>
          </div>
        </section>

        {/* ====== SITE FOOTER SECTION ====== */}
        <Footer variant="landing" />

        {/* Lightbox - popup of the gallery images */}
        <div className={`modal-overlay${lightbox ? ' active' : ''}`} id="lightboxOverlay" onClick={() => setLightbox('')}>
          <div style={{ maxWidth: 800, width: '100%', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox('')} style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>
              <i className="fas fa-times"></i>
            </button>
            <img id="lightboxImg" src={lightbox} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: '80vh', objectFit: 'contain' }} />
          </div>
        </div>
      </div>
  );
}

// The page's own stylesheets are attached first; HomeContent mounts once they are loaded
export default function Home() {
  return (
    <Page styles={['style.css', 'index.css']} title="FATA University Hostel">
      <HomeContent />
    </Page>
  );
}
