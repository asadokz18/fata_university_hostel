// #sec-gallery
import { useEffect, useRef, useState } from 'react';
import { api, toFormData, uploadUrl } from '../../api';
import { compressImage } from '../../helpers';
import { Badge, Loading, Msg, NoData } from './common';

export default function GallerySection({ confirm, refreshDashboard }) {
  const [items, setItems] = useState(null);
  const [alert, setAlert] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const loadGalleryAdmin = async () => {
    setItems(null);
    const data = await api.get('/admin/gallery');
    setItems(data.gallery || []);
  };

  useEffect(() => { loadGalleryAdmin(); }, []);

  const uploadGallery = async () => {
    let file = fileRef.current?.files[0];
    if (!file) { setAlert({ type: 'warning', msg: 'Please select an image.' }); return; }
    
    setUploading(true);
    setAlert(null);
    try {
      file = await compressImage(file);
      const fd = toFormData({ caption });
      fd.append('photo', file);
      const data = await api.post('/admin/gallery', fd);
      setAlert({ type: data.success ? 'success' : 'danger', msg: data.message });
      if (data.success) {
        fileRef.current.value = '';
        setCaption('');
        loadGalleryAdmin();
      }
    } catch (e) {
      setAlert({ type: 'danger', msg: e.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const updateGallery = (id, status) => {
    confirm(`Confirm ${status}`, `Are you sure you want to ${status.toLowerCase()} this gallery photo?`, async () => {
      await api.put(`/admin/gallery/${id}`, { status });
      loadGalleryAdmin(); refreshDashboard();
    });
  };

  const deleteGallery = async id => {
    await api.del(`/admin/gallery/${id}`);
    loadGalleryAdmin(); refreshDashboard();
  };

  return (
    <div id="sec-gallery">
      <div className="content-card">
        <div className="content-card-header"><h3><i className="fas fa-images"></i> Gallery Management</h3></div>
        <div className="content-card-body">
          <div id="galleryAdminAlert"><Msg a={alert} /></div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label>Photo (Any Image Format)</label>
              <input type="file" className="form-control" id="galleryFile" accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/*" ref={fileRef} />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: 4, display: 'block' }}>Accepts: JPG, PNG, GIF, WEBP, BMP and more</small>
            </div>
            <div className="form-group" style={{ margin: 0, flex: 2 }}>
              <label>Caption (optional)</label>
              <input type="text" className="form-control" id="galleryCaption" placeholder="e.g. Hostel Library" value={caption} onChange={e => setCaption(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={uploadGallery} disabled={uploading}>
              <i className={uploading ? 'fas fa-spinner fa-spin' : 'fas fa-upload'}></i> {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          <h4 style={{ marginBottom: 14, fontSize: '0.95rem' }}>All Submissions</h4>
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Uploaded By</th><th>Image</th><th>Caption</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody id="galleryAdminBody">
                {items === null && <Loading cols={6} />}
                {items && !items.length && <NoData cols={6}>No gallery items.</NoData>}
                {items && items.map(g => (
                  <tr key={g.id}>
                    <td>{new Date(g.uploaded_at).toLocaleDateString()}</td>
                    <td>{g.uploaded_by_role === 'Admin' ? '🔧 Admin' : '👤 ' + g.uploaded_by_role}</td>
                    <td>
                      <img
                        src={uploadUrl(g.image_path)}
                        style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 6 }}
                        alt=""
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </td>
                    <td>{g.caption || '—'}</td>
                    <td><Badge cls={g.status.toLowerCase()}>{g.status}</Badge></td>
                    <td>
                      {g.status === 'Pending' && <button className="btn btn-sm" style={{ background: '#198754', color: '#fff', marginRight: 4 }} onClick={() => updateGallery(g.id, 'Approved')}><i className="fas fa-check"></i></button>}
                      <button className="btn btn-danger btn-sm" onClick={() => deleteGallery(g.id)}><i className="fas fa-trash"></i></button>
                    </td>
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
