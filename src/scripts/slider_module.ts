export class CustomSlider {
  private container: HTMLElement;
  private wrapper: HTMLElement;
  private nextBtn!: HTMLElement;
  private prevBtn!: HTMLElement;

  private isDragging: boolean = false;
  private startX: number = 0;
  private currentTranslate: number = 0;
  private prevTranslate: number = 0;
  private readonly gap: number;
  private readonly resistance: number = 0.3;

  constructor(container: HTMLElement, spaceBetween: number = 16) {
    this.container = container;
    this.wrapper = container.querySelector('.swiper-wrapper') as HTMLElement;
    this.gap = spaceBetween;

    this.createButtons();
    this.init();
  }

  private createButtons(): void {
  this.prevBtn = document.createElement('div');
  this.prevBtn.className = 'swiper-button-prev swiper-button-disabled';
  // Añadimos el icono de flecha izquierda
  this.prevBtn.innerHTML = '<span class="material-symbols-outlined">chevron_left</span>';

  this.nextBtn = document.createElement('div');
  this.nextBtn.className = 'swiper-button-next';
  // Añadimos el icono de flecha derecha
  this.nextBtn.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';

  this.container.appendChild(this.prevBtn);
  this.container.appendChild(this.nextBtn);
}

  private init(): void {
    this.wrapper.style.cursor = 'grab';
    this.wrapper.style.display = 'flex';
    this.wrapper.style.gap = `${this.gap}px`;
    
    this.nextBtn.addEventListener('click', () => this.moveByButton(1));
    this.prevBtn.addEventListener('click', () => this.moveByButton(-1));

    this.wrapper.addEventListener('mousedown', (e) => this.dragStart(e));
    window.addEventListener('mousemove', (e) => this.dragAction(e));
    window.addEventListener('mouseup', () => this.dragEnd());

    this.wrapper.addEventListener('touchstart', (e) => this.dragStart(e), { passive: true });
    this.wrapper.addEventListener('touchmove', (e) => this.dragAction(e), { passive: false });
    this.wrapper.addEventListener('touchend', () => this.dragEnd());

    this.wrapper.addEventListener('dragstart', (e) => e.preventDefault());

    this.updateButtons();
    this.initObserver(); // Inicializamos el observador de visibilidad
  }

  private initObserver(): void {
    const options = {
      root: this.container, // El contenedor limita qué se considera "visible"
      threshold: 0.2 // Se activa cuando el 20% del slide asoma
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Dejamos de observar este slide para que la animación no se repita
          observer.unobserve(entry.target);
        }
      });
    }, options);

    // Seleccionamos y observamos todos los slides actuales
    const slides = this.wrapper.querySelectorAll('.swiper-slide');
    slides.forEach(slide => observer.observe(slide));
  }

  private getPositionX(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.pageX : event.touches[0].clientX;
  }

  private dragStart(event: MouseEvent | TouchEvent): void {
    this.isDragging = true;
    this.startX = this.getPositionX(event);
    this.wrapper.style.transition = 'none';
    this.wrapper.style.cursor = 'grabbing';
  }

  private dragAction(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;
    
    const currentX = this.getPositionX(event);
    const xDiff = currentX - this.startX;
    let newTranslate = this.prevTranslate + xDiff;

    const maxScroll = this.getMaxScroll();

    if (newTranslate > 0) {
      newTranslate = xDiff * this.resistance;
    } else if (newTranslate < -maxScroll) {
      const overflow = newTranslate + maxScroll;
      newTranslate = -maxScroll + (overflow * this.resistance);
    }

    this.currentTranslate = newTranslate;
    this.applyTransform();
  }

  private dragEnd(): void {
    this.isDragging = false;
    this.wrapper.style.cursor = 'grab';
    this.wrapper.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';

    const maxScroll = this.getMaxScroll();

    if (this.currentTranslate > 0) {
      this.currentTranslate = 0;
    } else if (this.currentTranslate < -maxScroll) {
      this.currentTranslate = -maxScroll;
    }

    this.prevTranslate = this.currentTranslate;
    this.applyTransform();
    this.updateButtons();
  }

  private moveByButton(direction: number): void {
    const slides = Array.from(this.wrapper.children) as HTMLElement[];
    if (slides.length === 0) return;

    const maxScroll = this.getMaxScroll();
    const tolerance = 1;
    
    // Verificar si ya estamos en el límite antes de mover
    if (direction > 0 && this.currentTranslate <= -maxScroll + tolerance) {
      return; // Ya estamos al final, no permitir más movimiento
    }
    if (direction < 0 && this.currentTranslate >= -tolerance) {
      return; // Ya estamos al inicio, no permitir más movimiento
    }

    const slideWidth = slides[0].offsetWidth + this.gap;
    const visibleWidth = this.container.clientWidth;
    const style = window.getComputedStyle(this.wrapper);
    const paddingLeft = parseFloat(style.paddingLeft);
    const paddingRight = parseFloat(style.paddingRight);
    const effectiveVisibleWidth = visibleWidth - paddingLeft - paddingRight;
    const slidesPerView = Math.floor((effectiveVisibleWidth + this.gap) / (slideWidth));
    
    // Mover por el número de slides visibles
    const moveAmount = slideWidth * slidesPerView;
    let newTranslate = this.currentTranslate - (direction * moveAmount);
    
    // Si nos pasamos del límite, ajustar para alinearse perfectamente al final
    if (direction > 0 && newTranslate < -maxScroll) {
      newTranslate = -maxScroll;
    } else if (direction < 0 && newTranslate > 0) {
      newTranslate = 0;
    }
    
    this.currentTranslate = newTranslate;
    this.dragEnd();
  }

  private getMaxScroll(): number {
    // El scrollWidth incluye todo: paddingLeft + contenido + paddingRight
    // Para calcular el máximo desplazamiento, simplemente restamos el ancho visible
    const maxScroll = this.wrapper.scrollWidth - this.container.clientWidth;
    return Math.max(0, maxScroll);
  }

  private applyTransform(): void {
    this.wrapper.style.transform = `translateX(${this.currentTranslate}px)`;
  }

  public updateButtons(): void {
    const maxScroll = this.getMaxScroll();
    const tolerance = 1; // Tolerancia mínima para evitar problemas de redondeo
    const isAtStart = this.currentTranslate >= -tolerance;
    const isAtEnd = this.currentTranslate <= -maxScroll + tolerance;

    this.prevBtn.classList.toggle('swiper-button-disabled', isAtStart);
    this.nextBtn.classList.toggle('swiper-button-disabled', isAtEnd);
  }
}