// #sec-fees
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { openReceipt, openTableReport } from '../../helpers';

export default function Fees({ faculty }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => setData(await api.get('/user/my-fees')))();
  }, []);

  const roleName = faculty ? 'Faculty' : 'Student';
  const fees = data && data.fees;

  const downloadReceipt = f => openReceipt({
    receiptNo: f.receipt_no, name: (user && user.user_name) || roleName,
    period: `${f.fee_month} ${f.fee_year}`, amount: f.amount, variant: faculty ? 'faculty' : undefined
  });

  const downloadMyFeesPDF = async () => {
    const d = await api.get('/user/my-fees');
    if (!d.success || !d.fees?.length) { window.alert('No fee records found to generate PDF.'); return; }
    const name = (user && user.user_name) || roleName;
    const email = (user && user.user_email) || 'info@fu.edu.pk';
    openTableReport({
      title: 'My Fee Report',
      headerLines: [
        `${roleName} Fee Statement Report | Generated on ${new Date().toLocaleDateString()}`,
        `<strong>Name:</strong> ${name} | <strong>Email:</strong> ${email}`
      ],
      columns: ['#', 'Month/Year', 'Amount', 'Status', 'Receipt No'],
      rows: d.fees.map((f, i) => [i + 1, `${f.fee_month} ${f.fee_year}`, `Rs. ${parseFloat(f.amount).toFixed(2)}`, f.status, f.receipt_no || '—'])
    });
  };

  const action = f => {
    if (f.status === 'Paid' && f.receipt_no) {
      return <button className="btn btn-sm btn-outline" onClick={() => downloadReceipt(f)}><i className="fas fa-download"></i> Receipt</button>;
    }
    if (f.status === 'Unpaid' || f.status === 'Partial') {
      return <button className="btn btn-sm" style={{ background: 'var(--primary)', color: '#fff' }} onClick={() => navigate(`/pay-online?fee_id=${f.id}`)}><i className="fas fa-wallet"></i> Pay Online</button>;
    }
    if (f.status === 'Pending Verification') {
      return <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><i className="fas fa-hourglass-half"></i> Under Review</span>;
    }
    return '—';
  };

  return (
    <div id="sec-fees">
      <div className="dashboard-card" style={{ maxWidth: 700 }}>
        <div className="dashboard-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3><i className="fas fa-money-bill-wave"></i> Fee Status</h3>
          <button className="btn btn-sm btn-outline" onClick={downloadMyFeesPDF}><i className="fas fa-file-pdf"></i> Download PDF</button>
        </div>
        <div className="dashboard-card-body">
          <div className="fee-summary" id="feeSummary">
            <div className="fee-box paid">
              <div className="fee-box-value" id="feePaidTotal">Rs. {parseFloat((data && data.total_paid) || 0).toFixed(2)}</div>
              <div className="fee-box-label">Total Paid</div>
            </div>
            <div className="fee-box due">
              <div className="fee-box-value" id="feeDueTotal">Rs. {parseFloat((data && data.total_due) || 0).toFixed(2)}</div>
              <div className="fee-box-label">Total Due</div>
            </div>
          </div>
          <div style={{ background: '#eef2ff', padding: 16, borderRadius: 8, marginBottom: 20, borderLeft: '4px solid var(--primary)' }}>
            <h4 style={{ marginBottom: 8, color: 'var(--primary)', fontSize: '0.95rem' }}><i className="fas fa-info-circle"></i> Online Payment Instructions</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-color)', marginBottom: 6 }}>You can pay your fees online using EasyPaisa or other supported bank transfers. Please send the exact amount to the following account and upload the screenshot.</p>
            <ul style={{ fontSize: '0.85rem', marginLeft: 20, color: 'var(--text-muted)', fontWeight: 500 }}>
              <li><strong>EasyPaisa Account:</strong> Asad Ullah</li>
              <li><strong>Account Number:</strong> 03479177330</li>
            </ul>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>#</th><th>Month/Year</th><th>Amount</th><th>Status</th><th>Action/Receipt</th></tr></thead>
              <tbody id="feeTableBody">
                {data === null && <tr><td colSpan="5" className="no-data"><div className="spinner"></div></td></tr>}
                {fees && !fees.length && <tr><td colSpan="5" className="no-data">{faculty ? 'No fee records found.' : 'No fee records.'}</td></tr>}
                {fees && fees.map((f, i) => (
                  <tr key={f.id}>
                    <td>{i + 1}</td>
                    <td>{f.fee_month} {f.fee_year}</td>
                    <td>Rs. {parseFloat(f.amount).toFixed(2)}</td>
                    <td><span className={`badge-status badge-${f.status.replace(' ', '-').toLowerCase()}`}>{f.status}</span></td>
                    <td>{action(f)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
