import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures assets are loaded relative to index.html, perfect for GitHub Pages
  server: {
    watch: {
      ignored: ['**/.backup/**']
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
