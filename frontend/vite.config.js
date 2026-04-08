import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Forward all /auth requests to the FastAPI backend in dev
      '/auth': {
        target: 'http://localhost:8003',
        changeOrigin: true,
      },
    },
  },
})
