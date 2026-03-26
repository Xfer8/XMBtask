import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: '/XMBtask/', — only needed for production build, dev runs at root
  base: process.env.NODE_ENV === 'production' ? '/XMBtask/' : '/',
})
