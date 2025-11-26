import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,                // porta default do Vite
    host: true,                // permite acesso externo (docker)
    watch: {
      usePolling: true,        // hot reload funciona dentro do docker
    },
    proxy: {
      // Encaminha chamadas "/api" para o Laravel (backend)
      '/api': {
        target: process.env.VITE_API_URL || 'http://backend:9000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',            // saída padrão do build
  },
})
