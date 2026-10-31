// showAllNotices() from the student/faculty dashboards
import { useEffect, useState } from 'react';
import { localDate, formatDatePK } from '../helpers';

export default function AllNoticesModal({ notices, onClose, faculty }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(id); }, []);
  const [closeHover, setCloseHover] = useState(false);
  const fmt = faculty ? formatDatePK : localDate;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(4px)', opacity: on ? 1 : 0, transition: 'opacity 0.3s ease' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '90%', maxWidth: 550, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 15px 50px rgba(0,0,0,0.2)', transform: on ? 'scale(1)' : 'scale(0.95)', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fdfdfd', borderRadius: '12px 12px 0 0' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#2c3e50' }}><i className="fas fa-bullhorn" style={{ color: 'var(--primary)', marginRight: 8 }}></i> All Notices</h3>
          <button
            onClick={onClose}
            onMouseOver={() => setCloseHover(true)}
            onMouseOut={() => setCloseHover(false)}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: closeHover ? '#333' : '#999', transition: 'color 0.2s' }}
          >&times;</button>
        </div>
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {notices.map(n => (
            <div key={n.id} style={{ marginBottom: 15, padding: 15, background: '#f8f9fa', borderLeft: '4px solid var(--primary)', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span className={`badge-status badge-${n.priority.toLowerCase()}`}>{n.priority}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><i className="far fa-calendar-alt"></i> {fmt(n.created_at)}</span>
              </div>
              <h4 style={{ marginBottom: 8, fontSize: '1.05rem', color: '#2c3e50' }}>{n.title}</h4>
              <p style={{ fontSize: '0.9rem', color: '#555', margin: 0, lineHeight: 1.5 }}>{n.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
