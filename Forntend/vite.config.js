import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In development the backend is reached through this proxy, so cookies stay same-origin
    proxy: {
      '/api': BACKEND_URL,
      '/auth': BACKEND_URL,
      '/uploads': BACKEND_URL,
      '/socket.io': { target: BACKEND_URL, ws: true },
    },
  },
})
