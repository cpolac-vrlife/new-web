import { defineConfig } from 'vite';
import injectHTML from 'vite-plugin-html-inject';
import nesting from 'postcss-nesting'; 
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [injectHTML({
    sourceAttr: 'src',
  })],
  css: {
    // Eliminamos la duplicidad y la referencia al archivo externo
    // Al definir los plugins aquí, Vite ignora el postcss.config.cjs
    postcss: {
      plugins: [
        nesting(), 
        autoprefixer()
      ],
    },
  },
  server: {
    port: 3000,
    open: true 
  },
  build: {
    // Esto asegura que el CSS final sea compatible y no use sintaxis experimental
    cssTarget: 'chrome80', 
  }
});