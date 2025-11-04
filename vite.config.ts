import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // El bloque `define` para las variables de entorno se ha eliminado.
  // Las claves de API ahora se gestionan a través de la interfaz de usuario y se guardan en el almacenamiento local,
  // eliminando la dependencia de las variables de entorno en tiempo de compilación.
})
