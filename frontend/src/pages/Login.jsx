// login.html + login logic
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Page from '../components/Page';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PasswordInput from '../components/PasswordInput';
import { dashboardFor, useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState(null); // { msg, type }
  const [busy, setBusy] = useState(false);
  const signingIn = useRef(false);

  // Store intended URL
  useEffect(() => {
    const r = params.get('redirect');
    if (r) sessionStorage.setItem('intended_url', r);
  }, [params]);

  // Auto redirect if already logged in
  useEffect(() => {
    if (!loading && user && !signingIn.current) navigate(dashboardFor(user.user_role), { replace: true });
  }, [loading, user, navigate]);

  const showAlert = (msg, type = 'danger') => setAlert({ msg, type });
  const alertIcon = t => (t === 'success' ? 'check-circle' : t === 'warning' ? 'exclamation-triangle' : 'times-circle');

  const doLogin = async () => {
    const mail = email.trim();
    if (!mail || !password) { showAlert('Please enter email and password.', 'warning'); return; }
    setBusy(true);
    signingIn.current = true;
    const data = await login(mail, password);
    if (data.success) {
      showAlert('Login successful! Redirecting...', 'success');
      const intended = sessionStorage.getItem('intended_url');
      sessionStorage.removeItem('intended_url');
      setTimeout(() => navigate(intended || data.redirect, { replace: true }), 700);
    } else {
      signingIn.current = false;
      showAlert(
        data.message === 'Connection error.' ? 'Cannot connect to server. Make sure the backend is running.' : (data.message || 'Invalid credentials.'),
        data.message === 'Connection error.' ? 'warning' : 'danger'
      );
      setBusy(false);
    }
  };

  const onEnter = e => { if (e.key === 'Enter') doLogin(); };

  return (
    <Page styles={['style.css', 'login.css']} title="Login - FATA University Hostel">
      <Header currentPage="login" />

      {/* ====== MAIN ====== */}
      <main className="login-main">
        <div className="login-wrapper">
          <div className="login-card">
            <div className="login-logo">
              <img src="/assets/images/logo.png" alt="Logo" />
              <h3>FATA University Hostel</h3>
              <p>Sign in to your account</p>
            </div>
            <div id="loginAlert">
              {alert && (
                <div className={`alert alert-${alert.type}`}>
                  <i className={`fas fa-${alertIcon(alert.type)}`}></i> {alert.msg}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Email / Username</label>
              <div className="input-group">
                <i className="fas fa-user input-icon"></i>
                <input
                  type="text" className="form-control" id="loginEmail" placeholder="your@gmail.com or admin"
                  autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onEnter}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <PasswordInput
                id="loginPassword" icon="lock" placeholder="Enter your password" autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)} onKeyDown={onEnter}
              />
              <Link to="/forgot-password" className="forgot-link"><i className="fas fa-key"></i> Forgot Password?</Link>
            </div>

            <button className="login-btn" id="loginBtn" onClick={doLogin} disabled={busy}>
              {busy
                ? <><i className="fas fa-spinner fa-spin"></i> Signing in...</>
                : <><i className="fas fa-sign-in-alt"></i> Login</>}
            </button>

            <div className="divider"><span>Not registered yet?</span></div>

            <div className="register-options">
              <Link to="/register?type=student" className="register-btn student">
                <i className="fas fa-user-graduate"></i> Student Register
              </Link>
              <Link to="/register?type=faculty" className="register-btn faculty">
                <i className="fas fa-chalkboard-teacher"></i> Faculty Register
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ====== FOOTER ====== */}
      <Footer />
    </Page>
  );
}
