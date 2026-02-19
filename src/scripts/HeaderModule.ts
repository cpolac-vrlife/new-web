// src/scripts/HeaderModule.ts

class Header {
  private header: HTMLElement | null;
  private hasHeroBanner: boolean = false;
  private joinBtn: HTMLElement | null;

  constructor() {
    this.header = document.querySelector('.header');
    this.hasHeroBanner = document.querySelector('.hero-banner') !== null;
    this.joinBtn = document.querySelector('.mobile-join-btn');

    this.init();
  }

  private init() {
    this.attachEventListeners();
    this.handleScroll();
    this.highlightActiveNavItem();
    this.observeHeroForJoinBtn();
    
    // Si hay hero banner, activar modo transparente
    if (this.hasHeroBanner && this.header) {
      this.header.classList.add('header--transparent');
    }

    // Si no hay hero banner, mostrar JOIN directamente
    if (!this.hasHeroBanner && this.joinBtn) {
      this.joinBtn.classList.add('is-visible');
    }
  }

  private attachEventListeners() {
    // Scroll behavior
    window.addEventListener('scroll', () => this.handleScroll());

    // Mobile search button in bottom nav → triggers the same search overlay
    const mobileSearchBtn = document.getElementById('mobile-search-toggle');
    if (mobileSearchBtn) {
      mobileSearchBtn.addEventListener('click', () => {
        const searchToggle = document.getElementById('search-toggle');
        if (searchToggle) searchToggle.click();
      });
    }
  }

  /** Highlight the active bottom nav item based on the current URL */
  private highlightActiveNavItem() {
    const path = window.location.pathname;
    const navItems = document.querySelectorAll<HTMLElement>('.mobile-nav__item');
    
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href && path.includes(href.replace('.html', ''))) {
        item.classList.add('active');
      }
    });
  }

  /** Show/hide the mobile JOIN button based on hero banner visibility */
  private observeHeroForJoinBtn() {
    const hero = document.querySelector('.hero-banner');
    if (!hero || !this.joinBtn) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.joinBtn!.classList.remove('is-visible');
        } else {
          this.joinBtn!.classList.add('is-visible');
        }
      },
      { threshold: 0 }
    );

    obs.observe(hero);
  }

  private handleScroll() {
    if (!this.header) return;

    // Si hay hero banner, manejar transparencia
    if (this.hasHeroBanner) {
      if (window.scrollY > 100) {
        this.header.classList.add('header--scrolled');
      } else {
        this.header.classList.remove('header--scrolled');
      }
    } else {
      // Comportamiento normal sin hero banner
      if (window.scrollY > 50) {
        this.header.classList.add('header--scrolled');
      } else {
        this.header.classList.remove('header--scrolled');
      }
    }
  }
}

export const initHeader = () => {
  new Header();
};
