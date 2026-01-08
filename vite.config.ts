
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 7001,
    strictPort: true,
    // Set to true to allow all hosts (localhost, ngrok, etc.) and prevent "Connection reset by peer"
    allowedHosts: true,
    hmr: {
      clientPort: 7001,
    },
    watch: {
      usePolling: true
    }
  }
})
