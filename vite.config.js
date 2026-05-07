import {defineConfig} from 'vite'

export default defineConfig({
  // Needed so dist/ works when served from any subpath (and for classmates opening it in different hosts)
  base: './',
})

