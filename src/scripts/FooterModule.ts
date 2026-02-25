// src/scripts/FooterModule.ts

class Footer {
  private footer: HTMLElement | null;
  
  constructor() {
    this.footer = document.querySelector('.footer');
    this.init();
  }

  private init() {
    this.animateOnScroll();
    this.initAccordions();
  }

  /** Open/close footer accordions based on viewport width */
  private initAccordions() {
    const accordions = this.footer?.querySelectorAll<HTMLDetailsElement>('.footer__accordion');
    if (!accordions?.length) return;

    const mq = window.matchMedia('(min-width: 1024px)');

    const sync = (isDesktop: boolean) => {
      accordions.forEach((el) => {
        if (isDesktop) {
          el.setAttribute('open', '');
        } else {
          el.removeAttribute('open');
        }
      });
    };

    // Initial sync
    sync(mq.matches);

    // Listen for viewport changes
    mq.addEventListener('change', (e) => sync(e.matches));
  }

  private animateOnScroll() {
    if (!this.footer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('footer--visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    observer.observe(this.footer);
  }
}

export const initFooter = () => {
  new Footer();
};
