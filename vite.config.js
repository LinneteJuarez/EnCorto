import {defineConfig} from 'vite'

export default defineConfig({
  root: 'src',
  // Needed so dist/ works when served from any subpath (and for classmates opening it in different hosts)
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})

