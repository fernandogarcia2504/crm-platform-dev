import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  // Puerto fijo: la consola de operación corre en 5175 (coincide con
  // PLATFORM_ORIGIN del backend).
  server: {
    port: 5175,
    strictPort: true
  }
})
