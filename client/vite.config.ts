import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Permet d'accéder au serveur depuis d'autres appareils sur le réseau local
    port: 5173, // Port par défaut pour le serveur de développement
    watch: {
      usePolling: true, // utile sur Windows/Docker
    },
    strictPort: true,
  },
})
