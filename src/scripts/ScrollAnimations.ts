/**
 * ScrollAnimations Module
 * Observa elementos y les añade la clase 'is-visible' cuando entran en el viewport.
 * Las animaciones CSS se gatan detrás de esta clase para que solo se ejecuten al hacer scroll.
 * 
 * NOTA: No afecta a los .swiper-slide, cuya visibilidad la gestiona CustomSlider.
 */

const OBSERVED_SELECTORS = [
  '.cards-grid .card:not(.card--skeleton)',
  '.hero-banner__content',
];

/** Set para no observar el mismo elemento dos veces */
const observed = new WeakSet<Element>();

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

/**
 * Escanea el DOM y observa los elementos que coincidan con los selectores.
 * Puede llamarse varias veces (ej. tras cargar contenido dinámico).
 */
export function initScrollAnimations(): void {
  OBSERVED_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (!observed.has(el)) {
        observed.add(el);
        observer.observe(el);
      }
    });
  });
}
