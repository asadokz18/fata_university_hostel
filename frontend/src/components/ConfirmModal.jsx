// showConfirmModal() from the admin dashboard
import { useEffect, useState } from 'react';

const overlay = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
  transition: 'opacity 0.3s ease', backdropFilter: 'blur(6px)'
};
const box = {
  background: '#fff', borderRadius: 20, padding: 32, maxWidth: 420, width: '90%', textAlign: 'center',
  boxShadow: '0 25px 80px rgba(0,0,0,0.2)', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};
const iconBox = {
  width: 74, height: 74, background: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center',
  justifyContent: 'center', margin: '0 auto 24px', color: '#2e7d32', fontSize: '2.2rem'
};
const title = { fontFamily: "'Poppins', sans-serif", fontSize: '1.4rem', color: '#1a1a1a', marginBottom: 12, fontWeight: 700 };
const text = { color: '#666', fontSize: '1rem', lineHeight: 1.6, marginBottom: 32 };

function useFadeIn() {
  const [on, setOn] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(id); }, []);
  return on;
}

// state: { title, message (html allowed), onConfirm } or null
export function ConfirmModal({ state, onClose }) {
  const on = useFadeIn();
  if (!state) return null;

  const confirm = () => {
    onClose();
    state.onConfirm();
  };

  return (
    <div style={{ ...overlay, opacity: on ? 1 : 0 }}>
      <div style={{ ...box, transform: on ? 'translateY(0)' : 'translateY(30px)' }}>
        <div style={iconBox}><i className="fas fa-hand-holding-usd"></i></div>
        <h3 style={title}>{state.title}</h3>
        <p style={text} dangerouslySetInnerHTML={{ __html: state.message }} />
        <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
          <button onClick={onClose} style={{ background: '#f1f3f5', color: '#495057', border: 'none', padding: '12px 24px', borderRadius: 12, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', flex: 1 }}>Cancel</button>
          <button onClick={confirm} style={{ background: '#198754', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', flex: 1, boxShadow: '0 4px 15px rgba(25,135,84,0.3)' }}>Yes, Confirm</button>
        </div>
      </div>
    </div>
  );
}

// showSuccessMessage()
export function SuccessModal({ state, onClose }) {
  const on = useFadeIn();
  if (!state) return null;
  return (
    <div style={{ ...overlay, opacity: on ? 1 : 0 }}>
      <div style={{ ...box, transform: on ? 'translateY(0)' : 'translateY(30px)' }}>
        <div style={iconBox}><i className="fas fa-check-circle"></i></div>
        <h3 style={title}>{state.title}</h3>
        <p style={text}>{state.message}</p>
        <button onClick={onClose} style={{ background: '#198754', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 12, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(25,135,84,0.3)' }}>Okay</button>
      </div>
    </div>
  );
}
