// src/scripts/FilterManager.ts

import {
  fetchAllVideos,
  applyFilters,
  applySort,
  getAvailableTags,
  getAvailableFemalePerformers,
  type VideoItem,
  type FilterCriteria,
  type SortOptions,
} from './ApiService';
import { renderCard } from './ContentRenderer';
import { initScrollAnimations } from './ScrollAnimations';

/**
 * Estado interno del sistema de filtros
 */
interface FilterState {
  selectedTags: Set<string>;
  selectedPerformer: string | null;
  sort: SortOptions;
  currentPage: number;
  itemsPerPage: number;
}

/**
 * Configuración opcional para FilterManager
 */
interface FilterManagerOptions {
  /** Selector CSS del contenedor de la página */
  pageSelector: string;
  /** Tag fija que no puede deseleccionarse (para páginas de categoría) */
  lockedTag?: string;
}

/**
 * FilterManager — controla el sistema de filtros de /videos
 *
 * Responsabilidades:
 *  - Poblar las categorías y pornstars desde la API
 *  - Smart combo: deshabilitar categorías incompatibles (AND)
 *  - Búsqueda de pornstar con scroll interno
 *  - Mutua exclusión entre combo y pornstar
 *  - Ordenamiento (release_date por ahora)
 *  - Renderizar el grid y la paginación
 */
export class FilterManager {
  private allVideos: VideoItem[] = [];
  private filteredVideos: VideoItem[] = [];
  private allTags: Map<string, number> = new Map();
  private allPerformers: Map<string, number> = new Map();
  private options: FilterManagerOptions;

  /** Videos pre-filtrados por la categoría fija (para performers y combos) */
  private categoryVideos: VideoItem[] = [];

  private state: FilterState = {
    selectedTags: new Set(),
    selectedPerformer: null,
    sort: { field: 'release_date', order: 'desc' },
    currentPage: 1,
    itemsPerPage: 20,
  };

  // DOM refs
  private gridContainer: HTMLElement | null = null;
  private resultsCounter: HTMLElement | null = null;

  // Dropdown groups
  private comboGroup: HTMLElement | null = null;
  private pornstarGroup: HTMLElement | null = null;
  private sortGroup: HTMLElement | null = null;
  private backdrop: HTMLElement | null = null;
  private clearMobileBtn: HTMLElement | null = null;
  private scrollY: number = 0;

  constructor(options?: FilterManagerOptions) {
    this.options = options || { pageSelector: '.page-videos' };
  }

  /* ====================================
     INIT
     ==================================== */
  async init(): Promise<void> {
    console.log('[FilterManager] Initializing...');

    const pageEl = document.querySelector(this.options.pageSelector);

    // Cache DOM elements
    this.gridContainer = pageEl?.querySelector('.cards-grid') || null;
    this.resultsCounter = document.getElementById('results-counter');
    this.comboGroup = document.querySelector('.filters-bar__group--combo');
    this.pornstarGroup = document.querySelector('.filters-bar__group--pornstar');
    this.sortGroup = document.querySelector('.filters-bar__group--sort');
    this.backdrop = document.querySelector('.filters-bar__backdrop');
    this.clearMobileBtn = document.getElementById('clear-all-mobile');

    // Fetch data
    try {
      this.allVideos = await fetchAllVideos();
      this.allTags = await getAvailableTags();
      this.allPerformers = await getAvailableFemalePerformers();
    } catch (err) {
      console.error('[FilterManager] Failed to load data:', err);
      return;
    }

    // Si hay una categoría fija, pre-seleccionarla y pre-filtrar datos
    if (this.options.lockedTag) {
      this.state.selectedTags.add(this.options.lockedTag);

      // Pre-filtrar videos de esta categoría
      this.categoryVideos = this.allVideos.filter(v =>
        v.video_tags.some(t => t.toLowerCase() === this.options.lockedTag!.toLowerCase())
      );

      // Recalcular tags solo dentro de esta categoría
      const categoryTags = new Map<string, number>();
      this.categoryVideos.forEach(video => {
        video.video_tags.forEach(tag => {
          categoryTags.set(tag, (categoryTags.get(tag) || 0) + 1);
        });
      });
      this.allTags = new Map([...categoryTags.entries()].sort((a, b) => b[1] - a[1]));

      // Recalcular performers solo dentro de esta categoría
      const categoryPerformers = new Map<string, number>();
      this.categoryVideos.forEach(video => {
        const females = video.performers_names.female || [];
        females.forEach(name => {
          categoryPerformers.set(name, (categoryPerformers.get(name) || 0) + 1);
        });
      });
      this.allPerformers = new Map([...categoryPerformers.entries()].sort((a, b) => b[1] - a[1]));
    }

    // Build UI
    this.renderComboGrid();
    this.renderFeaturedActresses();
    this.renderPornstarList();
    this.bindEvents();

    // Initial render
    this.applyAndRender();

    console.log('[FilterManager] Ready —', this.allVideos.length, 'videos,', this.allTags.size, 'tags,', this.allPerformers.size, 'performers');
  }

  /* ====================================
     COMBO GRID (categories)
     ==================================== */
  private renderComboGrid(): void {
    const grid = document.getElementById('combo-grid');
    if (!grid) return;

    grid.innerHTML = '';

    this.allTags.forEach((count, tag) => {
      const isLocked = this.options.lockedTag?.toLowerCase() === tag.toLowerCase();
      const item = document.createElement('label');
      item.className = 'filters-bar__combo-item';
      if (isLocked) {
        item.classList.add('is-checked', 'is-locked');
      }
      item.dataset.tag = tag;
      item.innerHTML = `
        <span class="filters-bar__combo-check">
          <span class="material-symbols-outlined">${isLocked ? 'lock' : 'check'}</span>
        </span>
        <span class="filters-bar__combo-name">${tag}</span>
        <span class="filters-bar__combo-count">${count}</span>
      `;
      grid.appendChild(item);
    });
  }

  /**
   * Actualiza el label del toggle combo según los tags seleccionados
   */
  private updateComboToggleLabel(): void {
    if (!this.comboGroup) return;
    const label = this.comboGroup.querySelector('.filters-bar__toggle-label');
    if (!label) return;

    const selected = this.state.selectedTags;
    
    // En categoría, no contar la locked tag en el label
    const displayTags = this.options.lockedTag
      ? Array.from(selected).filter(t => t.toLowerCase() !== this.options.lockedTag!.toLowerCase())
      : Array.from(selected);

    if (displayTags.length === 0) {
      label.textContent = this.options.lockedTag
        ? `${this.options.lockedTag} + combo`
        : 'Choose your combo';
      return;
    }

    // Mostrar hasta 3 tags, luego "..."
    if (displayTags.length <= 3) {
      label.textContent = this.options.lockedTag
        ? `${this.options.lockedTag} + ${displayTags.join(', ')}`
        : displayTags.join(', ');
    } else {
      const prefix = this.options.lockedTag ? `${this.options.lockedTag} + ` : '';
      label.textContent = `${prefix}${displayTags.slice(0, 2).join(', ')}...`;
    }
  }

  /**
   * Smart combo: recalcular qué categorías siguen siendo posibles
   * dado el set actual de tags seleccionados (modo AND).
   */
  private updateComboAvailability(): void {
    const grid = document.getElementById('combo-grid');
    if (!grid) return;

    const selected = this.state.selectedTags;

    // Actualizar el label del toggle
    this.updateComboToggleLabel();

    // Si no hay ninguna seleccionada (o solo la locked), todo habilitado
    const effectiveSelected = this.options.lockedTag
      ? new Set([...selected].filter(t => t.toLowerCase() !== this.options.lockedTag!.toLowerCase()))
      : selected;

    if (selected.size === 0 || (this.options.lockedTag && effectiveSelected.size === 0)) {
      grid.querySelectorAll<HTMLElement>('.filters-bar__combo-item').forEach(el => {
        if (el.classList.contains('is-locked')) return;
        el.classList.remove('is-disabled');
        // Restaurar conteo original
        const tag = el.dataset.tag!;
        const countEl = el.querySelector('.filters-bar__combo-count');
        if (countEl) countEl.textContent = String(this.allTags.get(tag) || 0);
      });
      return;
    }

    // Videos que cumplen TODAS las tags seleccionadas
    const currentlyMatching = this.allVideos.filter(v => {
      const vTags = v.video_tags.map(t => t.toLowerCase());
      return [...selected].every(s => vTags.includes(s.toLowerCase()));
    });

    grid.querySelectorAll<HTMLElement>('.filters-bar__combo-item').forEach(el => {
      const tag = el.dataset.tag!;

      // Si ya está seleccionada → siempre habilitada
      if (selected.has(tag)) {
        el.classList.remove('is-disabled');
        return;
      }

      // Comprobar cuántos videos quedarían si se añade esta tag
      const hypothetical = currentlyMatching.filter(v =>
        v.video_tags.some(vt => vt.toLowerCase() === tag.toLowerCase())
      );

      if (hypothetical.length === 0) {
        el.classList.add('is-disabled');
      } else {
        el.classList.remove('is-disabled');
      }

      // Actualizar contador con la cifra real
      const countEl = el.querySelector('.filters-bar__combo-count');
      if (countEl) countEl.textContent = String(hypothetical.length);
    });
  }

  /**
   * Actualiza el label del toggle pornstar según la selección
   */
  private updatePornstarToggleLabel(): void {
    if (!this.pornstarGroup) return;
    const label = this.pornstarGroup.querySelector('.filters-bar__toggle-label');
    if (!label) return;

    if (this.state.selectedPerformer) {
      label.textContent = this.state.selectedPerformer;
    } else {
      label.textContent = 'Pornstar';
    }
  }

  /* ====================================
     PORNSTAR LIST
     ==================================== */
  private renderFeaturedActresses(): void {
    const grid = document.getElementById('featured-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Top 5 by video count (already sorted desc)
    const top5 = Array.from(this.allPerformers.entries()).slice(0, 5);

    top5.forEach(([name, videoCount]) => {
      const item = document.createElement('div');
      item.className = 'filters-bar__featured-item';
      item.dataset.performer = name;
      if (this.state.selectedPerformer === name) item.classList.add('is-selected');
      item.innerHTML = `
        <div class="filters-bar__featured-img">
          <span class="material-symbols-outlined">person</span>
        </div>
        <div class="filters-bar__featured-info">
          <span class="filters-bar__featured-name">${name}</span>
          <span class="filters-bar__featured-count">${videoCount} videos</span>
        </div>
      `;
      grid.appendChild(item);
    });
  }

  private renderPornstarList(filter: string = ''): void {
    const list = document.getElementById('pornstar-list');
    if (!list) return;

    list.innerHTML = '';
    const filterLower = filter.toLowerCase();
    let count = 0;

    // Show/hide featured section based on search
    const featuredSection = document.getElementById('featured-actresses');
    if (featuredSection) {
      featuredSection.style.display = filterLower ? 'none' : '';
    }

    this.allPerformers.forEach((videoCount, name) => {
      if (filterLower && !name.toLowerCase().includes(filterLower)) return;

      count++;
      const item = document.createElement('div');
      item.className = 'filters-bar__pornstar-item';
      if (this.state.selectedPerformer === name) item.classList.add('is-selected');
      item.dataset.performer = name;
      item.innerHTML = `
        <span class="filters-bar__pornstar-name">${name}</span>
        <span class="filters-bar__pornstar-count">${videoCount}</span>
      `;
      list.appendChild(item);
    });

    if (count === 0) {
      list.innerHTML = '<div class="filters-bar__pornstar-empty">No results found</div>';
    }
  }

  /* ====================================
     EVENTS
     ==================================== */
  private isMobile(): boolean {
    return window.innerWidth < 769;
  }

  private bindEvents(): void {
    // Toggle dropdowns
    document.querySelectorAll<HTMLElement>('.filters-bar__toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const filterType = btn.dataset.filter!;
        this.toggleDropdown(filterType);
      });
    });

    // Close dropdowns on outside click (desktop only)
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.filters-bar__group')) {
        this.closeAllDropdowns();
      }
    });

    // Modal close buttons (mobile)
    document.querySelectorAll<HTMLElement>('.filters-bar__modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeAllDropdowns();
      });
    });

    // Backdrop click (mobile)
    this.backdrop?.addEventListener('click', () => {
      this.closeAllDropdowns();
    });

    // Combo item click
    document.getElementById('combo-grid')?.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>('.filters-bar__combo-item');
      if (!item || item.classList.contains('is-disabled') || item.classList.contains('is-locked')) return;

      const tag = item.dataset.tag!;
      if (this.state.selectedTags.has(tag)) {
        this.state.selectedTags.delete(tag);
        item.classList.remove('is-checked');
      } else {
        this.state.selectedTags.add(tag);
        item.classList.add('is-checked');
      }

      this.updateComboAvailability();
    });

    // Combo clear
    document.getElementById('combo-clear')?.addEventListener('click', () => {
      this.state.selectedTags.clear();
      document.querySelectorAll('.filters-bar__combo-item').forEach(el => {
        el.classList.remove('is-checked');
      });

      // Restaurar la tag fija
      if (this.options.lockedTag) {
        this.state.selectedTags.add(this.options.lockedTag);
        const lockedItem = document.querySelector<HTMLElement>(`.filters-bar__combo-item.is-locked`);
        if (lockedItem) lockedItem.classList.add('is-checked');
      }

      this.updateComboAvailability();
      this.state.currentPage = 1;
      this.applyAndRender();
      this.updateActiveFilters();
      this.updateMutualExclusion();
    });

    // Combo apply
    document.getElementById('combo-apply')?.addEventListener('click', () => {
      this.state.currentPage = 1;
      this.closeAllDropdowns();
      this.applyAndRender();
      this.updateActiveFilters();
      this.updateMutualExclusion();
    });

    // Pornstar search
    document.getElementById('pornstar-search')?.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      this.renderPornstarList(val);
    });

    // Pornstar selection (full list)
    document.getElementById('pornstar-list')?.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>('.filters-bar__pornstar-item');
      if (!item || item.classList.contains('filters-bar__pornstar-empty')) return;

      this.selectPerformer(item.dataset.performer!);
    });

    // Featured actress selection
    document.getElementById('featured-grid')?.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>('.filters-bar__featured-item');
      if (!item) return;

      this.selectPerformer(item.dataset.performer!);
    });

    // Sort options
    document.querySelector('.filters-bar__sort-list')?.addEventListener('click', (e) => {
      const option = (e.target as HTMLElement).closest<HTMLElement>('.filters-bar__sort-option');
      if (!option) return;

      // Update active class
      document.querySelectorAll('.filters-bar__sort-option').forEach(el => el.classList.remove('active'));
      option.classList.add('active');

      // Update sort label in toggle
      const label = this.sortGroup?.querySelector('.filters-bar__toggle-label');
      if (label) label.textContent = option.textContent || 'Latest';

      // Update sort icon to reflect selected option
      const icon = this.sortGroup?.querySelector('.filters-bar__toggle-icon');
      if (icon && this.isMobile()) {
        // Keep swap_vert icon on mobile
      }

      // Map sort value
      const sortVal = option.dataset.sort!;
      switch (sortVal) {
        case 'latest':
          this.state.sort = { field: 'release_date', order: 'desc' };
          break;
        case 'best':
          // Placeholder - mismo que latest por ahora
          this.state.sort = { field: 'release_date', order: 'desc' };
          break;
        case 'most-viewed':
          // Placeholder - mismo que latest por ahora
          this.state.sort = { field: 'release_date', order: 'desc' };
          break;
      }

      this.state.currentPage = 1;
      this.closeAllDropdowns();
      this.applyAndRender();
    });

    // Clear all active filters
    document.getElementById('clear-all-filters')?.addEventListener('click', () => {
      this.clearAll();
    });

    // Clear all mobile button
    this.clearMobileBtn?.addEventListener('click', () => {
      this.clearAll();
    });
  }

  /* ====================================
     PERFORMER SELECTION (shared)
     ==================================== */
  private selectPerformer(name: string): void {
    // Toggle selection
    if (this.state.selectedPerformer === name) {
      this.state.selectedPerformer = null;
    } else {
      this.state.selectedPerformer = name;
    }

    // Update selected state in both lists
    document.querySelectorAll('.filters-bar__pornstar-item.is-selected, .filters-bar__featured-item.is-selected').forEach(el => {
      el.classList.remove('is-selected');
    });

    if (this.state.selectedPerformer) {
      document.querySelectorAll<HTMLElement>(`[data-performer="${this.state.selectedPerformer}"]`).forEach(el => {
        el.classList.add('is-selected');
      });
    }

    this.updatePornstarToggleLabel();
    this.state.currentPage = 1;
    this.closeAllDropdowns();
    this.applyAndRender();
    this.updateActiveFilters();
    this.updateMutualExclusion();
  }

  /* ====================================
     DROPDOWN MANAGEMENT
     ==================================== */
  private toggleDropdown(filterType: string): void {
    const targetGroup = document.querySelector<HTMLElement>(`.filters-bar__group--${filterType}`);

    if (!targetGroup) return;

    const wasOpen = targetGroup.classList.contains('is-open');

    // Close all
    this.closeAllDropdowns();

    // Toggle target
    if (!wasOpen) {
      targetGroup.classList.add('is-open');

      // On mobile, show backdrop and lock scroll for combo/pornstar (not sort)
      if (this.isMobile() && filterType !== 'sort') {
        this.backdrop?.classList.add('is-visible');
        this.scrollY = window.scrollY;
        document.body.classList.add('filters-modal-open');
        document.body.style.top = `-${this.scrollY}px`;
      }
    }
  }

  private closeAllDropdowns(): void {
    document.querySelectorAll('.filters-bar__group').forEach(g => {
      g.classList.remove('is-open');
    });

    // Remove backdrop and unlock scroll
    this.backdrop?.classList.remove('is-visible');
    if (document.body.classList.contains('filters-modal-open')) {
      document.body.classList.remove('filters-modal-open');
      document.body.style.top = '';
      window.scrollTo(0, this.scrollY);
    }
  }

  /* ====================================
     MUTUAL EXCLUSION
     ==================================== */
  private updateMutualExclusion(): void {
    if (!this.comboGroup || !this.pornstarGroup) return;

    // En páginas de categoría, la exclusión mutua se basa en tags EXTRA (no la locked)
    if (this.options.lockedTag) {
      const hasExtraTags = this.state.selectedTags.size > 1; // más allá de la locked
      const hasPerformer = this.state.selectedPerformer !== null;

      // Combo extra seleccionado → deshabilitar pornstar
      if (hasExtraTags) {
        this.pornstarGroup.classList.add('is-disabled');
        this.comboGroup.classList.add('has-selection');
      } else {
        this.pornstarGroup.classList.remove('is-disabled');
        this.comboGroup.classList.remove('has-selection');
      }

      // Pornstar seleccionada → deshabilitar combo
      if (hasPerformer) {
        this.comboGroup.classList.add('is-disabled');
        this.pornstarGroup.classList.add('has-selection');
      } else {
        this.comboGroup.classList.remove('is-disabled');
        this.pornstarGroup.classList.remove('has-selection');
      }

      return;
    }

    const hasTags = this.state.selectedTags.size > 0;
    const hasPerformer = this.state.selectedPerformer !== null;

    // Combo selected → disable pornstar
    if (hasTags) {
      this.pornstarGroup.classList.add('is-disabled');
      this.comboGroup.classList.add('has-selection');
    } else {
      this.pornstarGroup.classList.remove('is-disabled');
      this.comboGroup.classList.remove('has-selection');
    }

    // Pornstar selected → disable combo
    if (hasPerformer) {
      this.comboGroup.classList.add('is-disabled');
      this.pornstarGroup.classList.add('has-selection');
    } else {
      this.comboGroup.classList.remove('is-disabled');
      this.pornstarGroup.classList.remove('has-selection');
    }
  }

  /* ====================================
     ACTIVE FILTERS BAR
     ==================================== */
  private updateActiveFilters(): void {
    const container = document.getElementById('active-filters');
    const list = document.getElementById('active-filters-list');
    if (!container || !list) return;

    const hasTags = this.state.selectedTags.size > 0;
    const hasPerformer = this.state.selectedPerformer !== null;

    // En categoría, no contar la locked tag como filtro activo
    const activeTags = this.options.lockedTag
      ? this.state.selectedTags.size > 1
      : hasTags;

    // Toggle mobile clear button
    if (this.clearMobileBtn) {
      if (activeTags || hasPerformer) {
        this.clearMobileBtn.classList.add('is-active');
      } else {
        this.clearMobileBtn.classList.remove('is-active');
      }
    }

    if (!activeTags && !hasPerformer) {
      container.style.display = 'none';
      return;
    }

    container.style.display = '';
    list.innerHTML = '';

    // Tag pills
    this.state.selectedTags.forEach(tag => {
      const isLocked = this.options.lockedTag?.toLowerCase() === tag.toLowerCase();
      
      // No mostrar la tag fija como pill removible
      if (isLocked) return;

      const pill = document.createElement('span');
      pill.className = 'filters-bar__active-tag';
      pill.dataset.tag = tag;
      pill.innerHTML = `${tag} <span class="material-symbols-outlined">close</span>`;
      pill.addEventListener('click', () => this.removeTag(tag));
      list.appendChild(pill);
    });

    // Performer pill
    if (hasPerformer) {
      const pill = document.createElement('span');
      pill.className = 'filters-bar__active-tag';
      pill.innerHTML = `${this.state.selectedPerformer} <span class="material-symbols-outlined">close</span>`;
      pill.addEventListener('click', () => this.removePerformer());
      list.appendChild(pill);
    }
  }

  private removeTag(tag: string): void {
    // No permitir eliminar la tag fija
    if (this.options.lockedTag?.toLowerCase() === tag.toLowerCase()) return;

    this.state.selectedTags.delete(tag);

    // Uncheck in grid
    const item = document.querySelector<HTMLElement>(`.filters-bar__combo-item[data-tag="${tag}"]`);
    if (item) item.classList.remove('is-checked');

    this.updateComboAvailability();
    this.state.currentPage = 1;
    this.applyAndRender();
    this.updateActiveFilters();
    this.updateMutualExclusion();
  }

  private removePerformer(): void {
    this.state.selectedPerformer = null;
    document.querySelectorAll('.filters-bar__pornstar-item.is-selected').forEach(el => {
      el.classList.remove('is-selected');
    });

    this.updatePornstarToggleLabel();

    this.state.currentPage = 1;
    this.applyAndRender();
    this.updateActiveFilters();
    this.updateMutualExclusion();
  }

  private clearAll(): void {
    this.state.selectedTags.clear();
    this.state.selectedPerformer = null;
    this.state.currentPage = 1;

    // Restaurar la tag fija si existe
    if (this.options.lockedTag) {
      this.state.selectedTags.add(this.options.lockedTag);
    }

    // Reset UI
    document.querySelectorAll('.filters-bar__combo-item').forEach(el => {
      el.classList.remove('is-checked');
    });
    // Re-marcar la locked tag
    if (this.options.lockedTag) {
      const lockedItem = document.querySelector<HTMLElement>(`.filters-bar__combo-item.is-locked`);
      if (lockedItem) lockedItem.classList.add('is-checked');
    }
    document.querySelectorAll('.filters-bar__pornstar-item.is-selected').forEach(el => {
      el.classList.remove('is-selected');
    });

    this.updateComboAvailability();
    this.updatePornstarToggleLabel();
    this.applyAndRender();
    this.updateActiveFilters();
    this.updateMutualExclusion();
  }

  /* ====================================
     APPLY FILTERS & RENDER
     ==================================== */
  private applyAndRender(): void {
    // Build filter criteria
    const criteria: FilterCriteria = {};

    if (this.state.selectedTags.size > 0) {
      criteria.tags = [...this.state.selectedTags];
      criteria.tagsMode = 'AND';
    }

    if (this.state.selectedPerformer) {
      criteria.performers = [this.state.selectedPerformer];
    }

    // Filter
    let videos = applyFilters(this.allVideos, criteria);

    // Sort
    videos = applySort(videos, this.state.sort);

    this.filteredVideos = videos;

    // Update results counter
    if (this.resultsCounter) {
      this.resultsCounter.innerHTML = `Showing <strong>${videos.length}</strong> videos`;
    }

    // Render the current page
    this.renderPage();
    this.renderPagination();
  }

  /* ====================================
     GRID RENDERING
     ==================================== */
  private renderPage(): void {
    if (!this.gridContainer) return;

    const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
    const end = start + this.state.itemsPerPage;
    const pageVideos = this.filteredVideos.slice(start, end);

    if (pageVideos.length === 0) {
      this.gridContainer.innerHTML = `
        <div class="filters-bar__no-results">
          <span class="material-symbols-outlined" style="font-size:48px;color:rgba(255,255,255,0.15);">search_off</span>
          <p style="color:rgba(255,255,255,0.4);margin-top:12px;">No videos match your current filters</p>
        </div>
      `;
      return;
    }

    this.gridContainer.innerHTML = pageVideos.map(v => renderCard(v)).join('');

    // Animate in
    const cards = this.gridContainer.querySelectorAll<HTMLElement>('.card');
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 40);
    });

    // Re-observar las nuevas cards para activar animaciones de badges y data-video
    initScrollAnimations();
  }

  /* ====================================
     PAGINATION
     ==================================== */
  private renderPagination(): void {
    // Remove existing pagination
    const existing = document.querySelector(`${this.options.pageSelector} .pagination-controls`);
    if (existing) existing.remove();

    const totalPages = Math.ceil(this.filteredVideos.length / this.state.itemsPerPage);
    if (totalPages <= 1) return;

    const container = document.createElement('div');
    container.className = 'pagination-controls';

    // Prev button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn prev';
    prevBtn.innerHTML = '<span class="material-symbols-outlined">chevron_left</span>';
    prevBtn.disabled = this.state.currentPage === 1;
    prevBtn.addEventListener('click', () => this.goToPage(this.state.currentPage - 1));

    // Pages container
    const pagesContainer = document.createElement('div');
    pagesContainer.className = 'pagination-pages';

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, this.state.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pagesContainer.appendChild(this.createPageBtn(1, totalPages));
      if (startPage > 2) {
        const dots = document.createElement('span');
        dots.className = 'pagination-dots';
        dots.textContent = '...';
        pagesContainer.appendChild(dots);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pagesContainer.appendChild(this.createPageBtn(i, totalPages));
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const dots = document.createElement('span');
        dots.className = 'pagination-dots';
        dots.textContent = '...';
        pagesContainer.appendChild(dots);
      }
      pagesContainer.appendChild(this.createPageBtn(totalPages, totalPages));
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn next';
    nextBtn.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';
    nextBtn.disabled = this.state.currentPage === totalPages;
    nextBtn.addEventListener('click', () => this.goToPage(this.state.currentPage + 1));

    container.appendChild(prevBtn);
    container.appendChild(pagesContainer);
    container.appendChild(nextBtn);

    // Insert after grid
    this.gridContainer?.parentElement?.appendChild(container);
  }

  private createPageBtn(page: number, _total: number): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'pagination-page';
    btn.textContent = String(page);
    if (page === this.state.currentPage) btn.classList.add('active');
    btn.addEventListener('click', () => this.goToPage(page));
    return btn;
  }

  private goToPage(page: number): void {
    const totalPages = Math.ceil(this.filteredVideos.length / this.state.itemsPerPage);
    if (page < 1 || page > totalPages || page === this.state.currentPage) return;

    this.state.currentPage = page;
    this.renderPage();
    this.renderPagination();

    // Scroll to top of grid
    const titleContainer = document.querySelector(`${this.options.pageSelector} .title_container`);
    if (titleContainer) {
      titleContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

/**
 * Inicializa FilterManager si estamos en la página /videos o en una categoría
 */
export async function initFilters(): Promise<void> {
  // Página de videos general
  const isVideosPage = document.querySelector('.page-videos');
  if (isVideosPage) {
    const fm = new FilterManager({ pageSelector: '.page-videos' });
    await fm.init();
    return;
  }

  // Página de categoría concreta
  const isCategoryPage = document.querySelector('.page-category-detail');
  if (isCategoryPage) {
    // Leer la categoría fija del atributo data-locked-tag del main
    const lockedTag = isCategoryPage.getAttribute('data-locked-tag');
    if (!lockedTag) {
      console.warn('[FilterManager] Category page found but no data-locked-tag attribute');
      return;
    }

    const fm = new FilterManager({
      pageSelector: '.page-category-detail',
      lockedTag,
    });
    await fm.init();
  }
}
