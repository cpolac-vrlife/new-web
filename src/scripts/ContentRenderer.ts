// src/scripts/ContentRenderer.ts

import type { VideoItem, QueryOptions, FilterCriteria } from './ApiService';
import { queryVideos } from './ApiService';
import cardTemplateRaw from '../partials/_card.html?raw';
import cardFavouriteTemplateRaw from '../partials/_card-favourite.html?raw';

// Cache del template HTML de la card
const cardTemplate: string = cardTemplateRaw;
const cardFavouriteTemplate: string = cardFavouriteTemplateRaw;

/**
 * Formatea la duración de segundos a MM:SS o HH:MM:SS
 */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Formatea la lista de performers para mostrar en la card
 */
function formatPerformers(performers: { male: string[]; female: string[] }, maxShow: number = 3): string {
  const all = [...(performers.female || []), ...(performers.male || [])];
  if (all.length === 0) return '';

  if (all.length <= maxShow) {
    return all.join(', ');
  }

  const shown = all.slice(0, maxShow);
  const remaining = all.length - maxShow;
  return `${shown.join(', ')} & ${remaining} more`;
}

/**
 * Determina el badge de calidad a mostrar
 */
function getQualityBadge(quality: string | null): string {
  if (!quality) return '';
  return quality;
}

/**
 * Genera el HTML de una card a partir de un VideoItem usando el template
 */
export function renderCard(video: VideoItem): string {
  const quality = getQualityBadge(video.max_image_quality);
  const performers = formatPerformers(video.performers_names);
  const duration = formatDuration(video.running_time);

  // Determinar badges visibles
  const qualityBadge = quality
    ? `<div class="badge-item quality"><span>${quality}</span></div>`
    : '';

  // Reemplazar placeholders
  return cardTemplate
    .replace(/\{\{videoId\}\}/g, video.id.toString())
    .replace(/\{\{videoUrl\}\}/g, video.url)
    .replace(/\{\{qualityBadge\}\}/g, qualityBadge)
    .replace(/\{\{poster\}\}/g, video.poster)
    .replace(/\{\{title\}\}/g, video.title)
    .replace(/\{\{performers\}\}/g, performers)
    .replace(/\{\{duration\}\}/g, duration)
    .replace(/\{\{dataTags\}\}/g, JSON.stringify(video.video_tags));
}

/**
 * Genera el HTML de una card favourite a partir de un VideoItem usando el template
 */
export function renderCardFavourite(video: VideoItem): string {
  const quality = getQualityBadge(video.max_image_quality);
  const performers = formatPerformers(video.performers_names);
  
  // Obtener la primera imagen de pictures (image1)
  const image1 = video.pictures['image1'] || video.poster;
  
  // Obtener el primer tag para mostrar
  const tag = video.video_tags.length > 0 ? video.video_tags[0] : 'VR';

  // Determinar badges visibles
  const qualityBadge = quality
    ? `<div class="badge-item quality"><span>${quality}</span></div>`
    : '';

  // Reemplazar placeholders
  return cardFavouriteTemplate
    .replace(/\{\{videoId\}\}/g, video.id.toString())
    .replace(/\{\{videoUrl\}\}/g, video.url)
    .replace(/\{\{qualityBadge\}\}/g, qualityBadge)
    .replace(/\{\{image1\}\}/g, image1)
    .replace(/\{\{poster\}\}/g, video.poster)
    .replace(/\{\{title\}\}/g, video.title)
    .replace(/\{\{tag\}\}/g, tag)
    .replace(/\{\{performers\}\}/g, performers)
    .replace(/\{\{dataTags\}\}/g, JSON.stringify(video.video_tags));
}

/**
 * Genera el HTML de una slide para slider a partir de un VideoItem
 */
export function renderSlide(video: VideoItem, isFavourite: boolean = false, rankNumber?: number): string {
  const cardHtml = isFavourite ? renderCardFavourite(video) : renderCard(video);
  const rankHtml = rankNumber !== undefined ? `<div class="rank-number">${rankNumber}</div>` : '';
  return `<div class="swiper-slide">${rankHtml}${cardHtml}</div>`;
}

/**
 * Renderiza cards directamente en un contenedor grid (.cards-grid)
 */
export async function renderGrid(
  container: HTMLElement,
  options: QueryOptions = {}
): Promise<void> {
  try {
    container.classList.add('loading');
    const videos = await queryVideos(options);

    const cardsHTML = videos.map(v => renderCard(v));
    container.innerHTML = cardsHTML.join('');
    container.classList.remove('loading');
  } catch (error) {
    console.error('[ContentRenderer] Error rendering grid:', error);
    container.innerHTML = '<div class="error-message">Error loading content</div>';
    container.classList.remove('loading');
  }
}

/**
 * Renderiza slides en un contenedor slider (.swiper-wrapper)
 */
export async function renderSlider(
  swiperContainer: HTMLElement,
  options: QueryOptions = {},
  isFavourite: boolean = false
): Promise<void> {
  const wrapper = swiperContainer.querySelector('.swiper-wrapper');
  if (!wrapper) {
    console.warn('[ContentRenderer] No .swiper-wrapper found in container');
    return;
  }

  try {
    swiperContainer.classList.add('loading');
    const videos = await queryVideos(options);
    
    // Detectar si es un slider Top 10
    const isTop10 = swiperContainer.hasAttribute('data-top10');
    if (isTop10) {
      swiperContainer.classList.add('slider-top10');
    }

    const slidesHTML = videos.map((v, index) => renderSlide(v, isFavourite, isTop10 ? index + 1 : undefined)).join('');
    const moreLink = `<div class="swiper-slide"><a class="more-videos" href="">more videos</a></div>`;

    wrapper.innerHTML = slidesHTML + moreLink;
    swiperContainer.classList.remove('loading');
  } catch (error) {
    console.error('[ContentRenderer] Error rendering slider:', error);
    swiperContainer.classList.remove('loading');
  }
}

/**
 * Parsea los atributos data-* de un elemento HTML para construir QueryOptions.
 * 
 * Atributos soportados:
 *   data-source="api"           → activa el rendering dinámico
 *   data-limit="8"              → cantidad de items
 *   data-offset="0"             → saltar N items
 *   data-sort="release_date"    → campo de ordenamiento
 *   data-order="desc"           → dirección del orden
 *   data-tags="Blonde,Anal"     → filtrar por tags (coma separados)
 *   data-tags-mode="OR"         → AND | OR
 *   data-performers="Misha Cross"  → filtrar por performers
 *   data-min-quality="5K"       → calidad mínima
 *   data-search="keyword"       → búsqueda por texto
 *   data-date-from="2023-01-01" → fecha desde
 *   data-date-to="2024-12-31"   → fecha hasta
 *   data-min-duration="1800"    → duración mínima (segundos)
 *   data-max-duration="3600"    → duración máxima (segundos)
 *   data-ids="123,456,789"      → IDs específicos
 */
export function parseDataAttributes(element: HTMLElement): QueryOptions {
  const options: QueryOptions = {};

  // Límite y offset
  const limit = element.getAttribute('data-limit');
  if (limit) options.limit = parseInt(limit, 10);

  const offset = element.getAttribute('data-offset');
  if (offset) options.offset = parseInt(offset, 10);

  // Ordenamiento
  const sortField = element.getAttribute('data-sort');
  const sortOrder = element.getAttribute('data-order');
  if (sortField) {
    options.sort = {
      field: sortField as any,
      order: (sortOrder as any) || 'desc'
    };
  }

  // Filtros
  const filter: FilterCriteria = {};
  let hasFilter = false;

  const tags = element.getAttribute('data-tags');
  if (tags) {
    filter.tags = tags.split(',').map(t => t.trim());
    hasFilter = true;
  }

  const tagsMode = element.getAttribute('data-tags-mode');
  if (tagsMode) {
    filter.tagsMode = tagsMode as 'AND' | 'OR';
    hasFilter = true;
  }

  const performers = element.getAttribute('data-performers');
  if (performers) {
    filter.performers = performers.split(',').map(p => p.trim());
    hasFilter = true;
  }

  const minQuality = element.getAttribute('data-min-quality');
  if (minQuality) {
    filter.minQuality = minQuality;
    hasFilter = true;
  }

  const search = element.getAttribute('data-search');
  if (search) {
    filter.search = search;
    hasFilter = true;
  }

  const dateFrom = element.getAttribute('data-date-from');
  if (dateFrom) {
    filter.releaseDateFrom = dateFrom;
    hasFilter = true;
  }

  const dateTo = element.getAttribute('data-date-to');
  if (dateTo) {
    filter.releaseDateTo = dateTo;
    hasFilter = true;
  }

  const minDuration = element.getAttribute('data-min-duration');
  if (minDuration) {
    filter.minDuration = parseInt(minDuration, 10);
    hasFilter = true;
  }

  const maxDuration = element.getAttribute('data-max-duration');
  if (maxDuration) {
    filter.maxDuration = parseInt(maxDuration, 10);
    hasFilter = true;
  }

  const ids = element.getAttribute('data-ids');
  if (ids) {
    filter.ids = ids.split(',').map(id => parseInt(id.trim(), 10));
    hasFilter = true;
  }

  if (hasFilter) {
    options.filter = filter;
  }

  return options;
}

/**
 * Inicializa todos los contenedores dinámicos de la página.
 * Busca elementos con data-source="api" y los rellena automáticamente.
 */
export async function initDynamicContent(): Promise<void> {
  console.log('[ContentRenderer] Initializing dynamic content...');

  // Grids dinámicos
  const dynamicGrids = document.querySelectorAll<HTMLElement>('.cards-grid[data-source="api"]');
  console.log('[ContentRenderer] Found', dynamicGrids.length, 'dynamic grids');
  const gridPromises = Array.from(dynamicGrids).map(grid => {
    const options = parseDataAttributes(grid);
    console.log('[ContentRenderer] Grid options:', options);
    return renderGrid(grid, options);
  });

  // Sliders dinámicos
  const dynamicSliders = document.querySelectorAll<HTMLElement>('.swiper[data-source="api"]');
  console.log('[ContentRenderer] Found', dynamicSliders.length, 'dynamic sliders');
  const sliderPromises = Array.from(dynamicSliders).map(slider => {
    const options = parseDataAttributes(slider);
    const isFavourite = slider.hasAttribute('data-favourite-scenes');
    console.log('[ContentRenderer] Slider options:', options, 'isFavourite:', isFavourite);
    return renderSlider(slider, options, isFavourite);
  });

  await Promise.all([...gridPromises, ...sliderPromises]);
  console.log('[ContentRenderer] Dynamic content loaded.');
}
