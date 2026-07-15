import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(), // Tailwind v4 plugin — không cần postcss.config.js
    react(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,    // Bật WebSocket proxy cho STOMP/SockJS
      },
      '/ws-native': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,    // Native WebSocket endpoint (không SockJS)
      },
    },
  },
})
