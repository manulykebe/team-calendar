// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development")
  },
  optimizeDeps: {
    exclude: ["lucide-react"]
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
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Split date handling libraries
          "vendor-date": ["date-fns"],
          // Split form libraries
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          // Split UI components and icons
          "vendor-ui": ["lucide-react", "react-hot-toast"],
          // Split DnD related code
          "vendor-dnd": ["react-dnd", "react-dnd-html5-backend"],
          // Split AWS SDK
          "vendor-aws": ["@aws-sdk/client-s3"]
        },
        // Ensure consistent chunk naming
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name === "index" ? "main" : chunkInfo.name;
          return `assets/js/${name}-[hash].js`;
        },
        // Configure asset file names
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split(".").at(1) || "";
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return "assets/images/[name]-[hash][extname]";
          }
          if (/css/i.test(extType)) {
            return "assets/css/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
        // Configure entry chunk naming
        entryFileNames: "assets/js/[name]-[hash].js"
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgZGVmaW5lOiB7XG4gICAgJ3Byb2Nlc3MuZW52Lk5PREVfRU5WJzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHwgJ2RldmVsb3BtZW50JylcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaG1yOiB7XG4gICAgICBvdmVybGF5OiB0cnVlXG4gICAgfSxcbiAgICB3YXRjaDoge1xuICAgICAgdXNlUG9sbGluZzogdHJ1ZVxuICAgIH1cbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgLy8gY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAvLyBTcGxpdCBSZWFjdCBhbmQgcmVsYXRlZCBwYWNrYWdlc1xuICAgICAgICAgICd2ZW5kb3ItcmVhY3QnOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gU3BsaXQgZGF0ZSBoYW5kbGluZyBsaWJyYXJpZXNcbiAgICAgICAgICAndmVuZG9yLWRhdGUnOiBbJ2RhdGUtZm5zJ10sXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gU3BsaXQgZm9ybSBsaWJyYXJpZXNcbiAgICAgICAgICAndmVuZG9yLWZvcm1zJzogWydyZWFjdC1ob29rLWZvcm0nLCAnQGhvb2tmb3JtL3Jlc29sdmVycycsICd6b2QnXSxcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBTcGxpdCBVSSBjb21wb25lbnRzIGFuZCBpY29uc1xuICAgICAgICAgICd2ZW5kb3ItdWknOiBbJ2x1Y2lkZS1yZWFjdCcsICdyZWFjdC1ob3QtdG9hc3QnXSxcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBTcGxpdCBEbkQgcmVsYXRlZCBjb2RlXG4gICAgICAgICAgJ3ZlbmRvci1kbmQnOiBbJ3JlYWN0LWRuZCcsICdyZWFjdC1kbmQtaHRtbDUtYmFja2VuZCddLFxuXG4gICAgICAgICAgLy8gU3BsaXQgQVdTIFNES1xuICAgICAgICAgICd2ZW5kb3ItYXdzJzogWydAYXdzLXNkay9jbGllbnQtczMnXSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8gRW5zdXJlIGNvbnNpc3RlbnQgY2h1bmsgbmFtaW5nXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAoY2h1bmtJbmZvKSA9PiB7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IGNodW5rSW5mby5uYW1lID09PSAnaW5kZXgnID8gJ21haW4nIDogY2h1bmtJbmZvLm5hbWU7XG4gICAgICAgICAgcmV0dXJuIGBhc3NldHMvanMvJHtuYW1lfS1baGFzaF0uanNgO1xuICAgICAgICB9LFxuICAgICAgICAvLyBDb25maWd1cmUgYXNzZXQgZmlsZSBuYW1lc1xuICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgIGNvbnN0IGV4dFR5cGUgPSBhc3NldEluZm8ubmFtZT8uc3BsaXQoJy4nKS5hdCgxKSB8fCAnJztcbiAgICAgICAgICBpZiAoL3BuZ3xqcGU/Z3xzdmd8Z2lmfHRpZmZ8Ym1wfGljby9pLnRlc3QoZXh0VHlwZSkpIHtcbiAgICAgICAgICAgIHJldHVybiAnYXNzZXRzL2ltYWdlcy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdJztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKC9jc3MvaS50ZXN0KGV4dFR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2Fzc2V0cy9jc3MvW25hbWVdLVtoYXNoXVtleHRuYW1lXSc7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nO1xuICAgICAgICB9LFxuICAgICAgICAvLyBDb25maWd1cmUgZW50cnkgY2h1bmsgbmFtaW5nXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanMnXG4gICAgICB9XG4gICAgfVxuICB9XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUVsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsUUFBUTtBQUFBLElBQ04sd0JBQXdCLEtBQUssVUFBVSxRQUFRLElBQUksWUFBWSxhQUFhO0FBQUEsRUFDOUU7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxjQUFjO0FBQUEsRUFDMUI7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxJQUNYO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxZQUFZO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFdBQVc7QUFBQTtBQUFBLElBRVgsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBO0FBQUEsVUFFWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUE7QUFBQSxVQUd6RCxlQUFlLENBQUMsVUFBVTtBQUFBO0FBQUEsVUFHMUIsZ0JBQWdCLENBQUMsbUJBQW1CLHVCQUF1QixLQUFLO0FBQUE7QUFBQSxVQUdoRSxhQUFhLENBQUMsZ0JBQWdCLGlCQUFpQjtBQUFBO0FBQUEsVUFHL0MsY0FBYyxDQUFDLGFBQWEseUJBQXlCO0FBQUE7QUFBQSxVQUdyRCxjQUFjLENBQUMsb0JBQW9CO0FBQUEsUUFDckM7QUFBQTtBQUFBLFFBRUEsZ0JBQWdCLENBQUMsY0FBYztBQUM3QixnQkFBTSxPQUFPLFVBQVUsU0FBUyxVQUFVLFNBQVMsVUFBVTtBQUM3RCxpQkFBTyxhQUFhLElBQUk7QUFBQSxRQUMxQjtBQUFBO0FBQUEsUUFFQSxnQkFBZ0IsQ0FBQyxjQUFjO0FBQzdCLGdCQUFNLFVBQVUsVUFBVSxNQUFNLE1BQU0sR0FBRyxFQUFFLEdBQUcsQ0FBQyxLQUFLO0FBQ3BELGNBQUksa0NBQWtDLEtBQUssT0FBTyxHQUFHO0FBQ25ELG1CQUFPO0FBQUEsVUFDVDtBQUNBLGNBQUksT0FBTyxLQUFLLE9BQU8sR0FBRztBQUN4QixtQkFBTztBQUFBLFVBQ1Q7QUFDQSxpQkFBTztBQUFBLFFBQ1Q7QUFBQTtBQUFBLFFBRUEsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
