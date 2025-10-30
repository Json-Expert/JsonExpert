import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: parseInt(env.VITE_DEV_PORT || '12355'),
      open: false,
      host: env.VITE_DEV_HOST || '0.0.0.0', // Listen on all interfaces
      hmr: {
        host: 'localhost'
      },
      // Allow connections from specified domains
      cors: {
        origin: env.VITE_ALLOWED_DOMAINS
          ? env.VITE_ALLOWED_DOMAINS.split(',').map((d: string) => d.trim())
          : true,
        credentials: true,
      },
    },
    build: {
      target: 'es2020',
      sourcemap: true,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'zustand'],
    },
    define: {
      // Make env variables available in the app
      'import.meta.env.VITE_ALLOWED_DOMAINS': JSON.stringify(env.VITE_ALLOWED_DOMAINS || ''),
    },
  };
});