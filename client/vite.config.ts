import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunk
          AxzYQgNX: [
            'react',
            'react-dom',
            'react-hot-toast'
          ],
          // Calendar related
          ySMyEcwn: [
            '@fullcalendar/core',
            '@fullcalendar/daygrid',
            '@fullcalendar/interaction',
            '@fullcalendar/multimonth',
            '@fullcalendar/react',
            '@fullcalendar/timegrid'
          ],
          // UI components
          NtRNaexV: [
            '@headlessui/react',
            'lucide-react'
          ],
          // Utils
          GOEGMOtQ: [
            'axios',
            'date-fns',
            'js-cookie',
            'crypto-js'
          ]
        }
      }
    }
  },
  server: {
    port: 3000
  }
})