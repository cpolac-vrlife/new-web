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
    const container = document.createElement('div');
    container.className = 'pagination-controls';
    
    // Botón anterior
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn prev';
    prevBtn.innerHTML = '<span class="material-symbols-outlined">chevron_left</span>';
    prevBtn.addEventListener('click', () => this.goToPage(this.config.currentPage - 1));

    // Contenedor de números de página
    const pagesContainer = document.createElement('div');
    pagesContainer.className = 'pagination-pages';

    // Botón siguiente
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn next';
    nextBtn.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';
    nextBtn.addEventListener('click', () => this.goToPage(this.config.currentPage + 1));

    container.appendChild(prevBtn);
    container.appendChild(pagesContainer);
    container.appendChild(nextBtn);

    // Insertar después del grid
    this.grid.parentElement?.appendChild(container);
    this.paginationContainer = container;

    this.updatePaginationControls();
  }

  private updatePaginationControls() {
    if (!this.paginationContainer) return;

    const prevBtn = this.paginationContainer.querySelector('.prev') as HTMLButtonElement;
    const nextBtn = this.paginationContainer.querySelector('.next') as HTMLButtonElement;
    const pagesContainer = this.paginationContainer.querySelector('.pagination-pages');

    // Actualizar estado de botones
    prevBtn.disabled = this.config.currentPage === 1;
    nextBtn.disabled = this.config.currentPage === this.config.totalPages;

    // Generar números de página
    if (pagesContainer) {
      pagesContainer.innerHTML = '';
      
      const maxVisiblePages = 5;
      let startPage = Math.max(1, this.config.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.config.totalPages, startPage + maxVisiblePages - 1);

      // Ajustar si estamos cerca del final
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      // Primera página
      if (startPage > 1) {
        this.createPageButton(pagesContainer, 1);
        if (startPage > 2) {
          const dots = document.createElement('span');
          dots.className = 'pagination-dots';
          dots.textContent = '...';
          pagesContainer.appendChild(dots);
        }
      }

      // Páginas visibles
      for (let i = startPage; i <= endPage; i++) {
        this.createPageButton(pagesContainer, i);
      }

      // Última página
      if (endPage < this.config.totalPages) {
        if (endPage < this.config.totalPages - 1) {
          const dots = document.createElement('span');
          dots.className = 'pagination-dots';
          dots.textContent = '...';
          pagesContainer.appendChild(dots);
        }
        this.createPageButton(pagesContainer, this.config.totalPages);
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

    // Inicializar paginación si está habilitada
    const paginationEnabled = grid.getAttribute('data-pagination');
    if (paginationEnabled === 'true') {
      const itemsPerPage = parseInt(grid.getAttribute('data-items-per-page') || '8');
      new GridPagination(grid, itemsPerPage);
    }
  });
};