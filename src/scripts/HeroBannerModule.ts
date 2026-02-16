// src/scripts/HeroBannerModule.ts

interface HeroBannerConfig {
  autoPlayInterval: number;
  autoPlay: boolean;
}

class HeroBanner {
  private banner: HTMLElement | null;
  private slides: HTMLElement[];
  private thumbnails: HTMLElement[];
  private dots: HTMLElement[];
  private currentSlide: number = 0;
  private autoPlayTimer: number | null = null;
  private config: HeroBannerConfig;
  private thumbnailsTrack: HTMLElement | null;
  private prevPositions: Map<number, number> = new Map();

  constructor(config: Partial<HeroBannerConfig> = {}) {
    this.banner = document.querySelector('.hero-banner');
    this.slides = Array.from(document.querySelectorAll('.hero-banner__slide'));
    this.thumbnails = Array.from(document.querySelectorAll('.hero-banner__thumbnail'));
    this.dots = Array.from(document.querySelectorAll('.hero-banner__dot'));
    this.thumbnailsTrack = document.querySelector('.hero-banner__thumbnails-track');

    this.config = {
      autoPlayInterval: 6000,
      autoPlay: true,
      ...config
    };

    this.init();
  }

  private init() {
    if (!this.banner || this.slides.length === 0) return;

    this.attachEventListeners();
    
    // Play video in first slide if exists
    const firstSlide = this.slides[0];
    const firstVideo = firstSlide?.querySelector('video');
    if (firstVideo) {
      firstVideo.play().catch(err => console.log('Video autoplay prevented:', err));
    }
    
    // Center the active thumbnail on init
    this.centerActiveThumbnail(0);
    
    if (this.config.autoPlay) {
      this.startAutoPlay();
    }
  }

  private attachEventListeners() {
    // Thumbnail clicks
    this.thumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener('click', () => {
        const slideIndex = parseInt(thumbnail.getAttribute('data-slide') || '0');
        this.goToSlide(slideIndex);
        this.resetAutoPlay();
      });
    });

    // Dot clicks
    this.dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const slideIndex = parseInt(dot.getAttribute('data-slide') || '0');
        this.goToSlide(slideIndex);
        this.resetAutoPlay();
      });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.banner) return;
      
      if (e.key === 'ArrowLeft') {
        this.previousSlide();
        this.resetAutoPlay();
      } else if (e.key === 'ArrowRight') {
        this.nextSlide();
        this.resetAutoPlay();
      }
    });

    // Pause on hover
    if (this.banner) {
      this.banner.addEventListener('mouseenter', () => {
        this.stopAutoPlay();
      });

      this.banner.addEventListener('mouseleave', () => {
        if (this.config.autoPlay) {
          this.startAutoPlay();
        }
      });
    }

    // Handle visibility change (pause when tab is not active)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopAutoPlay();
      } else if (this.config.autoPlay) {
        this.startAutoPlay();
      }
    });
  }

  private goToSlide(index: number) {
    if (index < 0 || index >= this.slides.length || index === this.currentSlide) {
      return;
    }

    // Pause video in current slide if exists
    const currentSlide = this.slides[this.currentSlide];
    const currentVideo = currentSlide?.querySelector('video');
    if (currentVideo) {
      currentVideo.pause();
    }

    // Remove active class from current slide and thumbnail
    this.slides[this.currentSlide]?.classList.remove('hero-banner__slide--active');
    this.thumbnails[this.currentSlide]?.classList.remove('hero-banner__thumbnail--active');
    this.dots[this.currentSlide]?.classList.remove('hero-banner__dot--active');

    // Update current slide
    this.currentSlide = index;

    // Add active class to new slide and thumbnail
    this.slides[this.currentSlide]?.classList.add('hero-banner__slide--active');
    this.thumbnails[this.currentSlide]?.classList.add('hero-banner__thumbnail--active');
    this.dots[this.currentSlide]?.classList.add('hero-banner__dot--active');

    // Reset heart and label animations for the new slide
    const newSlide = this.slides[this.currentSlide];
    const badgeLogo = newSlide?.querySelector('.hero-banner__badge-logo');
    const heartPath = newSlide?.querySelector('.hero-banner__heart');
    const badgeLabel = newSlide?.querySelector('.hero-banner__badge-label');
    const badgeSubtitle = newSlide?.querySelector('.hero-banner__badge-subtitle');
    
    if (badgeLogo) {
      // Force animation restart by removing and re-adding animation
      const parent = badgeLogo.parentElement;
      if (parent) {
        const clone = badgeLogo.cloneNode(true) as HTMLElement;
        parent.replaceChild(clone, badgeLogo);
      }
    }
    
    if (heartPath) {
      // Force animation restart by removing and re-adding animation
      const parent = heartPath.parentElement;
      if (parent) {
        const clone = heartPath.cloneNode(true) as HTMLElement;
        parent.replaceChild(clone, heartPath);
      }
    }
    
    if (badgeLabel) {
      // Force animation restart by removing and re-adding animation
      const parent = badgeLabel.parentElement;
      if (parent) {
        const clone = badgeLabel.cloneNode(true) as HTMLElement;
        parent.replaceChild(clone, badgeLabel);
      }
    }
    
    if (badgeSubtitle) {
      // Force animation restart by removing and re-adding animation
      const parent = badgeSubtitle.parentElement;
      if (parent) {
        const clone = badgeSubtitle.cloneNode(true) as HTMLElement;
        parent.replaceChild(clone, badgeSubtitle);
      }
    }

    // Play video in new slide if exists
    const newVideo = newSlide?.querySelector('video');
    if (newVideo) {
      newVideo.currentTime = 0; // Reset to start
      newVideo.play().catch(err => console.log('Video autoplay prevented:', err));
    }

    // Scroll thumbnail into view
    this.centerActiveThumbnail(index);
  }

  private centerActiveThumbnail(index: number) {
    if (!this.thumbnailsTrack || this.thumbnails.length === 0) return;

    const total = this.thumbnails.length;
    const half = Math.floor(total / 2);
    // Each slot = 20% of the track width (100% / 5 slots)
    const slotPct = 100 / total;

    this.thumbnails.forEach((thumb, domIndex) => {
      // Calculate shortest circular distance from active
      let diff = domIndex - index;
      if (diff > half) diff -= total;
      if (diff < -half) diff += total;

      const distance = Math.abs(diff);
      const leftPct = 50 + diff * slotPct;

      // Scale: center slightly bigger, rest normal size
      let scale = 1.3;
      let opacity = 1;
      if (distance >= 1) {
        scale = 1;
        opacity = 1;
      }

      const el = thumb as HTMLElement;
      const prevLeft = this.prevPositions.get(domIndex);

      // Detect wrapping: if the left% jump is larger than 50%, it's wrapping around
      const isWrapping = prevLeft !== undefined && Math.abs(leftPct - prevLeft) > 50;

      if (isWrapping) {
        // Fade out at old position, teleport, then fade in at new position
        el.style.transition = 'opacity 0.2s ease';
        el.style.opacity = '0';

        setTimeout(() => {
          // Teleport with no transition
          el.style.transition = 'none';
          el.style.left = `${leftPct}%`;
          el.style.transform = `translate(-50%, -50%) scale(${scale})`;
          el.style.zIndex = distance === 0 ? '5' : '1';

          // Force reflow then fade in smoothly
          void el.offsetHeight;
          el.style.transition = 'transform 0.7s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.7s cubic-bezier(0.25, 0.1, 0.25, 1), left 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)';
          el.style.opacity = String(opacity);
        }, 200);
      } else {
        // Normal smooth slide
        el.style.left = `${leftPct}%`;
        el.style.transform = `translate(-50%, -50%) scale(${scale})`;
        el.style.opacity = String(opacity);
        el.style.zIndex = distance === 0 ? '5' : '1';
      }

      this.prevPositions.set(domIndex, leftPct);
    });
  }

  private nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  private previousSlide() {
    const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prevIndex);
  }

  private startAutoPlay() {
    this.stopAutoPlay();
    
    this.autoPlayTimer = window.setInterval(() => {
      this.nextSlide();
    }, this.config.autoPlayInterval);

  }

  private stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  private resetAutoPlay() {
    if (this.config.autoPlay) {
      this.startAutoPlay();
    }
  }

  // Public methods
  public destroy() {
    this.stopAutoPlay();
  }

  public pause() {
    this.stopAutoPlay();
  }

  public play() {
    if (this.config.autoPlay) {
      this.startAutoPlay();
    }
  }

  public setAutoPlay(enabled: boolean) {
    this.config.autoPlay = enabled;
    if (enabled) {
      this.startAutoPlay();
    } else {
      this.stopAutoPlay();
    }
  }
}

export const initHeroBanner = (config?: Partial<HeroBannerConfig>) => {
  return new HeroBanner(config);
};
