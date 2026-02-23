// src/scripts/GridManager.ts

interface PaginationConfig {
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  cards: HTMLElement[];
}

class GridPagination {
  private grid: HTMLElement;
  private config: PaginationConfig;
  private paginationContainer: HTMLElement | null = null;

  constructor(grid: HTMLElement, itemsPerPage: number = 8) {
    this.grid = grid;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.card'));
    
    this.config = {
      itemsPerPage,
      currentPage: 1,
      totalPages: Math.ceil(cards.length / itemsPerPage),
      cards
    };

    this.init();
  }

  private init() {
    if (this.config.cards.length <= this.config.itemsPerPage) {
      // No necesita paginación
      return;
    }

    this.createPaginationControls();
    this.showPage(1);
  }

  private createPaginationControls() {
    const container = document.createElement('nav');
    container.className = 'pagination-controls';
    container.setAttribute('aria-label', 'Paginación');

    // Contenedor de números de página
    const pagesContainer = document.createElement('div');
    pagesContainer.className = 'pagination-pages';

    container.appendChild(pagesContainer);

    // Insertar después del grid
    this.grid.parentElement?.appendChild(container);
    this.paginationContainer = container;

    this.updatePaginationControls();
  }

  private generatePageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
    const isMobile = window.innerWidth < 768;
    const siblings = isMobile ? 1 : 2;
    const pages: (number | '...')[] = [];

    const rangeStart = Math.max(2, currentPage - siblings);
    const rangeEnd = Math.min(totalPages - 1, currentPage + siblings);

    pages.push(1);

    if (rangeStart > 2) {
      pages.push('...');
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (rangeEnd < totalPages - 1) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }

  private updatePaginationControls() {
    if (!this.paginationContainer) return;

    const pagesContainer = this.paginationContainer.querySelector('.pagination-pages');

    // Generar números de página
    if (pagesContainer) {
      pagesContainer.innerHTML = '';

      const pageNumbers = this.generatePageNumbers(this.config.currentPage, this.config.totalPages);

      for (const item of pageNumbers) {
        if (item === '...') {
          const dots = document.createElement('span');
          dots.className = 'pagination-dots';
          dots.textContent = '···';
          pagesContainer.appendChild(dots);
        } else {
          this.createPageButton(pagesContainer, item);
        }
      }
    }
  }

  private createPageButton(container: Element, pageNumber: number) {
    const btn = document.createElement('button');
    btn.className = 'pagination-page';
    btn.textContent = pageNumber.toString();
    btn.dataset.page = pageNumber.toString();
    
    if (pageNumber === this.config.currentPage) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => this.goToPage(pageNumber));
    container.appendChild(btn);
  }

  private goToPage(page: number) {
    if (page < 1 || page > this.config.totalPages || page === this.config.currentPage) {
      return;
    }

    this.config.currentPage = page;
    this.showPage(page);
    this.updatePaginationControls();
    
  }

  private showPage(page: number) {
    const startIndex = (page - 1) * this.config.itemsPerPage;
    const endIndex = startIndex + this.config.itemsPerPage;

    this.config.cards.forEach((card, index) => {
      if (index >= startIndex && index < endIndex) {
        card.style.display = '';
        // Añadir animación de entrada
        card.style.animation = 'none';
        setTimeout(() => {
          card.style.animation = 'fadeInUp 0.5s ease-out forwards';
        }, 10);
      } else {
        card.style.display = 'none';
      }
    });
  }
}

export const initGrids = () => {
  const grids = document.querySelectorAll<HTMLElement>('.cards-grid');

  grids.forEach(grid => {
    const gridType = grid.getAttribute('data-grid-type');

    // Verificamos que tenga un valor real y no sea el valor por defecto
    if (gridType && gridType !== 'default') {
      grid.classList.add(gridType);
    }

    // Verificar si es coming-soon
    const isComingSoon = grid.getAttribute('data-coming-soon') === 'true';
    if (isComingSoon) {
      // Añadir clase coming-soon
      grid.classList.add('coming-soon');
      
      // Limitar elementos a 5
      const cards = Array.from(grid.querySelectorAll<HTMLElement>('.card'));
      cards.forEach((card, index) => {
        if (index >= 5) {
          card.style.display = 'none';
        }
      });
      
      // No inicializar paginación para grids coming-soon
      return;
    }

    // Verificar si es external-videos
    const isExternalVideos = grid.getAttribute('data-external-videos') === 'true';
    if (isExternalVideos) {
      // Añadir clase external-videos
      grid.classList.add('external-videos');
      
      // Limitar elementos a 5
      const cards = Array.from(grid.querySelectorAll<HTMLElement>('.card'));
      cards.forEach((card, index) => {
        if (index >= 5) {
          card.style.display = 'none';
        }
      });
      
      // No inicializar paginación para grids external-videos
      return;
    }

    // Inicializar paginación si está habilitada
    const paginationEnabled = grid.getAttribute('data-pagination');
    if (paginationEnabled === 'true') {
      const itemsPerPage = parseInt(grid.getAttribute('data-items-per-page') || '8');
      new GridPagination(grid, itemsPerPage);
    }
  });
};