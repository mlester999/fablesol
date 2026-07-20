import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
  resolve: {
    alias: {
      // Tests run in Node, where the real 'server-only' marker throws.
      'server-only': path.resolve(__dirname, './src/test/server-only-stub.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
