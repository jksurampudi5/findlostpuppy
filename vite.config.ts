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
  ],
  base: process.env.CAPACITOR_BUILD === 'true'
    ? '/'
    : (process.env.NODE_ENV === 'production' ? '/findlostpuppy/' : '/'),
})
