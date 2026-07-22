import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.BACKEND_PROXY_TARGET || 'http://localhost:8080'
  const allowedHosts = (env.DEV_ALLOWED_HOSTS || '')
    .split(',')
    .map(host => host.trim())
    .filter(Boolean)

  return {
    plugins: [
      tailwindcss(),
      react(),
    ],
    server: {
      host: env.DEV_SERVER_HOST || 'localhost',
      port: Number(env.DEV_SERVER_PORT || 5173),
      allowedHosts,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/auth': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
        '/ws-native': {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})
