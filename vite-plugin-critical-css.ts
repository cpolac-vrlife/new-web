/**
 * Vite plugin: Inline Critical CSS
 * 
 * Lee src/styles/critical.css y lo inyecta minificado
 * dentro de un <style> en el <head> de cada página HTML.
 * 
 * Esto garantiza que las propiedades de layout above-the-fold
 * se aplican ANTES de que cualquier CSS externo cargue,
 * eliminando CLS (Cumulative Layout Shift) por completo.
 * 
 * En dev mode, Vite inyecta CSS vía JS (async), así que
 * el critical inline es especialmente importante ahí.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Plugin } from 'vite';

export function inlineCriticalCSS(): Plugin {
  let criticalCSS = '';
  let criticalPath = '';
  let isDev = false;

  function readAndMinify(): string {
    try {
      const raw = readFileSync(criticalPath, 'utf-8');
      return raw
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,>~+])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
    } catch (e) {
      console.warn('[critical-css] No se encontró src/styles/critical.css');
      return '';
    }
  }

  return {
    name: 'vite-plugin-inline-critical-css',
    enforce: 'pre',

    configResolved(config) {
      criticalPath = resolve(config.root, 'src/styles/critical.css');
      isDev = config.command === 'serve';
      criticalCSS = readAndMinify();
    },

    transformIndexHtml(html) {
      // En dev mode, re-leer el archivo en cada request para hot-reload
      if (isDev) {
        criticalCSS = readAndMinify();
      }

      if (!criticalCSS) return html;

      const styleTag = `<style id="critical-css">${criticalCSS}</style>`;
      
      // Inyectar justo después de <meta name="viewport">
      return html.replace(
        /(<meta\s+name="viewport"[^>]*>)/i,
        `$1\n  ${styleTag}`
      );
    }
  };
}
