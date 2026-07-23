import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // The backend only allows CORS from http://localhost:3000.
    port: 3000,
    strictPort: true,

    // ---------------------------------------------------------------
    // Why this proxy exists.
    //
    // auth/server.js registers its middleware in this order:
    //
    //     app.use('/api', authRequired, createProxyMiddleware(...));
    //     app.use(express.json());
    //     app.use(cors({ ... credentials: true }));
    //
    // Express runs middleware in registration order, so responses from
    // /api/* are sent before the CORS middleware ever runs and never
    // carry an Access-Control-Allow-Origin header. The browser then
    // blocks them, even though the same request works fine from Node
    // or Postman. /login is declared after cors(), which is why signing
    // in works but reading tables does not.
    //
    // Rather than editing the course-supplied server, we let Vite proxy
    // these paths. The browser sees same-origin requests to
    // localhost:3000, so CORS never applies and cookies are sent
    // normally. This also means no team member has to patch the backend.
    // ---------------------------------------------------------------
    proxy: {
      '/api':    { target: 'http://localhost:3001', changeOrigin: true },
      '/login':  { target: 'http://localhost:3001', changeOrigin: true },
      '/logout': { target: 'http://localhost:3001', changeOrigin: true },
      '/me':     { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
