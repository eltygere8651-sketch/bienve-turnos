import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Define las variables de entorno para el código del cliente.
  // Este método asume que las variables (process.env.GOOGLE_CLIENT_ID, etc.)
  // son inyectadas por el entorno de despliegue (ej. AISTUDIO secrets).
  // Esto elimina la necesidad de `loadEnv` y archivos .env, resolviendo
  // el error interno causado por problemas de acceso al sistema de archivos.
  define: {
    'process.env.GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID),
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  }
})