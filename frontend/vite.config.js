import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the API and the uploaded files are proxied to the Express backend,
// so the login cookie works without any CORS setup.
const BACKEND = 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/assets/uploads': { target: BACKEND, changeOrigin: true }
    }
  }
});
