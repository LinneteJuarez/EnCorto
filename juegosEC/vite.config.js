import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' para embeberse en dist/juegos-ec/ dentro del sitio En Corto
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5174,
    strictPort: true,
  },
})
