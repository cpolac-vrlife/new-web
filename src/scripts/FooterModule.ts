// src/scripts/FooterModule.ts

class Footer {
  private footer: HTMLElement | null;
  
  constructor() {
    this.footer = document.querySelector('.footer');
    this.init();
  }

  private init() {
    this.animateOnScroll();
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
