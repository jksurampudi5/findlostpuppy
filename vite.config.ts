import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'geojson-loader',
      transform(code, id) {
        if (id.endsWith('.geojson')) {
          return {
            code: `export default ${code};`,
            map: null,
          };
        }
      },
    },
    {
      name: 'adoption-api-endpoints',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url?.split('?')[0];
          if (url === '/api/extract-pet-from-image') {
            const { handleExtractPetFromImage } = await import('./server/adoptionApiServer.js');
            return handleExtractPetFromImage(req, res);
          }
          if (url === '/api/adoption-listings') {
            const { handleAdoptionListings } = await import('./server/adoptionApiServer.js');
            return handleAdoptionListings(req, res);
          }
          next();
        });
      },
    },
  ],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: process.env.CAPACITOR_BUILD === 'true'
    ? '/'
    : (process.env.VITE_BASE_URL || '/'),
})
