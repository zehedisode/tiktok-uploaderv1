import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5174,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Performans optimizasyonları
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Console loglarını production'da kaldır
        drop_debugger: true,
      },
    },
    // Bundle size optimizasyonu
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk'ları ayır
          'react-vendor': ['react', 'react-dom'],
          'lucide': ['lucide-react'],
        },
      },
    },
    // Chunk size uyarı limiti
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

