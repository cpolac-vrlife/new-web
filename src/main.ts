import './styles/main.css';
import { CustomSlider } from './scripts/slider_module';
import { initGrids } from './scripts/GridManager';

/**
 * Inicializa todos los componentes de la página
 */
const initApp = () => {
  // Primero configuramos los grids (estructura y paginación)
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

// Ejecución segura del DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}