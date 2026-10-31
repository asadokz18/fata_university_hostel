// ============================================
// API client (replaces the fetch('api/xxx.php?action=...') calls)
// ============================================
// Leave VITE_API_URL empty in development (Vite proxies /api to the backend).
// In production set it to the deployed backend URL, e.g. https://my-api.vercel.app
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// Turns a stored path such as "assets/uploads/profile/x.jpg" into a loadable URL
export function uploadUrl(path) {
  if (!path) return '';
  if (/^(https?:|data:)/.test(path)) return path;
  return `${API_URL}/${String(path).replace(/^\/+/, '')}`;
}

async function request(method, path, body) {
  try {
    const token = localStorage.getItem('hostel_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, credentials: 'include', headers };
    if (body instanceof FormData) {
      opts.body = body;
    } else if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`${API_URL}/api${path}`, opts);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    if (res.status === 413) {
      return { success: false, message: 'File is too large for the server. Please select an image under 4MB.' };
    }
    const text = await res.text();
    return { success: false, message: text || `Server error (${res.status})` };
  } catch (err) {
    return { success: false, message: err?.message || 'Connection error.' };
  }
}

export const api = {
  get: path => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  put: (path, body = {}) => request('PUT', path, body),
  del: path => request('DELETE', path)
};

// Builds a FormData from a plain object (skips null/undefined values)
export function toFormData(obj) {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });
  return fd;
}
