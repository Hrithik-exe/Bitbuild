import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApiRequest } from './server/api.js';

function localApiPlugin(): Plugin {
  return {
    name: 'bitbuild-local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api')) {
          await handleApiRequest(req, res);
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api')) {
          await handleApiRequest(req, res);
        } else {
          next();
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
  server: {
    port: 5173
  }
});
