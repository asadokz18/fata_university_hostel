// ============================================
// Shared helpers (the small functions that were copy-pasted in every page JS)
// ============================================

export function initialsOf(name) {
  return (name || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// '16 Apr 2026'
export function formatDatePK(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return str;
  }
}

// plain toLocaleDateString() used in dashboard tables
export const localDate = v => new Date(v).toLocaleDateString();

export function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// "Wednesday, 29 October 2026"
export function todayLong() {
  return new Date().toLocaleDateString('en-PK', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// Loads an external <script> once (QRCode.js CDN)
const loadedScripts = {};
export function loadScript(src) {
  if (!loadedScripts[src]) {
    loadedScripts[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }
  return loadedScripts[src];
}

export const QR_SCRIPT = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';

// ---------- print windows ("Download PDF" buttons, receipts) ----------
const REPORT_CSS = `
  body { font-family: 'DM Sans', sans-serif; color: #333; padding: 40px; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #326a33; padding-bottom: 20px; }
  .header h1 { margin: 0; color: #326a33; font-size: 24px; }
  .header p { margin: 5px 0 0; color: #666; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 13px; }
  th { background-color: #f4f6f8; font-weight: bold; color: #326a33; }
  tr:nth-child(even) { background-color: #fafafa; }
  .footer { margin-top: 40px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
  .print-btn { display: inline-block; background-color: #326a33; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: bold; border-radius: 4px; cursor: pointer; margin-bottom: 20px; }
  @media print {
    .print-btn { display: none; }
    body { padding: 0; }
  }`;

function openWindow(html) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

/**
 * Printable table report.
 * headerLines: array of HTML strings shown under the title
 */
export function openTableReport({ title, headerLines, columns, rows }) {
  const head = headerLines.map(l => `<p>${l}</p>`).join('');
  const body = rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  openWindow(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${esc(title)}</title>
      <style>${REPORT_CSS}</style>
    </head>
    <body>
      <div class="header">
        <h1>FATA University Hostel</h1>
        ${head}
      </div>
      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
      <table>
        <thead><tr>${columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>${body}</tbody>
      </table>
      <div class="footer">
        <p>© ${new Date().getFullYear()} FATA University. All rights reserved.</p>
      </div>
    </body>
    </html>
  `);
}

// Fee receipt popup. variant 'faculty' uses the faculty layout, otherwise the student/admin one
export function openReceipt({ receiptNo, name, period, amount, variant }) {
  const amt = parseFloat(amount).toFixed(2);
  if (variant === 'faculty') {
    openWindow(`<!DOCTYPE html><html><head><title>Fee Receipt</title>
    <style>body{font-family:sans-serif;padding:40px;max-width:500px;margin:0 auto}
    h2{color:#326a33;text-align:center}.logo{text-align:center;margin-bottom:20px}
    .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee}
    .footer{margin-top:30px;text-align:center;color:#666;font-size:0.85rem}
    @media print{button{display:none}}</style></head><body>
    <div class="logo"><h2>FATA University Hostel</h2><p>Official Fee Receipt</p></div>
    <div class="row"><span>Receipt No:</span><strong>${esc(receiptNo)}</strong></div>
    <div class="row"><span>Name:</span><strong>${esc(name)}</strong></div>
    <div class="row"><span>Period:</span><strong>${esc(period)}</strong></div>
    <div class="row"><span>Amount:</span><strong>Rs. ${amt}</strong></div>
    <div class="row"><span>Status:</span><strong style="color:#198754">✓ PAID</strong></div>
    <div class="footer"><p>FATA University, Darra Adam Khel, KPK</p><p>info@fu.edu.pk</p></div>
    <br><button onclick="window.print()" style="padding:10px 24px;background:#326a33;color:#fff;border:none;border-radius:8px;cursor:pointer">🖨️ Print Receipt</button>
    </body></html>`);
    return;
  }
  openWindow(`<!DOCTYPE html><html><head><title>Fee Receipt</title><style>body{font-family:sans-serif;padding:40px;max-width:500px;margin:0 auto}h2{color:#326a33;text-align:center}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}@media print{button{display:none}}</style></head><body><h2>FATA University Hostel</h2><h3 style="text-align:center">Fee Receipt</h3><div class="row"><span>Receipt No:</span><strong>${esc(receiptNo)}</strong></div><div class="row"><span>Name:</span><strong>${esc(name || 'Student/Faculty')}</strong></div><div class="row"><span>Period:</span><strong>${esc(period)}</strong></div><div class="row"><span>Amount:</span><strong>Rs. ${amt}</strong></div><div class="row"><span>Status:</span><strong style="color:#198754">PAID</strong></div><br><button onclick="window.print()">🖨️ Print</button></body></html>`);
}

// Compress/resize image in browser to prevent large payloads and stay well within Vercel's 4.5MB limit
export async function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.82) {
  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  if (file.size <= 400 * 1024) return file; // Already small enough (<400KB)

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file);
            } else {
              const compressedFile = new File([blob], file.name, {
                type: mime,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            }
          },
          mime,
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

