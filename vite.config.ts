import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Make process.env available in the client-side code
    // This is necessary for the Google Drive integration to access environment variables
    'process.env': process.env
  }
})
