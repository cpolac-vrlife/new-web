// src/scripts/CardLinks.ts

/**
 * Maneja la configuración dinámica de enlaces en las cards
 */

export interface VideoCardData {
  id: string;
  url: string;
  title?: string;
  thumbnail?: string;
}

/**
 * Configura los enlaces de las cards con datos dinámicos
 * @param cardElement - Elemento .card del DOM
 * @param videoData - Datos del video para configurar el enlace
 */
export const setCardLink = (cardElement: HTMLElement, videoData: VideoCardData): void => {
  const link = cardElement.querySelector<HTMLAnchorElement>('.card-link');
  
  if (!link) {
    console.warn('No se encontró .card-link en el elemento', cardElement);
    return;
  }

  // Configurar el href y atributos data
  link.href = videoData.url;
  link.setAttribute('data-video-id', videoData.id);
  link.setAttribute('data-video-url', videoData.url);

  // Opcional: Actualizar el título y thumbnail si se proporcionan
  if (videoData.title) {
    const titleElement = link.querySelector('h3');
    if (titleElement) {
      titleElement.textContent = videoData.title;
    }
  }

  if (videoData.thumbnail) {
    const imgElement = link.querySelector('img');
    if (imgElement) {
      imgElement.src = videoData.thumbnail;
      imgElement.alt = videoData.title || 'Video thumbnail';
    }
  }
};

/**
 * Configura todos los enlaces de las cards en un grid
 * @param gridElement - Elemento .cards-grid del DOM
 * @param videosData - Array de datos de videos
 */
export const setGridCardLinks = (gridElement: HTMLElement, videosData: VideoCardData[]): void => {
  const cards = gridElement.querySelectorAll<HTMLElement>('.card');

  cards.forEach((card, index) => {
    if (videosData[index]) {
      setCardLink(card, videosData[index]);
    }
  });
};

/**
 * Ejemplo de uso con datos de una API
 */
export const exampleUsage = async (): Promise<void> => {
  // Simulación de datos de una API
  const apiData: VideoCardData[] = [
    {
      id: 'video-001',
      url: '/videos/video-001',
      title: 'Amazing VR Experience',
      thumbnail: '/images/thumbnails/thumb-001.webp'
    },
    {
      id: 'video-002',
      url: '/videos/video-002',
      title: 'Immersive 8K Content',
      thumbnail: '/images/thumbnails/thumb-002.webp'
    }
    // ... más videos
  ];

  // Configurar todas las cards de un grid
  const grid = document.querySelector<HTMLElement>('.cards-grid');
  if (grid) {
    setGridCardLinks(grid, apiData);
  }

  // O configurar una card individual
  const singleCard = document.querySelector<HTMLElement>('.card');
  if (singleCard) {
    setCardLink(singleCard, apiData[0]);
  }
};

/**
 * Event listener para tracking de clicks (opcional)
 */
export const initCardAnalytics = (): void => {
  document.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('.card-link');
    
    if (link) {
      const videoId = link.getAttribute('data-video-id');
      const videoUrl = link.getAttribute('data-video-url');
      
      // Aquí puedes enviar analytics, logs, etc.
      console.log('Card clicked:', {
        videoId,
        videoUrl,
        timestamp: new Date().toISOString()
      });

      // Ejemplo: Envío a Google Analytics
      // if (typeof gtag !== 'undefined') {
      //   gtag('event', 'video_card_click', {
      //     video_id: videoId,
      //     video_url: videoUrl
      //   });
      // }
    }
  });
};
