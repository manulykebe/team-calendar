import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: './', // Ensure this points to the correct directory
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000
  }
})