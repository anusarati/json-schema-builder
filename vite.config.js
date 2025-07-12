import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Your source code is in the 'src' directory.
  root: 'src',

  // The base URL for GitHub Pages.
  // Make sure this matches your repository name.
  base: '/json-schema-builder/',

  build: {
    // Correctly points to the 'dist' folder at the project root.
    outDir: '../dist',
    emptyOutDir: true,
  },
});
