// pay-online.html + pay_online.js
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Page from '../components/Page';
import { api, toFormData } from '../api';
import { compressImage } from '../helpers';
import { dashboardFor, useAuth } from '../context/AuthContext';

const METHODS = [
  { value: 'EasyPaisa', icon: 'fa-mobile-alt' },
  { value: 'JazzCash', icon: 'fa-mobile-screen' },
  { value: 'Upaisa', icon: 'fa-wallet' },
  { value: 'Bank Transfer', icon: 'fa-university' }
];
const BANKS = [
  { value: 'Meezan Bank', alt: 'Meezan', label: 'Meezan', img: 'meezan_bank_logo.png' },
  { value: 'UBL', alt: 'UBL', label: 'UBL', img: 'ubl_logo.png' },
  { value: 'Allied Bank Limited', alt: 'Allied', label: 'Allied', img: 'allied_bank_logo.png' },
  { value: 'Bank AlFalah Limited', alt: 'Alfalah', label: 'Alfalah', img: 'bank_alfalah_logo.png' }
];

export default function PayOnline() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const feeId = params.get('fee_id');
  const backUrl = dashboardFor(user.user_role);

  const [fee, setFee] = useState(undefined); // undefined=loading, null=not found, 'error', 'conn'
  const [method, setMethod] = useState('EasyPaisa');
  const [bank, setBank] = useState('');
  const [trxId, setTrxId] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [alertBox, setAlertBox] = useState(null); // { type, icon, msg }
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!feeId) {
      window.alert('Invalid Access: No Fee ID provided.');
      navigate(-1);
      return;
    }
    (async () => {
      const data = await api.get('/user/my-fees');
      if (data.success) setFee(data.fees.find(f => String(f.id) === String(feeId)) || null);
      else setFee(data.message === 'Connection error.' ? 'conn' : 'error');
    })();
  }, [feeId, navigate]);

  const pickFile = f => setFile(f || null);

  const removeFile = () => {
    if (fileRef.current) fileRef.current.value = '';
    setFile(null);
  };

  const onDrop = e => {
    e.preventDefault();
    setDragOver(false);
    const dt = e.dataTransfer;
    if (dt.files && dt.files[0]) {
      if (fileRef.current) fileRef.current.files = dt.files;
      pickFile(dt.files[0]);
    }
  };

  const submitPayment = async e => {
    e.preventDefault();
    const trx = trxId.trim();

    if (!trx) { setAlertBox({ type: 'warning', msg: 'Please enter the Transaction ID.' }); return; }
    if (!file) { setAlertBox({ type: 'warning', msg: 'Please upload a screenshot of the payment.' }); return; }

    let finalMethod = method;
    if (method === 'Bank Transfer') {
      if (!bank) { setAlertBox({ type: 'warning', msg: 'Please select a bank for transfer.' }); return; }
      finalMethod = `Bank Transfer (${bank})`;
    }

    let uploadFile = file;
    if (uploadFile && uploadFile.type && uploadFile.type.startsWith('image/')) {
      uploadFile = await compressImage(uploadFile, 1600, 1600, 0.85);
    }

    const fd = toFormData({
      fee_id: fee.id,
      payment_method: finalMethod,
      transaction_id: trx
    });
    fd.append('payment_proof', uploadFile);

    setBusy(true);
    const data = await api.post('/user/fee-payment', fd);
    if (data.message === 'Connection error.' && !data.success) {
      setAlertBox({ type: 'danger', msg: 'Submission error. Please try again.' });
    } else {
      setAlertBox({
        type: data.success ? 'success' : 'danger',
        icon: data.success ? 'check-circle' : 'exclamation-triangle',
        msg: data.message
      });
      if (data.success) setTimeout(() => navigate(backUrl), 2000);
    }
    setBusy(false);
  };

  const banner = () => {
    if (fee === undefined) return <div className="spinner"></div>;
    if (fee === null) return <div className="alert alert-danger">Fee record not found.</div>;
    if (fee === 'error') return <div className="alert alert-danger">Failed to load fee details.</div>;
    if (fee === 'conn') return <div className="alert alert-danger">Connection error.</div>;
    return (
      <>
        <div className="fee-info">
          <h2>{fee.fee_month} {fee.fee_year}</h2>
          <p>Status: {fee.status}</p>
        </div>
        <div className="fee-amount">
          <span className="label">Amount Due</span>
          <span className="value">Rs. {parseFloat(fee.amount).toLocaleString()}</span>
        </div>
      </>
    );
  };

  return (
    <Page styles={['style.css', 'pay_online.css']} title="Online Fee Payment - FATA University Hostel">
      <div className="payment-container">
        <div className="payment-card">
          <div className="payment-header">
            <div className="header-left">
              <Link to={backUrl} id="backBtn" className="back-link"><i className="fas fa-arrow-left"></i> Back to Dashboard</Link>
              <h1><i className="fas fa-wallet text-primary"></i> Online Fee Payment</h1>
            </div>
            <img src="/assets/images/logo.png" alt="Logo" className="payment-logo" />
          </div>

          <div className="payment-grid">
            {/* Info Section */}
            <div className="payment-info">
              <div className="info-card">
                <h3><i className="fas fa-info-circle"></i> Payment Instructions</h3>
                <p>Follow these steps to complete your fee payment:</p>
                <ol>
                  <li>Select your preferred payment method below.</li>
                  <li>Send the exact fee amount to the account provided.</li>
                  <li>Note down the <strong>Transaction ID</strong>.</li>
                  <li>Take a <strong>Screenshot</strong> of the successful transaction.</li>
                  <li>Upload the screenshot and enter the ID to submit for verification.</li>
                </ol>
              </div>

              <div className="account-details">
                <h4>Our Official Accounts</h4>
                <div className="account-item">
                  <div className="account-icon"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Easypaisa_Logo.png/640px-Easypaisa_Logo.png" alt="EasyPaisa" style={{ height: 20 }} /></div>
                  <div className="account-text">
                    <span className="label">EasyPaisa Account:</span>
                    <span className="value">Asad Ullah</span>
                    <span className="number">03479177330</span>
                  </div>
                </div>
                <div className="account-item">
                  <div className="account-icon"><i className="fas fa-university"></i></div>
                  <div className="account-text">
                    <span className="label">Bank Transfer:</span>
                    <span className="value">Multiple Options Available</span>
                    <span className="small">Choose method to see details</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="payment-form-area">
              <div id="paymentAlert">
                {alertBox && (
                  <div className={`alert alert-${alertBox.type}`}>
                    {alertBox.icon && <><i className={`fas fa-${alertBox.icon}`}></i>{' '}</>}{alertBox.msg}
                  </div>
                )}
              </div>
              <div className="fee-details-banner" id="feeBanner">{banner()}</div>

              <form id="paymentForm" onSubmit={submitPayment}>
                <div className="form-group">
                  <label>Payment Method <span className="required">*</span></label>
                  <div className="method-grid">
                    {METHODS.map(m => (
                      <label key={m.value} className={`method-card${method === m.value ? ' active' : ''}`} onClick={() => setMethod(m.value)}>
                        <input type="radio" name="payMethod" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} />
                        <span className="method-icon"><i className={`fas ${m.icon}`}></i></span>
                        <span className="method-name">{m.value}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div id="bankSelectionGroup" style={{ display: method === 'Bank Transfer' ? 'block' : 'none' }} className="animate-fade">
                  <div className="form-group">
                    <label>Select Your Bank <span className="required">*</span></label>
                    <div className="bank-grid">
                      {BANKS.map(b => (
                        <label key={b.value} className={`bank-card${bank === b.value ? ' selected' : ''}`} onClick={() => setBank(b.value)}>
                          <input type="radio" name="bankSelect" value={b.value} checked={bank === b.value} onChange={() => setBank(b.value)} />
                          <img src={`/assets/images/banks/${b.img}`} alt={b.alt} />
                          <span>{b.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="payTrxId">Transaction / Reference ID <span className="required">*</span></label>
                  <div className="input-with-icon">
                    <i className="fas fa-hashtag"></i>
                    <input type="text" id="payTrxId" className="form-control" placeholder="e.g. 1234567890" value={trxId} onChange={e => setTrxId(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="payProof">Upload Screenshot (Proof) <span className="required">*</span></label>
                  <div
                    className={`file-upload-area${dragOver ? ' dragover' : ''}`} id="dropZone"
                    onDragEnter={e => { e.preventDefault(); setDragOver(true); }}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
                    onDrop={onDrop}
                  >
                    <input type="file" id="payProof" className="file-input" accept="image/*,.pdf" ref={fileRef} onChange={e => pickFile(e.target.files[0])} />
                    <div className="file-dummy" style={{ display: file ? 'none' : 'block' }}>
                      <div className="dummy-icon"><i className="fas fa-cloud-upload-alt"></i></div>
                      <div className="dummy-text">Click to upload or drag &amp; drop</div>
                      <div className="dummy-hint">JPG, PNG or PDF (Max 5MB)</div>
                    </div>
                    <div className="file-preview" id="filePreview" style={{ display: file ? 'flex' : 'none' }}>
                      <span id="fileName">{file ? file.name : ''}</span>
                      <button type="button" className="remove-file" onClick={removeFile}><i className="fas fa-times"></i></button>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block" id="submitBtn" disabled={busy || !fee || typeof fee === 'string'}>
                  <span className="btn-text" style={{ display: busy ? 'none' : 'block' }}>Submit Payment Proof</span>
                  <span className="btn-spinner" style={{ display: busy ? 'block' : 'none' }}><i className="fas fa-circle-notch fa-spin"></i> Processing...</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
