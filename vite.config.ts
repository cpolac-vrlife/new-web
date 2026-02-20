import { defineConfig } from 'vite';
import injectHTML from 'vite-plugin-html-inject';
import { createHtmlPlugin } from 'vite-plugin-html';
import { inlineCriticalCSS } from './vite-plugin-critical-css';
import nesting from 'postcss-nesting'; 
import autoprefixer from 'autoprefixer';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    inlineCriticalCSS(),
    injectHTML({
      sourceAttr: 'src',
    }),
    createHtmlPlugin({
      minify: true,
    }),
  ],
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
    host: true,
    port: 3000,
    open: true,
    proxy: {
      '/api/vrp': {
        target: 'https://np.virtualrealhub.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vrp/, '/affiliates/json-export/vrp'),
        secure: true
      }
    }
  },
  build: {
    // Esto asegura que el CSS final sea compatible y no use sintaxis experimental
    cssTarget: 'chrome80',
    // Minificación para producción
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Optimizar chunks
    cssCodeSplit: true,
    // Multi-page app - define los puntos de entrada
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        videos: resolve(__dirname, 'videos.html'),
        categories: resolve(__dirname, 'categories.html'),
        'categories-big-tits': resolve(__dirname, 'categories/big-tits.html'),
        models: resolve(__dirname, 'models.html'),
      },
      output: {
        // Mejor hashing para cache
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    }
  }
});