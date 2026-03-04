// src/scripts/ContentRenderer.ts

import type { VideoItem, QueryOptions, FilterCriteria } from './ApiService';
import { queryVideos } from './ApiService';
import cardTemplateRaw from '../partials/_card.html?raw';
import cardFavouriteTemplateRaw from '../partials/_card-favourite.html?raw';
import cardSiteTemplateRaw from '../partials/_card-site.html?raw';

// Cache del template HTML de la card
const cardTemplate: string = cardTemplateRaw;
const cardFavouriteTemplate: string = cardFavouriteTemplateRaw;
const cardSiteTemplate: string = cardSiteTemplateRaw;

// ─── External Sites Config ────────────────────────────────────────────────────

export interface SiteConfig {
  name: string;
  logo: string;
  description: string;
  siteUrl: string;
  btnClass: string;
  btnSpan: string;
}

export const EXTERNAL_SITES: SiteConfig[] = [
  {
    name: 'Virtual Real Passion',
    logo: '/images/core/logos/sites/logo_vrpassion.svg',
    description: 'Romantic and passionate VR experiences in stunning 8K quality.',
    siteUrl: 'https://www.virtualrealtrans.com',
    btnClass: 'passion',
    btnSpan: '',
  },
  {
    name: 'Virtual Real Gay',
    logo: '/images/core/logos/sites/logo_vrgay.svg',
    description: 'Immersive gay VR scenes with the hottest male performers.',
    siteUrl: 'https://www.virtualrealgay.com',
    btnClass: 'gay',
    btnSpan: '',
  },
  {
    name: 'Virtual Real Japan',
    logo: '/images/core/logos/sites/logo_vrjapan.svg',
    description: 'The true JAV porn experience. Top quality 8K scenes',
    siteUrl: 'https://www.virtualrealporn.com',
    btnClass: 'japan',
    btnSpan: '',
  },
];

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
  let html = cardTemplate
    .replace(/\{\{videoId\}\}/g, video.id.toString())
    .replace(/\{\{videoUrl\}\}/g, video.url)
    .replace(/\{\{qualityBadge\}\}/g, qualityBadge)
    .replace(/\{\{poster\}\}/g, video.poster)
    .replace(/\{\{title\}\}/g, video.title)
    .replace(/\{\{performers\}\}/g, performers)
    .replace(/\{\{duration\}\}/g, duration)
    .replace(/\{\{dataTags\}\}/g, JSON.stringify(video.video_tags));

  // Local URLs: remove target="_blank" so they open in the same tab
  if (video.url.startsWith('/')) {
    html = html.replace(' target="_blank" rel="noopener"', '');
  }

  return html;
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

    // Remove skeleton placeholders
    container.querySelectorAll('.card-skeleton').forEach(el => el.remove());

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

    // DEV: Override first two Top 10 video URLs to local detail pages
    if (isTop10) {
      if (videos.length > 0) videos[0].url = '/video-detail-vid.html';
      if (videos.length > 1) videos[1].url = '/video-detail-img.html';
    }

    const slidesHTML = videos.map((v, index) => renderSlide(v, isFavourite, isTop10 ? index + 1 : undefined)).join('');
    
    // Only add "more videos" link if data-more-video-link is present
    const hasMoreLink = swiperContainer.hasAttribute('data-more-video-link');
    const moreLink = hasMoreLink
      ? `<div class="swiper-slide"><a class="more-videos" href="">more videos</a></div>`
      : '';

    // Remove skeleton placeholders
    const skeleton = swiperContainer.querySelector('[data-skeleton]');
    if (skeleton) skeleton.remove();

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

// ─── Site Card Renderer ───────────────────────────────────────────────────────

/**
 * Genera el HTML del badge de video según su índice en el slider
 * (el primero recibe "NEW VIDEO", el segundo "EXCLUSIVE")
 */
function getSiteBadge(index: 0 | 1): string {
  if (index === 0) {
    return `<div class="badge-item new-video"><span>New Video</span></div>`;
  }
  return `<div class="badge-item exclusive"><span>Exclusive</span></div>`;
}

/**
 * Genera el HTML de una slide de site card con dos videos
 */
export function renderSiteCard(site: SiteConfig, video1: VideoItem, video2: VideoItem): string {
  const v1Performers = formatPerformers(video1.performers_names, 2);
  const v2Performers = formatPerformers(video2.performers_names, 2);

  return cardSiteTemplate
    .replace(/\{\{siteName\}\}/g, site.name)
    .replace(/\{\{siteLogo\}\}/g, site.logo)
    .replace(/\{\{siteDescription\}\}/g, site.description)
    .replace(/\{\{siteUrl\}\}/g, site.siteUrl)
    .replace(/\{\{siteBtnClass\}\}/g, site.btnClass)
    .replace(/\{\{siteBtnSpan\}\}/g, site.btnSpan)
    .replace(/\{\{video1Url\}\}/g, video1.url)
    .replace(/\{\{video1Badge\}\}/g, getSiteBadge(0))
    .replace(/\{\{video1Poster\}\}/g, video1.poster)
    .replace(/\{\{video1Title\}\}/g, video1.title)
    .replace(/\{\{video1Performers\}\}/g, v1Performers)
    .replace(/\{\{video2Url\}\}/g, video2.url)
    .replace(/\{\{video2Badge\}\}/g, getSiteBadge(1))
    .replace(/\{\{video2Poster\}\}/g, video2.poster)
    .replace(/\{\{video2Title\}\}/g, video2.title)
    .replace(/\{\{video2Performers\}\}/g, v2Performers);
}

/**
 * Renderiza el slider de external sites.
 * Requiere al menos 2 videos de la API; cada site obtiene los 2 más recientes.
 */
export async function renderSitesSlider(swiperContainer: HTMLElement): Promise<void> {
  const wrapper = swiperContainer.querySelector('.swiper-wrapper');
  if (!wrapper) {
    console.warn('[ContentRenderer] No .swiper-wrapper found in sites slider');
    return;
  }

  try {
    swiperContainer.classList.add('loading');

    // Fetch 2 latest videos once (shared across all site cards)
    const videos = await queryVideos({
      limit: 2,
      sort: { field: 'release_date', order: 'desc' },
    });

    if (videos.length < 2) {
      console.warn('[ContentRenderer] Not enough videos to render site cards');
      swiperContainer.classList.remove('loading');
      return;
    }

    const [video1, video2] = videos;

    const slidesHTML = EXTERNAL_SITES.map(site => {
      const cardHtml = renderSiteCard(site, video1, video2);
      return `<div class="swiper-slide">${cardHtml}</div>`;
    }).join('');

    // Remove skeleton placeholders
    wrapper.querySelectorAll('.card-skeleton').forEach(el => el.remove());
    wrapper.innerHTML = slidesHTML;
    swiperContainer.classList.remove('loading');
  } catch (error) {
    console.error('[ContentRenderer] Error rendering sites slider:', error);
    swiperContainer.classList.remove('loading');
  }
}

// ─── Related Videos (sidebar) ─────────────────────────────────────────────────

/**
 * Genera el HTML de una related-card a partir de un VideoItem
 */
export function renderRelatedCard(video: VideoItem): string {
  const performers = formatPerformers(video.performers_names, 2);
  const quality = getQualityBadge(video.max_image_quality);
  const qualityLabel = quality || 'HD';

  return `<a href="${video.url}" class="vd-related-card">
  <div class="vd-related-card__thumb">
    <img src="${video.poster}" alt="${video.title}" loading="lazy" decoding="async">
    <button class="vd-related-card__favourite" aria-label="Add to favorites">
      <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#fff"><path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z"/></svg>
    </button>
  </div>
  <div class="vd-related-card__info">
    <div class="vd-related-card__badges">
      <span class="badge-item exclusive"><span>EXCLUSIVE</span></span>
      <span class="badge-item interactive"><span><img src="/images/icons/white/vibrate.svg" alt="Interactive"></span></span>
    </div>
    <h4 class="vd-related-card__title">${video.title}</h4>
    <span class="vd-related-card__cast">${performers}</span>
    <div class="vd-related-card__meta">
      <span class="vd-related-card__rating">
        <span class="material-symbols-outlined">thumb_up</span> 100%
      </span>
      <span class="vd-related-card__views">
        <span class="material-symbols-outlined">visibility</span> ${qualityLabel}
      </span>
    </div>
  </div>
</a>`;
}

/**
 * Renderiza las related-cards en un contenedor .vd-sidebar__related-list[data-source="api"]
 * Usa medición real del DOM: renderiza 1 card, la mide, calcula cuántas caben y renderiza el total exacto.
 */
export async function renderRelatedVideos(container: HTMLElement): Promise<void> {
  try {
    const DEFAULT_LIMIT = 6;
    const MIN_LIMIT = 3;
    const MAX_LIMIT = 30;

    // En móvil no calculamos, usamos data-limit
    if (window.innerWidth < 1024) {
      const limit = parseInt(container.getAttribute('data-limit') || String(DEFAULT_LIMIT), 10);
      const videos = await queryVideos({ limit, sort: { field: 'release_date', order: 'desc' } });
      container.innerHTML = videos.map(v => renderRelatedCard(v)).join('');
      return;
    }

    // Pedir un lote grande de videos (max posible)
    const videos = await queryVideos({
      limit: MAX_LIMIT,
      sort: { field: 'release_date', order: 'desc' },
    });

    if (videos.length === 0) return;

    // 1) Renderizar 1 sola card para medirla
    container.innerHTML = renderRelatedCard(videos[0]);
    // Forzar layout
    container.offsetHeight;

    const firstCard = container.querySelector('.vd-related-card') as HTMLElement;
    if (!firstCard) {
      container.innerHTML = videos.slice(0, DEFAULT_LIMIT).map(v => renderRelatedCard(v)).join('');
      return;
    }

    // 2) Medir la card real y el gap real del contenedor
    const cardHeight = firstCard.getBoundingClientRect().height;
    const listStyle = getComputedStyle(container);
    const listGap = parseFloat(listStyle.gap) || parseFloat(listStyle.rowGap) || 16;

    // 3) Medir la altura del heading "Related Videos"
    const relatedBlock = container.closest('.vd-sidebar__related') as HTMLElement | null;
    const heading = relatedBlock?.querySelector('.vd-sidebar__heading') as HTMLElement | null;
    const headingHeight = heading ? heading.getBoundingClientRect().height : 0;
    const headingStyle = heading ? getComputedStyle(heading) : null;
    const headingMargin = headingStyle
      ? (parseFloat(headingStyle.marginTop) || 0) + (parseFloat(headingStyle.marginBottom) || 0)
      : 0;
    const totalHeadingHeight = headingHeight + headingMargin;

    // 4) Medir el sidebar y la columna principal
    const sidebar = container.closest('.vd-layout__sidebar') as HTMLElement | null;
    if (!sidebar || !relatedBlock) {
      container.innerHTML = videos.slice(0, DEFAULT_LIMIT).map(v => renderRelatedCard(v)).join('');
      return;
    }

    const gridLayout = sidebar.closest('.vd-layout, .vdi-layout') as HTMLElement | null;
    const mainColumn = gridLayout?.querySelector('.vd-layout__main, .vdi-layout__main') as HTMLElement | null;
    const totalHeight = mainColumn
      ? mainColumn.getBoundingClientRect().height
      : sidebar.getBoundingClientRect().height;

    // 5) Sumar altura de bloques hermanos (Live Models, etc.)
    let siblingsHeight = 0;
    for (const child of Array.from(sidebar.children)) {
      if (child !== relatedBlock) {
        siblingsHeight += (child as HTMLElement).getBoundingClientRect().height;
      }
    }

    // Padding y gaps del sidebar
    const sidebarStyle = getComputedStyle(sidebar);
    const sidebarPadding = (parseFloat(sidebarStyle.paddingTop) || 0) + (parseFloat(sidebarStyle.paddingBottom) || 0);
    const sidebarGap = parseFloat(sidebarStyle.gap) || 0;
    const sidebarGapCount = sidebar.children.length - 1;
    siblingsHeight += sidebarPadding + sidebarGap * sidebarGapCount;

    // 6) Calcular espacio disponible para las cards
    const availableForCards = totalHeight - siblingsHeight - totalHeadingHeight;

    // Cada card ocupa cardHeight, y entre ellas hay listGap (la última no tiene gap después)
    // N cards = cardHeight * N + listGap * (N - 1) <= available
    // N <= (available + listGap) / (cardHeight + listGap)
    const count = Math.floor((availableForCards + listGap) / (cardHeight + listGap));
    const finalCount = Math.max(MIN_LIMIT, Math.min(count, Math.min(MAX_LIMIT, videos.length)));

    // 7) Renderizar el número exacto
    container.innerHTML = videos.slice(0, finalCount).map(v => renderRelatedCard(v)).join('');
  } catch (error) {
    console.error('[ContentRenderer] Error rendering related videos:', error);
    container.innerHTML = '<p style="color:var(--color-text-secondary);padding:1rem;">Error loading related videos</p>';
  }
}

/**
 * Inicializa todos los contenedores dinámicos de la página.
 * Busca elementos con data-source="api" y los rellena automáticamente.
 */
export async function initDynamicContent(): Promise<void> {
  console.log('[ContentRenderer] Initializing dynamic content...');

  // Grids dinámicos (excluir los gestionados por FilterManager)
  const allGrids = document.querySelectorAll<HTMLElement>('.cards-grid[data-source="api"]');
  const dynamicGrids = Array.from(allGrids).filter(grid =>
    !grid.closest('.page-videos') && !grid.closest('.page-category-detail')
  );
  console.log('[ContentRenderer] Found', dynamicGrids.length, 'dynamic grids');
  const gridPromises = dynamicGrids.map(grid => {
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

  // External sites sliders
  const sitesSliders = document.querySelectorAll<HTMLElement>('.swiper[data-external-sites]');
  console.log('[ContentRenderer] Found', sitesSliders.length, 'sites sliders');
  const sitesPromises = Array.from(sitesSliders).map(slider => renderSitesSlider(slider));
  await Promise.all(sitesPromises);

  // Related videos sidebar
  const relatedLists = document.querySelectorAll<HTMLElement>('.vd-sidebar__related-list[data-source="api"]');
  console.log('[ContentRenderer] Found', relatedLists.length, 'related video lists');
  const relatedPromises = Array.from(relatedLists).map(list => renderRelatedVideos(list));
  await Promise.all(relatedPromises);

  console.log('[ContentRenderer] Dynamic content loaded.');
}
