import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    outDir: '../../dist/web',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/web/index.html',
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
        format: 'iife',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  root: 'src/web'
})