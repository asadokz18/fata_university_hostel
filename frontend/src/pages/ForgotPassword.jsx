// forgot-password.html (email -> OTP -> new password -> done)
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Page from '../components/Page';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PasswordInput from '../components/PasswordInput';
import { api } from '../api';

const alertIcon = t => (t === 'success' ? 'check-circle' : t === 'warning' ? 'exclamation-triangle' : 'times-circle');
const Msg = ({ a }) => (a ? <div className={`alert alert-${a.type}`}><i className={`fas fa-${alertIcon(a.type)}`}></i> {a.msg}</div> : null);
const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

function Steps({ current }) {
  const labels = ['Email', 'OTP', 'Reset', 'Done'];
  return (
    <div className="steps">
      {labels.map((l, i) => {
        const n = i + 1;
        const cls = n < current ? 'step done' : n === current ? 'step active' : 'step';
        return (
          <div className={cls} key={l}>
            <div className="step-num">{n < current ? <i className="fas fa-check"></i> : n}</div>
            <div className="step-label">{l}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Student');
  const [verifiedOtp, setVerifiedOtp] = useState('');

  const [forgotAlert, setForgotAlert] = useState(null);
  const [otpAlert, setOtpAlert] = useState(null);
  const [resetAlert, setResetAlert] = useState(null);

  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resending, setResending] = useState(false);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  const [newPwd, setNewPwd] = useState('');
  const [confPwd, setConfPwd] = useState('');

  // countdown
  const [remaining, setRemaining] = useState(15 * 60);
  const [timerRun, setTimerRun] = useState(0); // bump to restart

  useEffect(() => {
    if (step !== 2) return undefined;
    setRemaining(15 * 60);
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(id); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step, timerRun]);

  const resetOTPBoxes = () => {
    setOtp(['', '', '', '', '', '']);
    setTimeout(() => otpRefs.current[0]?.focus(), 0);
  };

  const showStep = n => {
    setStep(n);
    if (n === 2) resetOTPBoxes();
  };

  // ---- STEP 1: send OTP
  const sendOTP = async () => {
    const mail = email.trim();
    setForgotAlert(null);
    if (!mail) { setForgotAlert({ msg: 'Please enter your email address.', type: 'warning' }); return; }
    setEmail(mail);
    setSending(true);
    const data = await api.post('/auth/forgot-password', { email: mail, role });
    if (data.success) showStep(2);
    else if (data.message === 'Connection error.') setForgotAlert({ msg: 'Cannot connect to server. Make sure the backend is running.', type: 'warning' });
    else setForgotAlert({ msg: data.message || 'Failed to send OTP.', type: 'danger' });
    setSending(false);
  };

  // ---- OTP box logic: auto-advance, paste, backspace
  const onOtpInput = (idx, value) => {
    const v = value.replace(/\D/g, '').slice(-1);
    setOtp(o => o.map((d, i) => (i === idx ? v : d)));
    if (v && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const onOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
      setOtp(o => o.map((d, i) => (i === idx - 1 ? '' : d)));
    }
    if (e.key === 'ArrowLeft' && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (e.key === 'Enter') verifyOTP();
  };

  const onOtpPaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
    const next = [...otp];
    pasted.split('').slice(0, 6).forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ---- STEP 2: verify OTP (advance to step 3)
  const verifyOTP = () => {
    const code = otp.join('');
    setOtpAlert(null);
    if (code.length < 6) { setOtpAlert({ msg: 'Please enter all 6 digits of the OTP.', type: 'warning' }); return; }
    setVerifiedOtp(code);
    showStep(3);
  };

  // ---- STEP 3: reset password
  const doReset = async () => {
    setResetAlert(null);
    if (!newPwd) { setResetAlert({ msg: 'Please enter a new password.', type: 'warning' }); return; }
    if (newPwd.length < 6) { setResetAlert({ msg: 'Password must be at least 6 characters.', type: 'warning' }); return; }
    if (newPwd !== confPwd) { setResetAlert({ msg: 'Passwords do not match.', type: 'warning' }); return; }

    setResetting(true);
    const data = await api.post('/auth/reset-password', { token: verifiedOtp, password: newPwd });
    if (data.success) showStep(4);
    else if (data.message === 'Connection error.') setResetAlert({ msg: 'Connection error.', type: 'warning' });
    else setResetAlert({ msg: data.message || 'Reset failed. The OTP may have expired — please request a new one.', type: 'danger' });
    setResetting(false);
  };

  // ---- Resend OTP
  const resendOTP = async () => {
    setOtpAlert(null);
    setResending(true);
    const data = await api.post('/auth/forgot-password', { email, role });
    if (data.success) {
      setOtpAlert({ msg: 'A new OTP has been sent to your email.', type: 'success' });
      resetOTPBoxes();
      setTimerRun(t => t + 1);
    } else {
      setOtpAlert({
        msg: data.message === 'Connection error.' ? 'Connection error.' : (data.message || 'Failed to resend OTP.'),
        type: data.message === 'Connection error.' ? 'warning' : 'danger'
      });
    }
    setResending(false);
  };

  return (
    <Page styles={['style.css', 'forgot_password.css']} title="Forgot Password - FATA University Hostel">
      <Header currentPage="forgot-password" />

      {/* MAIN */}
      <main className="login-main">
        <div className="login-wrapper">

          {/* STEP 1 : Enter email */}
          <div id="step1Card" className="login-card" style={{ display: step === 1 ? 'block' : 'none' }}>
            <div className="login-logo">
              <img src="/assets/images/logo.png" alt="Logo" />
              <h2>FATA University Hostel</h2>
              <p>Account recovery</p>
            </div>
            <Steps current={1} />
            <h3><i className="fas fa-envelope-open-text" style={{ color: '#ef4444' }}></i> Forgot Password?</h3>
            <p className="subtitle">Enter your registered email. We'll send a 6-digit OTP that expires in 15 minutes.</p>
            <div id="forgotAlert"><Msg a={forgotAlert} /></div>

            <div className="form-group">
              <label>Account Type</label>
              <select className="form-control" id="forgotRole" value={role} onChange={e => setRole(e.target.value)}>
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
              </select>
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <div className="input-group">
                <i className="fas fa-envelope input-icon"></i>
                <input
                  type="email" className="form-control" id="forgotEmail" placeholder="your@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendOTP(); }}
                />
              </div>
            </div>
            <button className="login-btn" id="sendBtn" onClick={sendOTP} disabled={sending}>
              {sending
                ? <><i className="fas fa-spinner fa-spin"></i> Sending OTP...</>
                : <><i className="fas fa-paper-plane"></i> Send OTP</>}
            </button>
            <p className="back-link">Remember your password? <Link to="/login">Login</Link></p>
          </div>

          {/* STEP 2 : Enter OTP */}
          <div id="step2Card" className="login-card" style={{ display: step === 2 ? 'block' : 'none' }}>
            <div className="login-logo">
              <img src="/assets/images/logo.png" alt="Logo" />
              <h2>FATA University Hostel</h2>
            </div>
            <Steps current={2} />
            <h3><i className="fas fa-shield-alt" style={{ color: '#6366f1' }}></i> Enter OTP</h3>
            <p className="subtitle" id="otpSentMsg">
              {email ? `A 6-digit OTP has been sent to ${email}. Check your inbox.` : 'A 6-digit OTP has been sent to your email.'}
            </p>
            <div id="otpAlert"><Msg a={otpAlert} /></div>

            {/* 6 digit boxes */}
            <div className="otp-row">
              {otp.map((d, i) => (
                <input
                  key={i} type="text" maxLength="1" inputMode="numeric" pattern="[0-9]"
                  className={`otp-input${d ? ' filled' : ''}`} id={`otp${i}`} value={d}
                  ref={el => { otpRefs.current[i] = el; }}
                  onChange={e => onOtpInput(i, e.target.value)}
                  onKeyDown={e => onOtpKeyDown(i, e)}
                  onPaste={onOtpPaste}
                />
              ))}
            </div>

            <div className="otp-meta">
              <span>OTP expires in <span id="otpTimer">{remaining <= 0 ? 'Expired' : fmt(remaining)}</span></span>
              <button id="resendBtn" onClick={resendOTP} disabled={remaining > 0 || resending}>
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            </div>

            <button className="login-btn" id="verifyBtn" onClick={verifyOTP}>
              <i className="fas fa-check-circle"></i> Verify OTP
            </button>
            <p className="back-link"><a href="#" onClick={e => { e.preventDefault(); showStep(1); }}><i className="fas fa-arrow-left"></i> Back</a></p>
          </div>

          {/* STEP 3 : New password */}
          <div id="step3Card" className="login-card" style={{ display: step === 3 ? 'block' : 'none' }}>
            <Steps current={3} />
            <h3><i className="fas fa-lock" style={{ color: '#6366f1' }}></i> Set New Password</h3>
            <p className="subtitle">OTP verified! Choose a strong new password.</p>
            <div id="resetAlert"><Msg a={resetAlert} /></div>
            <div className="form-group">
              <label>New Password *</label>
              <PasswordInput id="newPassword" icon="lock" placeholder="Min 6 characters" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <PasswordInput id="confirmPassword" icon="lock" placeholder="Repeat new password" value={confPwd} onChange={e => setConfPwd(e.target.value)} />
            </div>
            <button className="login-btn" id="resetBtn" onClick={doReset} disabled={resetting}>
              {resetting
                ? <><i className="fas fa-spinner fa-spin"></i> Resetting...</>
                : <><i className="fas fa-key"></i> Reset Password</>}
            </button>
            <p className="back-link"><a href="#" onClick={e => { e.preventDefault(); showStep(2); }}><i className="fas fa-arrow-left"></i> Back</a></p>
          </div>

          {/* STEP 4 : Done */}
          <div id="step4Card" className="login-card" style={{ display: step === 4 ? 'block' : 'none', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>&#x2705;</div>
            <h3 style={{ marginBottom: 8 }}>Password Reset!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Your password has been updated successfully. You can now login with your new password.</p>
            <Link to="/login" className="login-btn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
              <i className="fas fa-sign-in-alt"></i> Go to Login
            </Link>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <Footer />
    </Page>
  );
}
