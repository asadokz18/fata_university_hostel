// "Ready to leave?" modal (doLogout / confirmLogout in the dashboards)
import { useEffect, useState } from 'react';

export default function LogoutModal({ open, text, onCancel, onConfirm }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!open) { setOn(false); return undefined; }
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, [open]);
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, opacity: on ? 1 : 0, transition: 'opacity 0.3s ease', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', textAlign: 'center', boxShadow: '0 15px 50px rgba(0,0,0,0.2)', transform: on ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
        <div style={{ width: 70, height: 70, background: '#ffebee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#f44336', fontSize: '2.2rem' }}>
          <i className="fas fa-sign-out-alt"></i>
        </div>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', color: '#2c3e50', marginBottom: 12, fontWeight: 700 }}>Ready to leave?</h3>
        <p style={{ color: '#6c757d', fontSize: '1rem', lineHeight: 1.6, marginBottom: 28 }}>{text}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ background: '#f1f3f5', color: '#495057', border: 'none', padding: '12px 24px', borderRadius: 30, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', flex: 1 }}>Cancel</button>
          <button onClick={onConfirm} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 30, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', flex: 1, boxShadow: '0 4px 15px rgba(220,53,69,0.3)' }}>Logout</button>
        </div>
      </div>
    </div>
  );
}
