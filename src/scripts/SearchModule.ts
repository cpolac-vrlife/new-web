// src/scripts/SearchModule.ts

import {
  fetchAllVideos,
  applyFilters,
  applySort,
  type VideoItem,
} from './ApiService';

/**
 * SearchModule — Buscador fullscreen con resultados en tiempo real
 *
 * Al escribir muestra:
 *  1. Performers coincidentes (estilo featured: avatar placeholder + nombre + nº videos)
 *  2. Videos relacionados (thumbnail + título + duración)
 */
class SearchOverlay {
  private overlay: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private resultsContainer: HTMLElement | null = null;
  private allVideos: VideoItem[] = [];
  private performerMap: Map<string, number> = new Map();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isDataLoaded = false;

  constructor() {}

  init(): void {
    this.createOverlayDOM();
    this.bindEvents();
  }

  /* ====================================
     CREATE DOM
     ==================================== */
  private createOverlayDOM(): void {
    // Check if already exists
    if (document.querySelector('.search-overlay')) {
      this.overlay = document.querySelector('.search-overlay');
      this.input = this.overlay!.querySelector('.search-overlay__input');
      this.resultsContainer = this.overlay!.querySelector('.search-overlay__results');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    overlay.innerHTML = `
      <div class="search-overlay__top">
        <div class="search-overlay__input-wrapper">
          <span class="material-symbols-outlined">search</span>
          <input type="text" class="search-overlay__input" placeholder="Search videos, performers..." autocomplete="off" />
        </div>
        <button class="search-overlay__close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="search-overlay__results">
        <div class="search-overlay__empty">
          <span class="material-symbols-outlined">search</span>
          <p>Start typing to search videos and performers</p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    this.overlay = overlay;
    this.input = overlay.querySelector('.search-overlay__input');
    this.resultsContainer = overlay.querySelector('.search-overlay__results');
  }

  /* ====================================
     EVENTS
     ==================================== */
  private bindEvents(): void {
    // Open search
    const toggleBtn = document.getElementById('search-toggle');
    toggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.open();
    });

    // Close search
    this.overlay?.querySelector('.search-overlay__close')?.addEventListener('click', () => {
      this.close();
    });

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay?.classList.contains('is-open')) {
        this.close();
      }
    });

    // Input with debounce
    this.input?.addEventListener('input', () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.handleSearch();
      }, 250);
    });
  }

  /* ====================================
     OPEN / CLOSE
     ==================================== */
  open(): void {
    if (!this.overlay) return;
    this.overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    // Focus input after transition
    setTimeout(() => {
      this.input?.focus();
    }, 100);

    // Lazy load data
    if (!this.isDataLoaded) {
      this.loadData();
    }
  }

  close(): void {
    if (!this.overlay) return;
    this.overlay.classList.remove('is-open');
    document.body.style.overflow = '';

    // Clear search
    if (this.input) this.input.value = '';
    this.showEmpty();
  }

  /* ====================================
     DATA
     ==================================== */
  private async loadData(): Promise<void> {
    try {
      this.allVideos = await fetchAllVideos();
      this.buildPerformerMap();
      this.isDataLoaded = true;
    } catch (err) {
      console.error('[SearchOverlay] Failed to load data:', err);
    }
  }

  private buildPerformerMap(): void {
    this.performerMap.clear();
    this.allVideos.forEach(video => {
      const females = video.performers_names.female || [];
      females.forEach(name => {
        this.performerMap.set(name, (this.performerMap.get(name) || 0) + 1);
      });
    });
  }

  /* ====================================
     SEARCH
     ==================================== */
  private handleSearch(): void {
    const query = this.input?.value.trim() || '';

    if (query.length < 2) {
      this.showEmpty();
      return;
    }

    const queryLower = query.toLowerCase();

    // Find matching performers
    const matchingPerformers: Array<{ name: string; count: number }> = [];
    this.performerMap.forEach((count, name) => {
      if (name.toLowerCase().includes(queryLower)) {
        matchingPerformers.push({ name, count });
      }
    });
    // Sort by video count desc
    matchingPerformers.sort((a, b) => b.count - a.count);
    const topPerformers = matchingPerformers.slice(0, 10);

    // Find matching videos
    const matchingVideos = applyFilters(this.allVideos, { search: query });
    const sortedVideos = applySort(matchingVideos, { field: 'release_date', order: 'desc' });
    const topVideos = sortedVideos.slice(0, 12);

    this.renderResults(topPerformers, topVideos, query);
  }

  /* ====================================
     RENDER
     ==================================== */
  private showEmpty(): void {
    if (!this.resultsContainer) return;
    this.resultsContainer.innerHTML = `
      <div class="search-overlay__empty">
        <span class="material-symbols-outlined">search</span>
        <p>Start typing to search videos and performers</p>
      </div>
    `;
  }

  private renderResults(
    performers: Array<{ name: string; count: number }>,
    videos: VideoItem[],
    _query: string
  ): void {
    if (!this.resultsContainer) return;

    if (performers.length === 0 && videos.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="search-overlay__no-results">
          <span class="material-symbols-outlined">search_off</span>
          <p>No results found</p>
        </div>
      `;
      return;
    }

    let html = '';

    // Performers section
    if (performers.length > 0) {
      html += `
        <div class="search-overlay__section">
          <div class="search-overlay__section-title">Performers</div>
          <div class="search-overlay__performers">
            ${performers.map(p => `
              <a class="search-overlay__performer" href="/models/${encodeURIComponent(p.name.toLowerCase().replace(/\s+/g, '-'))}">
                <div class="search-overlay__performer-img">
                  <span class="material-symbols-outlined">person</span>
                </div>
                <div class="search-overlay__performer-info">
                  <span class="search-overlay__performer-name">${p.name}</span>
                  <span class="search-overlay__performer-count">${p.count} video${p.count !== 1 ? 's' : ''}</span>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Videos section
    if (videos.length > 0) {
      html += `
        <div class="search-overlay__section">
          <div class="search-overlay__section-title">Videos</div>
          <div class="search-overlay__videos">
            ${videos.map(v => {
              const duration = this.formatDuration(v.running_time);
              return `
                <a class="search-overlay__video" href="${v.url}">
                  <div class="search-overlay__video-thumb">
                    <img src="${v.poster}" alt="${v.title}" loading="lazy" />
                    <span class="search-overlay__video-duration">${duration}</span>
                  </div>
                  <span class="search-overlay__video-title">${v.title}</span>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    this.resultsContainer.innerHTML = html;
  }

  private formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}

export function initSearch(): void {
  const search = new SearchOverlay();
  search.init();
}
