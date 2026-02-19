import { CustomSlider } from './scripts/slider_module';
import { initGrids } from './scripts/GridManager';
import { initHeader } from './scripts/HeaderModule';
import { initFooter } from './scripts/FooterModule';
import { initHeroBanner } from './scripts/HeroBannerModule';
import { initDynamicContent } from './scripts/ContentRenderer';
import { initFilters } from './scripts/FilterManager';
import { initSearch } from './scripts/SearchModule';
import { initScrollAnimations } from './scripts/ScrollAnimations';

/**
 * Inicializa componentes críticos above-the-fold (LCP)
 */
const initCritical = () => {
  // Header es above-the-fold, inicializar inmediatamente
  initHeader();

  // Search overlay (se vincula al botón del header)
  initSearch();

  // Hero banner es el LCP candidato, inicializar inmediatamente
  if (document.querySelector('.hero-banner')) {
    initHeroBanner({
      autoPlay: true,
      autoPlayInterval: 6000
    });
  }
};

/**
 * Inicializa componentes no críticos (below-the-fold) de forma diferida
 */
const initDeferred = async () => {
  // Footer está below the fold
  initFooter();

  // Cargar contenido dinámico desde la API (grids y sliders con data-source="api")
  await initDynamicContent();

  // Inicializar filtros de la página /videos
  await initFilters();

  // Re-escanear para observar cards cargadas dinámicamente
  initScrollAnimations();

  // Luego configuramos los grids (estructura y paginación)
  initGrids();

  // Luego inicializamos los sliders (comportamiento)
  const sliders = document.querySelectorAll<HTMLElement>('.swiper');
  sliders.forEach(container => {
    // Buscar el atributo data-slider-items en el contenedor padre o en el propio swiper
    const parentWrapper = container.closest('[data-slider-items]') as HTMLElement;
    const itemsCount = parentWrapper?.getAttribute('data-slider-items') || 
                       container.getAttribute('data-items') || '4';
    
    const wrapper = container.querySelector('.swiper-wrapper');
    
    if (wrapper) {
      // Mapeo de números a clases
      const classMap: { [key: string]: string } = {
        '3': 'three-items',
        '4': 'four-items',
        '5': 'five-items'
      };
      
      const className = classMap[itemsCount];
      if (className) {
        wrapper.classList.add(className);
      }
    }
    
    // Pasamos el gap o configuración necesaria
    new CustomSlider(container, 16);
    
    requestAnimationFrame(() => {
      container.classList.add('swiper-initialized');
    });
  });
};

/**
 * Inicializa la aplicación con prioridades:
 * 1. Crítico (above-the-fold): inmediato
 * 2. Diferido (below-the-fold): tras idle o fallback
 */
const initApp = () => {
  // 1. Inicializar lo crítico inmediatamente
  initCritical();

  // 2. Scroll animations (se activan al hacer scroll)
  initScrollAnimations();

  // 3. Diferir lo no crítico usando requestIdleCallback (o fallback)
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => initDeferred(), { timeout: 2000 });
  } else {
    // Fallback: usar setTimeout con un pequeño delay
    setTimeout(() => initDeferred(), 100);
  }
};

// Ejecución segura del DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Soporte para back/forward cache (bfcache)
// Restaurar estado cuando se vuelve desde el cache
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Página restaurada desde bfcache, reinicializar componentes si es necesario
    console.log('Page restored from bfcache');
  }
});

// No usar unload/beforeunload ya que previenen bfcache
// Usar pagehide para cleanup si es necesario
window.addEventListener('pagehide', () => {
  // Cleanup ligero si es necesario
});