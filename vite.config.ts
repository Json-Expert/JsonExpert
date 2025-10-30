import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 12355,
    open: false,
    host: '0.0.0.0', // Listen on all interfaces
    hmr: {
      host: 'localhost'
    }
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand'],
  },
});