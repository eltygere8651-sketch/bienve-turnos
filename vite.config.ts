
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Inyectamos las variables de entorno para que process.env funcione en el navegador
    'process.env.FIREBASE_CONFIG': JSON.stringify(process.env.FIREBASE_CONFIG),
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  }
})
