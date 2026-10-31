// showToast() (faculty dashboard) and showAccessDeniedToast() (ID card guard)
import { useEffect } from 'react';

// { msg, type: 'success' | 'danger' }
export function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [toast, onDone]);
  if (!toast) return null;
  return (
    <div className={`alert alert-${toast.type}`} style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, minWidth: 280, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
      <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i> {toast.msg}
    </div>
  );
}

export function AccessDeniedToast({ msg, onDone }) {
  useEffect(() => {
    if (!msg) return undefined;
    const t = setTimeout(onDone, 4400);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 99999, background: '#fff', borderLeft: '4px solid #f39c12', padding: '16px 20px', borderRadius: 8, boxShadow: '0 8px 25px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 12, maxWidth: 320 }}>
      <div style={{ color: '#f39c12', fontSize: '1.5rem' }}><i className="fas fa-exclamation-triangle"></i></div>
      <div style={{ color: '#2c3e50', fontSize: '0.95rem', fontWeight: 500, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.4 }}>{msg}</div>
    </div>
  );
}
