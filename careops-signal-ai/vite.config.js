import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://careops-signal-ai.onrender.com',
        changeOrigin: true,
      }
    }
  }
});
