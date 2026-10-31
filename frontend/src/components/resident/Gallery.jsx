// #sec-gallery (upload + community gallery + my submitted photos)
import { useEffect, useRef, useState } from 'react';
import { api, toFormData, uploadUrl } from '../../api';
import Lightbox from '../Lightbox';

export default function Gallery({ faculty }) {
  const [community, setCommunity] = useState(null); // null = loading, false = error
  const [mine, setMine] = useState(null);
  const [alert, setAlert] = useState(null);
  const [caption, setCaption] = useState('');
  const [lightbox, setLightbox] = useState('');
  const fileRef = useRef(null);

  const loadMine = async () => {
    const data = await api.get('/user/my-gallery');
    setMine(data.gallery || []);
  };
  const loadCommunity = async () => {
    const data = await api.get('/public/gallery?limit=30');
    setCommunity(data.success === false ? false : (data.gallery || []));
  };

  useEffect(() => { loadMine(); loadCommunity(); }, []);

  const uploadMyGallery = async () => {
    const file = fileRef.current?.files[0];
    if (!file) {
      setAlert({ type: 'warning', icon: faculty, msg: faculty ? 'Please select a photo.' : 'Select a photo.' });
      return;
    }
    const fd = toFormData({ caption: faculty ? caption.trim() : caption });
    fd.append('photo', file);
    const data = await api.post('/user/gallery', fd);
    setAlert({ type: data.success ? 'success' : 'danger', msg: data.message });
    if (data.success) {
      fileRef.current.value = '';
      setCaption('');
      loadMine(); loadCommunity();
    }
  };

  const muted = { color: 'var(--text-muted)', fontSize: '0.88rem' };

  return (
    <div id="sec-gallery">
      <div className="dashboard-card" style={{ maxWidth: 700 }}>
        <div className="dashboard-card-header">
          <h3><i className="fas fa-images"></i> Gallery</h3>
        </div>
        <div className="dashboard-card-body">
          <p style={{ ...muted, marginBottom: 16 }}>Share your hostel moments. Photos go live after admin approval.</p>
          <div id="galleryAlert">
            {alert && (
              <div className={`alert alert-${alert.type}`}>
                {alert.icon && <><i className="fas fa-exclamation-triangle"></i>{' '}</>}{alert.msg}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label>Choose Photo</label>
              <input type="file" className="form-control" id="galleryUploadFile" accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/*" ref={fileRef} />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: 4, display: 'block' }}>Accepts: JPG, PNG, GIF, WEBP, BMP and more</small>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 2 }}>
              <label>Caption (optional)</label>
              <input type="text" className="form-control" id="galleryUploadCaption" placeholder="e.g. Common Room" value={caption} onChange={e => setCaption(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={uploadMyGallery}><i className="fas fa-upload"></i> Upload Photo</button>
          </div>

          {/* Community Gallery */}
          <h4 style={{ marginBottom: 4, fontSize: '0.9rem', fontWeight: 700 }}><i className="fas fa-globe" style={{ color: 'var(--primary)', marginRight: 5 }}></i>Community Gallery</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 12 }}>Approved photos from all hostel members.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 28 }} id="communityGalleryGrid">
            {community === null && <p style={muted}>Loading...</p>}
            {community === false && <p style={{ ...muted, gridColumn: '1/-1' }}>Could not load community gallery.</p>}
            {community && !community.length && <p style={{ ...muted, gridColumn: '1/-1' }}>No approved photos in the community gallery yet.</p>}
            {community && community.map(g => (
              <div key={g.id} style={{ borderRadius: 8, overflow: 'hidden', position: 'relative', aspectRatio: '1', cursor: 'pointer' }} onClick={() => setLightbox(uploadUrl(g.image_path))}>
                <img src={uploadUrl(g.image_path)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={g.caption || 'Gallery'} loading="lazy" />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: '0.7rem', padding: '4px 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.caption || ''}</div>
                <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(25,135,84,0.9)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>✓ Approved</div>
              </div>
            ))}
          </div>

          {/* My Submitted Photos */}
          <h4 style={{ marginBottom: 4, fontSize: '0.9rem', fontWeight: 700 }}><i className="fas fa-user-circle" style={{ color: 'var(--secondary)', marginRight: 5 }}></i>My Submitted Photos</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 12 }}>Your uploads — pending photos appear after admin approval.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }} id="myGalleryGrid">
            {mine === null && (faculty ? <div className="spinner"></div> : <p style={muted}>No photos yet.</p>)}
            {mine && !mine.length && <p style={{ color: 'var(--text-muted)' }}>{faculty ? 'No photos uploaded yet.' : 'No photos yet.'}</p>}
            {mine && mine.map(g => faculty ? (
              <div className="gallery-thumb" key={g.id}>
                <img src={uploadUrl(g.image_path)} alt={g.caption || ''} loading="lazy" />
                <div className="gallery-thumb-info">
                  <div className="gallery-thumb-caption">{g.caption || 'No caption'}</div>
                  <span className={`badge-status badge-${(g.status || '').toLowerCase()}`}>{g.status}</span>
                </div>
              </div>
            ) : (
              <div key={g.id} style={{ borderRadius: 8, overflow: 'hidden' }}>
                <img src={uploadUrl(g.image_path)} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} alt="" />
                <div style={{ padding: 6, background: '#f9f9f9', fontSize: '0.75rem' }}>
                  <p style={{ marginBottom: 2, fontWeight: 600 }}>{g.caption || 'No caption'}</p>
                  <span className={`badge-status badge-${g.status.toLowerCase()}`}>{g.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Lightbox src={lightbox} onClose={() => setLightbox('')} />
    </div>
  );
}
