// register.html + register.js
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Page from '../components/Page';
import Alert from '../components/Alert';
import PasswordInput from '../components/PasswordInput';
import { api, toFormData } from '../api';

const DEPARTMENTS = [
  'BS Computer Science', 'Management Sciences', 'Political Science', 'English', 'Geology',
  'Sociology', 'Mathematics', 'Psychology', 'Microbiology', 'Electronics', 'Education'
];
const SEMESTERS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(s => `${s} Semester`);
const DESIGNATIONS = ['Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor', 'Visiting Lecturer', 'Research Associate'];
const QUALIFICATIONS = ['BS/BA', 'MS/MA', 'MPhil', 'PhD', 'Post-Doc'];

const STUDENT_EMPTY = {
  full_name: '', father_name: '', email: '', phone: '', gender: '', cnic: '', dob: '',
  department: '', semester: '', registration_no: '', home_address: '', password: '', confirm_password: ''
};
const FACULTY_EMPTY = {
  full_name: '', father_name: '', email: '', phone: '', gender: '', cnic: '', dob: '',
  designation: '', department: '', employee_id: '', qualification: '', home_address: '',
  password: '', confirm_password: ''
};

// Shared submit logic of registerStudent() / registerFaculty()
function useRegistration(action, emptyForm, submitLabelHtml) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [alert, setAlert] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const onPhoto = e => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const show = (msg, type = 'danger') => {
    setAlert({ msg, type });
  };

  const submit = async () => {
    const fields = {};
    Object.entries(form).forEach(([k, v]) => {
      fields[k] = ['password', 'confirm_password', 'gender', 'dob'].includes(k) ? v : v.trim();
    });

    for (const [key, val] of Object.entries(fields)) {
      if (!val && key !== 'confirm_password') {
        show(`Please fill in all required fields. Missing: ${key.replace(/_/g, ' ')}`);
        return;
      }
    }
    if (fields.password !== fields.confirm_password) { show('Passwords do not match.'); return; }
    if (fields.password.length < 6) { show('Password must be at least 6 characters.'); return; }

    setBusy(true);
    const { confirm_password, ...payload } = fields; // eslint-disable-line no-unused-vars
    const fd = toFormData(payload);
    if (photo) fd.append('profile_photo', photo);

    const data = await api.post(action, fd);
    if (data.success) {
      show('🎉 ' + data.message + ' Redirecting to login...', 'success');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      show(data.message === 'Connection error.' ? 'Server error. Please try again.' : (data.message || 'Registration failed.'));
      setBusy(false);
    }
  };

  return { form, set, preview, onPhoto, alert, busy, submit, submitLabelHtml };
}

function AlertBox({ alert }) {
  useEffect(() => {
    if (alert) document.getElementById('regAlertAnchor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [alert]);
  if (!alert) return null;
  return (
    <Alert type={alert.type} icon={alert.type === 'success' ? 'check-circle' : 'exclamation-circle'}>
      {alert.msg}
    </Alert>
  );
}

const Select = ({ id, value, onChange, placeholder, options }) => (
  <select id={id} className="form-control" value={value} onChange={onChange} required>
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

function StudentForm() {
  const r = useRegistration('/auth/student-register', STUDENT_EMPTY);
  const { form, set } = r;
  return (
    <div id="studentForm">
      <div className="register-card">
        <div className="register-card-header">
          <div className="icon"><i className="fas fa-user-graduate"></i></div>
          <div>
            <h3>Student Registration</h3>
            <p>Fill in your personal and academic information</p>
          </div>
        </div>
        <div className="register-card-body">
          <form id="studentRegForm" onSubmit={e => e.preventDefault()}>
            <div className="form-grid">
              {/* Photo Upload */}
              <div className="photo-upload full-width">
                <img
                  src={r.preview || 'https://via.placeholder.com/80x80/326a33/ffffff?text=Photo'}
                  alt="Preview" className="photo-preview" id="studentPhotoPreview"
                />
                <div>
                  <label style={{ fontWeight: 600, color: '#1C2331', display: 'block', marginBottom: 6 }}>Profile Photo (for ID Card)</label>
                  <p style={{ fontSize: '0.82rem', color: '#6c757d', marginBottom: 8 }}>Upload a clear passport-size photo</p>
                  <label className="upload-btn" htmlFor="studentPhoto"><i className="fas fa-camera"></i> Choose Photo</label>
                  <input type="file" id="studentPhoto" accept="image/*" style={{ display: 'none' }} onChange={r.onPhoto} />
                </div>
              </div>

              <div className="section-divider full-width"><i className="fas fa-user"></i> Personal Information</div>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" id="s_fullname" className="form-control" placeholder="Your full name" value={form.full_name} onChange={set('full_name')} required />
              </div>
              <div className="form-group">
                <label>Father's Name *</label>
                <input type="text" id="s_fathername" className="form-control" placeholder="Father's name" value={form.father_name} onChange={set('father_name')} required />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" id="s_email" className="form-control" placeholder="your@gmail.com" value={form.email} onChange={set('email')} required />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input type="tel" id="s_phone" className="form-control" placeholder="03XX-XXXXXXX" value={form.phone} onChange={set('phone')} required />
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <Select id="s_gender" value={form.gender} onChange={set('gender')} placeholder="Select Gender" options={['Male', 'Female']} />
              </div>
              <div className="form-group">
                <label>CNIC No *</label>
                <input type="text" id="s_cnic" className="form-control" placeholder="XXXXX-XXXXXXX-X" value={form.cnic} onChange={set('cnic')} required />
              </div>
              <div className="form-group">
                <label>Date of Birth *</label>
                <input type="date" id="s_dob" className="form-control" value={form.dob} onChange={set('dob')} required />
              </div>

              <div className="section-divider full-width"><i className="fas fa-graduation-cap"></i> Academic Information</div>

              <div className="form-group">
                <label>Department *</label>
                <Select id="s_department" value={form.department} onChange={set('department')} placeholder="Select Department" options={DEPARTMENTS} />
              </div>
              <div className="form-group">
                <label>Semester *</label>
                <Select id="s_semester" value={form.semester} onChange={set('semester')} placeholder="Select Semester" options={SEMESTERS} />
              </div>
              <div className="form-group">
                <label>Registration No *</label>
                <input type="text" id="s_regno" className="form-control" placeholder="2022-FU-XXXX" value={form.registration_no} onChange={set('registration_no')} required />
              </div>
              <div className="form-group full-width">
                <label>Home Address *</label>
                <textarea id="s_address" className="form-control" rows="2" placeholder="Your complete home address" value={form.home_address} onChange={set('home_address')} required></textarea>
              </div>

              <div className="section-divider full-width"><i className="fas fa-lock"></i> Account Security</div>

              <div className="form-group">
                <label>Password *</label>
                <PasswordInput id="s_password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <PasswordInput id="s_confirm_password" placeholder="Repeat password" value={form.confirm_password} onChange={set('confirm_password')} />
              </div>
            </div>
            <div id="studentAlert"><AlertBox alert={r.alert} /></div>
            <button type="button" id="studentSubmitBtn" className="register-submit" onClick={r.submit} disabled={r.busy}>
              {r.busy
                ? <><i className="fas fa-spinner fa-spin"></i> Registering...</>
                : <><i className="fas fa-user-plus"></i> Create Student Account</>}
            </button>
          </form>
          <p className="login-prompt">Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
}

function FacultyForm() {
  const r = useRegistration('/auth/faculty-register', FACULTY_EMPTY);
  const { form, set } = r;
  return (
    <div id="facultyForm">
      <div className="register-card">
        <div className="register-card-header" style={{ background: 'linear-gradient(135deg,#937C3D,#b89d5a)' }}>
          <div className="icon"><i className="fas fa-chalkboard-teacher"></i></div>
          <div>
            <h3>Faculty Registration</h3>
            <p>Fill in your personal and professional information</p>
          </div>
        </div>
        <div className="register-card-body">
          <form id="facultyRegForm" onSubmit={e => e.preventDefault()}>
            <div className="form-grid">
              {/* Photo */}
              <div className="photo-upload full-width">
                <img
                  src={r.preview || 'https://via.placeholder.com/80x80/937C3D/ffffff?text=Photo'}
                  alt="Preview" className="photo-preview" id="facultyPhotoPreview"
                />
                <div>
                  <label style={{ fontWeight: 600, color: '#1C2331', display: 'block', marginBottom: 6 }}>Profile Photo</label>
                  <p style={{ fontSize: '0.82rem', color: '#6c757d', marginBottom: 8 }}>Upload a clear passport-size photo</p>
                  <label className="upload-btn" htmlFor="facultyPhoto" style={{ background: 'var(--secondary)' }}><i className="fas fa-camera"></i> Choose Photo</label>
                  <input type="file" id="facultyPhoto" accept="image/*" style={{ display: 'none' }} onChange={r.onPhoto} />
                </div>
              </div>

              <div className="section-divider full-width"><i className="fas fa-user"></i> Personal Information</div>

              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" id="f_fullname" className="form-control" placeholder="Your full name" value={form.full_name} onChange={set('full_name')} required />
              </div>
              <div className="form-group">
                <label>Father's Name *</label>
                <input type="text" id="f_fathername" className="form-control" placeholder="Father's name" value={form.father_name} onChange={set('father_name')} required />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" id="f_email" className="form-control" placeholder="your@email.com" value={form.email} onChange={set('email')} required />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input type="tel" id="f_phone" className="form-control" placeholder="03XX-XXXXXXX" value={form.phone} onChange={set('phone')} required />
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <Select id="f_gender" value={form.gender} onChange={set('gender')} placeholder="Select Gender" options={['Male', 'Female']} />
              </div>
              <div className="form-group">
                <label>CNIC No *</label>
                <input type="text" id="f_cnic" className="form-control" placeholder="XXXXX-XXXXXXX-X" value={form.cnic} onChange={set('cnic')} required />
              </div>
              <div className="form-group">
                <label>Date of Birth *</label>
                <input type="date" id="f_dob" className="form-control" value={form.dob} onChange={set('dob')} required />
              </div>

              <div className="section-divider full-width"><i className="fas fa-briefcase"></i> Professional Information</div>

              <div className="form-group">
                <label>Designation *</label>
                <Select id="f_designation" value={form.designation} onChange={set('designation')} placeholder="Select Designation" options={DESIGNATIONS} />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <Select id="f_department" value={form.department} onChange={set('department')} placeholder="Select Department" options={DEPARTMENTS} />
              </div>
              <div className="form-group">
                <label>Employee ID *</label>
                <input type="text" id="f_employeeid" className="form-control" placeholder="FU-EMP-XXXX" value={form.employee_id} onChange={set('employee_id')} required />
              </div>
              <div className="form-group">
                <label>Qualification *</label>
                <Select id="f_qualification" value={form.qualification} onChange={set('qualification')} placeholder="Select Qualification" options={QUALIFICATIONS} />
              </div>
              <div className="form-group full-width">
                <label>Home Address *</label>
                <textarea id="f_address" className="form-control" rows="2" placeholder="Your complete home address" value={form.home_address} onChange={set('home_address')} required></textarea>
              </div>

              <div className="section-divider full-width"><i className="fas fa-lock"></i> Account Security</div>

              <div className="form-group">
                <label>Password *</label>
                <PasswordInput id="f_password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <PasswordInput id="f_confirm_password" placeholder="Repeat password" value={form.confirm_password} onChange={set('confirm_password')} />
              </div>
            </div>
            <div id="facultyAlert"><AlertBox alert={r.alert} /></div>
            <button
              type="button" id="facultySubmitBtn" className="register-submit"
              style={{ background: 'linear-gradient(135deg,#937C3D,#b89d5a)' }} onClick={r.submit} disabled={r.busy}
            >
              {r.busy
                ? <><i className="fas fa-spinner fa-spin"></i> Registering...</>
                : <><i className="fas fa-user-plus"></i> Create Faculty Account</>}
            </button>
          </form>
          <p className="login-prompt">Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  const [params] = useSearchParams();
  // Detect ?type=student or ?type=faculty from URL
  const [tab, setTab] = useState(params.get('type') === 'faculty' ? 'faculty' : 'student');

  useEffect(() => {
    document.title = tab === 'faculty' ? 'Faculty Register — FATA University Hostel' : 'Student Register — FATA University Hostel';
  }, [tab]);

  return (
    <Page styles={['style.css', 'register.css']} title="Register - FATA University Hostel">
      {/* ====== SITE HEADER ====== */}
      <header className="site-header">
        <div className="container">
          <Link to="/" className="header-brand">
            <img src="/assets/images/logo.png" alt="Logo" />
            <span>FATA University Hostel</span>
          </Link>
          <nav className="header-nav">
            <Link to="/"><i className="fas fa-home"></i> Home</Link>
            <Link to="/login" className="btn-login"><i className="fas fa-sign-in-alt"></i> Login</Link>
          </nav>
        </div>
      </header>

      <div className="register-wrapper">
        {/* ====== REGISTRATION TAB SWITCHER ====== */}
        <div className="tab-switcher">
          <button className={tab === 'student' ? 'btn btn-primary' : 'btn btn-outline'} id="tabStudent" onClick={() => setTab('student')}>
            <i className="fas fa-user-graduate"></i> Student Registration
          </button>
          <button
            className={tab === 'faculty' ? 'btn btn-primary' : 'btn btn-outline'} id="tabFaculty" onClick={() => setTab('faculty')}
            style={tab === 'faculty' ? { background: 'var(--secondary)', color: '#fff', borderColor: 'var(--secondary)' } : undefined}
          >
            <i className="fas fa-chalkboard-teacher"></i> Faculty Registration
          </button>
        </div>

        <span id="regAlertAnchor"></span>
        <div id="regAlert"></div>

        {/* keep both forms mounted so typed data survives tab switches (display toggled like the original) */}
        <div style={{ display: tab === 'student' ? 'block' : 'none' }}><StudentForm /></div>
        <div style={{ display: tab === 'faculty' ? 'block' : 'none' }}><FacultyForm /></div>
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <p>&copy; 2026 FATA University Hostel &nbsp;|&nbsp;
          <Link to="/">Home</Link> &nbsp;|&nbsp;
          <Link to="/login">Login</Link> &nbsp;|&nbsp;
          <Link to="/#contact">Contact</Link>
        </p>
      </footer>
    </Page>
  );
}
