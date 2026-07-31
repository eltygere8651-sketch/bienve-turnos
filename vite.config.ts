
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  },
  build: {
    rollupOptions: {
      // Indicamos a Rollup que no intente empaquetar estas librerías (usando regex para mayor seguridad),
      // ya que se resolverán en el navegador mediante el importmap del index.html
      external: [
        /^firebase\/.+/
      ]
    }
  }
})
