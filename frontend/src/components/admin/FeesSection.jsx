// #sec-fees + Add Fee modal + Verify Payment modal
import { useEffect, useState } from 'react';
import { api, uploadUrl } from '../../api';
import { openReceipt, openTableReport } from '../../helpers';
import { Badge, Loading, Msg, NoData } from './common';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const filterStyle = { padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '0.88rem', background: '#fff' };

export default function FeesSection({ confirm, success, refreshDashboard }) {
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [fees, setFees] = useState(null);

  // Add Fee modal
  const [addOpen, setAddOpen] = useState(false);
  const [feeRole, setFeeRole] = useState('Student');
  const [feeUsers, setFeeUsers] = useState(null);
  const [feeUser, setFeeUser] = useState('');
  const [feeMonth, setFeeMonth] = useState('January');
  const [feeYear, setFeeYear] = useState(2026);
  const [feeAmount, setFeeAmount] = useState('');
  const [feeStatus, setFeeStatus] = useState('Unpaid');
  const [feeNotes, setFeeNotes] = useState('');
  const [feeAlert, setFeeAlert] = useState(null);

  // Verify modal
  const [verify, setVerify] = useState(null); // { id, method, trxId, proof }

  const loadFees = async () => {
    setFees(null);
    const qs = [roleFilter && `role=${roleFilter}`, statusFilter && `status=${encodeURIComponent(statusFilter)}`].filter(Boolean).join('&');
    const data = await api.get(`/admin/fees${qs ? '?' + qs : ''}`);
    setFees(data.fees || []);
  };

  useEffect(() => { loadFees(); /* eslint-disable-next-line */ }, [roleFilter, statusFilter]);

  const loadFeeUsers = async role => {
    const data = await api.get(`/admin/fee-users?role=${role}`);
    const users = data.users || [];
    setFeeUsers(users);
    setFeeUser(users[0] ? users[0].id : '');
  };

  const openAddFeeModal = () => {
    setFeeAlert(null);
    loadFeeUsers(feeRole);
    setAddOpen(true);
  };

  const saveFee = async () => {
    const data = await api.post('/admin/fees', {
      user_id: feeUser, user_role: feeRole, fee_month: feeMonth, fee_year: feeYear,
      amount: feeAmount, status: feeStatus, notes: feeNotes
    });
    setFeeAlert({ type: data.success ? 'success' : 'danger', msg: data.message });
    if (data.success) setTimeout(() => { setAddOpen(false); loadFees(); }, 1000);
  };

  const markFeePaid = (id, role) => {
    confirm('Confirm Cash Payment', `Are you sure the <strong>${role.toLowerCase()}</strong> has paid the fee in cash?`, async () => {
      await api.put(`/admin/fees/${id}`, { status: 'Paid' });
      loadFees(); refreshDashboard();
    });
  };

  const sendUserFeeReport = (userId, role) => {
    confirm('Send Fee Report', `Send all fee records report to this ${role.toLowerCase()} by email?`, async () => {
      const data = await api.post('/admin/fees/report', { user_id: userId, user_role: role });
      if (data.success) success('Report Sent', data.message);
      else window.alert(data.message || 'Unable to send fee report.');
    });
  };

  const sendFeeReminder = id => {
    confirm('Send Fee Reminder', 'Send a fee reminder email to this user now?', async () => {
      const data = await api.post(`/admin/fees/${id}/reminder`);
      if (data.success) success('Reminder Sent', data.message);
      else window.alert(data.message || 'Unable to send fee reminder.');
    });
  };

  const submitFeeVerification = status => {
    const id = verify.id;
    const action = status === 'Paid' ? 'Approve' : 'Reject';
    confirm(`Confirm ${action}`, `Are you sure you want to ${action.toLowerCase()} this payment?`, async () => {
      await api.put(`/admin/fees/${id}`, { status });
      setVerify(null);
      loadFees(); refreshDashboard();
    });
  };

  const downloadFeesPDFAdmin = async () => {
    const data = await api.get('/admin/fees');
    if (!data.success || !data.fees?.length) { window.alert('No fee records found to generate PDF.'); return; }
    openTableReport({
      title: 'Hostel Fee Management Report',
      headerLines: [`Hostel Fee Status &amp; Records Report | Generated on ${new Date().toLocaleDateString()}`, 'Contact: info@fu.edu.pk'],
      columns: ['#', 'User', 'Role', 'Month/Year', 'Amount', 'Status', 'Receipt No'],
      rows: data.fees.map((f, i) => [i + 1, f.full_name || f.user_name || '—', f.user_role, `${f.fee_month} ${f.fee_year}`, `Rs. ${parseFloat(f.amount).toFixed(2)}`, f.status, f.receipt_no || '—'])
    });
  };

  const actions = f => {
    const reportButton = (
      <button className="btn btn-sm btn-outline" onClick={() => sendUserFeeReport(f.user_id, f.user_role)}><i className="fas fa-file-invoice"></i> Report</button>
    );
    const reminder = (
      <button className="btn btn-sm btn-outline" onClick={() => sendFeeReminder(f.id)}><i className="fas fa-envelope"></i> Reminder</button>
    );
    if (f.status === 'Unpaid' || f.status === 'Partial') {
      return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" style={{ background: '#198754', color: '#fff' }} onClick={() => markFeePaid(f.id, f.user_role)}><i className="fas fa-check"></i> Mark Paid</button>
          {reminder}{reportButton}
        </div>
      );
    }
    if (f.status === 'Pending Verification') {
      return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-primary" onClick={() => setVerify({ id: f.id, method: f.payment_method, trxId: f.transaction_id, proof: f.payment_proof })}><i className="fas fa-search"></i> Verify Payment</button>
          {reminder}{reportButton}
        </div>
      );
    }
    if (f.status === 'Paid' && f.receipt_no) {
      return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-outline" onClick={() => openReceipt({ receiptNo: f.receipt_no, name: f.full_name || f.user_name || '', period: `${f.fee_month} ${f.fee_year}`, amount: f.amount })}><i className="fas fa-download"></i> Receipt</button>
          {reportButton}
        </div>
      );
    }
    return reportButton;
  };

  const isPdf = verify && verify.proof && verify.proof.toLowerCase().endsWith('.pdf');

  const nameQ = nameSearch.trim().toLowerCase();
  const filteredFees = (fees || []).filter(f => {
    if (!nameQ) return true;
    const name = (f.full_name || f.user_name || '').toLowerCase();
    return name.includes(nameQ);
  });

  return (
    <>
      <div id="sec-fees">
        <div className="content-card">
          <div className="content-card-header">
            <h3><i className="fas fa-money-bill-wave"></i> Fee Management</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="quick-btn primary" onClick={openAddFeeModal}><i className="fas fa-plus"></i> Add Fee Record</button>
              <button className="quick-btn secondary" onClick={downloadFeesPDFAdmin}><i className="fas fa-file-pdf"></i> Download PDF</button>
            </div>
          </div>
          <div className="content-card-body">
            <div className="filter-bar">
              <input
                type="text"
                placeholder="Search by student or faculty name..."
                value={nameSearch}
                onChange={e => setNameSearch(e.target.value)}
                style={{ ...filterStyle, flex: 1, minWidth: 180 }}
              />
              <select id="feeRoleFilter" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={filterStyle}>
                <option value="">All Roles</option>
                <option value="Student">Students</option>
                <option value="Faculty">Faculty</option>
              </select>
              <select id="feeStatusFilter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={filterStyle}>
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>User</th><th>Role</th><th>Month/Year</th><th>Amount</th><th>Status</th><th>Receipt</th><th>Action</th></tr>
                </thead>
                <tbody id="feesBody">
                  {fees === null && <Loading cols={8} />}
                  {fees && !filteredFees.length && <NoData cols={8}>No fee records match your filters.</NoData>}
                  {filteredFees.map((f, i) => (
                    <tr key={f.id}>
                      <td>{i + 1}</td>
                      <td>{f.full_name || f.user_name || '—'}</td>
                      <td>{f.user_role}</td>
                      <td>{f.fee_month} {f.fee_year}</td>
                      <td>Rs. {parseFloat(f.amount).toFixed(2)}</td>
                      <td><Badge cls={f.status.replace(' ', '-').toLowerCase()}>{f.status}</Badge></td>
                      <td>{f.receipt_no || '—'}</td>
                      <td>{actions(f)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ======== ADD FEE MODAL ======== */}
      <div className={`modal-overlay${addOpen ? ' active' : ''}`} id="addFeeModal" onClick={e => { if (e.target === e.currentTarget) setAddOpen(false); }}>
        <div className="modal">
          <div className="modal-header">
            <h3><i className="fas fa-money-bill-wave"></i> Add Fee Record</h3>
            <button className="modal-close" onClick={() => setAddOpen(false)}><i className="fas fa-times"></i></button>
          </div>
          <div className="modal-body">
            <div id="feeModalAlert"><Msg a={feeAlert} /></div>
            <div className="form-row">
              <div className="form-group">
                <label>Role *</label>
                <select className="form-control" id="feeRole" value={feeRole} onChange={e => { setFeeRole(e.target.value); loadFeeUsers(e.target.value); }}>
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                </select>
              </div>
              <div className="form-group">
                <label>User *</label>
                <select className="form-control" id="feeUser" value={feeUser} onChange={e => setFeeUser(e.target.value)}>
                  {feeUsers === null && <option>Select Role First</option>}
                  {feeUsers && !feeUsers.length && <option value="">No users found</option>}
                  {feeUsers && feeUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Fee Month *</label>
                <select className="form-control" id="feeMonth" value={feeMonth} onChange={e => setFeeMonth(e.target.value)}>
                  {MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Fee Year *</label><input type="number" className="form-control" id="feeYear" min="2020" max="2030" value={feeYear} onChange={e => setFeeYear(e.target.value)} /></div>
              <div className="form-group"><label>Amount (Rs.) *</label><input type="number" className="form-control" id="feeAmount" placeholder="5000" min="0" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} /></div>
              <div className="form-group"><label>Status</label>
                <select className="form-control" id="feeStatus" value={feeStatus} onChange={e => setFeeStatus(e.target.value)}>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div className="form-group full"><label>Notes</label><input type="text" className="form-control" id="feeNotes" placeholder="Optional notes" value={feeNotes} onChange={e => setFeeNotes(e.target.value)} /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveFee}><i className="fas fa-save"></i> Save Record</button>
          </div>
        </div>
      </div>

      {/* ======== VERIFY PAYMENT MODAL ======== */}
      <div className={`modal-overlay${verify ? ' active' : ''}`} id="verifyPaymentModal" onClick={e => { if (e.target === e.currentTarget) setVerify(null); }}>
        <div className="modal">
          <div className="modal-header">
            <h3><i className="fas fa-check-circle"></i> Verify Online Payment</h3>
            <button className="modal-close" onClick={() => setVerify(null)}><i className="fas fa-times"></i></button>
          </div>
          <div className="modal-body">
            <div style={{ marginBottom: 15 }}>
              <strong>Payment Method:</strong> <span id="vPayMethod">{(verify && verify.method) || 'N/A'}</span><br />
              <strong>Transaction ID:</strong> <span id="vTrxId">{(verify && verify.trxId) || 'N/A'}</span>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 15, border: '1px solid #ddd', padding: 5, borderRadius: 8 }}>
              {verify && verify.proof && !isPdf && <img id="vProofImg" src={uploadUrl(verify.proof)} alt="Payment Proof" style={{ maxWidth: '100%', maxHeight: 400, display: 'inline' }} />}
              {verify && verify.proof && isPdf && <a id="vProofLink" href={uploadUrl(verify.proof)} target="_blank" rel="noreferrer" style={{ display: 'inline', color: 'var(--primary)', textDecoration: 'underline' }}>View PDF Proof</a>}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Please verify the screenshot and transaction ID against your bank/wallet records before approving.</p>
          </div>
          <div className="modal-footer" style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => setVerify(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => submitFeeVerification('Unpaid')}><i className="fas fa-times"></i> Reject</button>
            <button className="btn btn-primary" onClick={() => submitFeeVerification('Paid')}><i className="fas fa-check"></i> Approve</button>
          </div>
        </div>
      </div>
    </>
  );
}
