import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    hmr: {
      overlay: true,
    },
    proxy: {
      '/api': {
        target: 'https://www.themealdb.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // Rewrite API calls to MealDB endpoints
          if (path.startsWith('/api/recipes/search')) {
            const url = new URL(path, 'http://localhost');
            const query = url.searchParams.get('query');
            return `/api/json/v1/1/search.php?s=${encodeURIComponent(query || '')}`;
          }
          if (path.startsWith('/api/recipes/random')) {
            return '/api/json/v1/1/random.php';
          }
          if (path.startsWith('/api/health')) {
            return '/api/json/v1/1/categories.php';
          }
          return path;
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          });
          proxy.on('error', (err, req, res) => {
            // Log proxy errors without console
            res.writeHead(500, {
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
