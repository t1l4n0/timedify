import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Cast plugin to any to avoid type mismatch between Vite versions
  plugins: [tsconfigPaths() as any],
  test: {
    environment: 'jsdom',
  },
});
