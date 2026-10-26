import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // API Symfony (back/) servie par `php -S 127.0.0.1:8000 -t public`.
  server: { proxy: { '/api': 'http://127.0.0.1:8000' } },
})
