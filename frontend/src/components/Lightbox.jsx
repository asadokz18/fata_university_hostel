// Full-screen image popup (openGalleryLightbox in the dashboards)
export default function Lightbox({ src, onClose }) {
  if (!src) return null;
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, cursor: 'zoom-out' }}
    >
      <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        <img src={src} alt="Gallery Photo" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 10, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
      </div>
    </div>
  );
}
