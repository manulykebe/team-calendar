import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true
    }
  },
  build: {
    sourcemap: true,
    // chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React and related packages
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // Split date handling libraries
          'vendor-date': ['date-fns'],
          
          // Split form libraries
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Split UI components and icons
          'vendor-ui': ['lucide-react', 'react-hot-toast'],
          
          // Split DnD related code
          'vendor-dnd': ['react-dnd', 'react-dnd-html5-backend'],

          // Split AWS SDK
          'vendor-aws': ['@aws-sdk/client-s3'],
        },
        // Ensure consistent chunk naming
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name === 'index' ? 'main' : chunkInfo.name;
          return `assets/js/${name}-[hash].js`;
        },
        // Configure asset file names
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').at(1) || '';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/css/i.test(extType)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        // Configure entry chunk naming
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    }
  }
});