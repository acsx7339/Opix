import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Fallback to empty string if undefined to prevent "undefined" being injected as code
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
    server: {
      proxy: {
        // In Docker, use service name instead of localhost
        '/api': {
          target: process.env.VITE_API_URL || 'http://server:3001',
          changeOrigin: true,
        },
      },
    },
  };
});