// ============================================
// Page wrapper
// The PHP site loaded a different set of <link rel="stylesheet"> files on every
// HTML page. This wrapper does the same: it attaches the page's own CSS files
// (served untouched from /public/assets/css), waits for them to load, sets the
// <title>, and removes the stylesheets again when the page is left, so classes
// such as .sidebar / .topbar of different pages never collide.
// ============================================
import { useEffect, useState } from 'react';

export default function Page({ styles = [], title, children }) {
  const [ready, setReady] = useState(false);
  const key = styles.join('|');

  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  useEffect(() => {
    setReady(false);
    let pending = styles.length;
    if (!pending) { setReady(true); return undefined; }

    const done = () => { pending -= 1; if (pending <= 0) setReady(true); };
    const links = styles.map(file => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/assets/css/${file}`;
      link.onload = done;
      link.onerror = done;
      document.head.appendChild(link);
      return link;
    });

    return () => links.forEach(l => l.remove());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return ready ? children : null;
}
