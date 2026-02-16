// src/scripts/HeaderModule.ts

class Header {
  private header: HTMLElement | null;
  private mobileToggle: HTMLButtonElement | null;
  private nav: HTMLElement | null;
  private isMenuOpen: boolean = false;
  private hasHeroBanner: boolean = false;

  constructor() {
    this.header = document.querySelector('.header');
    this.mobileToggle = document.querySelector('.header__mobile-toggle');
    this.nav = document.querySelector('.header__nav');
    this.hasHeroBanner = document.querySelector('.hero-banner') !== null;

    this.init();
  }

  private init() {
    this.attachEventListeners();
    this.handleScroll();
    
    // Si hay hero banner, activar modo transparente
    if (this.hasHeroBanner && this.header) {
      this.header.classList.add('header--transparent');
    }
  }

  private attachEventListeners() {
    // Mobile menu toggle
    if (this.mobileToggle) {
      this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
    }

    // Scroll behavior
    window.addEventListener('scroll', () => this.handleScroll());

    // Close mobile menu on window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024 && this.isMenuOpen) {
        this.toggleMobileMenu();
      }
    });
  }

  private toggleMobileMenu() {
    if (!this.nav) return;

    this.isMenuOpen = !this.isMenuOpen;
    
    if (this.isMenuOpen) {
      this.nav.style.display = 'block';
      this.nav.classList.add('header__nav--open');
      if (this.mobileToggle) {
        const icon = this.mobileToggle.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'close';
      }
    } else {
      this.nav.classList.remove('header__nav--open');
      setTimeout(() => {
        if (this.nav) this.nav.style.display = '';
      }, 300);
      if (this.mobileToggle) {
        const icon = this.mobileToggle.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'menu';
      }
    }
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
