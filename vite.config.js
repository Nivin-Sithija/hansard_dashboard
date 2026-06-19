import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split vendor libraries into their own chunk so they can be cached separately.
        // Rolldown expects manualChunks to be a function.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('react-router')) return 'react';
          if (id.includes('/d3')) return 'd3';
          if (id.includes('/lucide-react/')) return 'lucide';
        },
      }
    },
    // Inline smaller assets directly
    assetsInlineLimit: 8192,
    // Generate source maps for easier debugging on Vercel
    sourcemap: false,
  }
})
