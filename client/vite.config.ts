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
        // Point to localhost instead of Docker container name
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});