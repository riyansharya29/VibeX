import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // bind 0.0.0.0 so the live preview proxy works
    port: 5173,
    allowedHosts: true,  // accept the sandbox preview hostnames
  },
  preview: { host: true, allowedHosts: true },
})
