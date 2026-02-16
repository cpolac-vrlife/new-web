// src/scripts/ApiService.ts

/**
 * Tipos que representan la estructura de datos de la API
 */
export interface VideoPerformers {
  male: string[];
  female: string[];
}

export interface VideoPictures {
  [key: string]: string; // image1, image2, ..., image7
}

export interface VideoItem {
  id: number;
  title: string;
  video_string: string;
  url: string;
  trailer: string;
  video_angle: string;
  max_image_quality: string | null;
  running_time: number;
  release_date: string;
  short_description: string;
  poster: string;
  pictures: VideoPictures;
  performers_names: VideoPerformers;
  video_tags: string[];
}

export interface ApiResponse {
  success: boolean;
  data: VideoItem[];
}

/**
 * Criterios de filtrado disponibles
 */
export interface FilterCriteria {
  /** Filtrar por tags (ej: "Anal", "Blonde", "Threesome") */
  tags?: string[];
  /** Modo de filtrado de tags: 'AND' requiere todos, 'OR' requiere al menos uno */
  tagsMode?: 'AND' | 'OR';
  /** Filtrar por nombre de performer (busca en male y female) */
  performers?: string[];
  /** Calidad mínima de imagen (3K, 4K, 5K, 8K) */
  minQuality?: string;
  /** Ángulo de video (ej: "180") */
  videoAngle?: string;
  /** Fecha mínima de lanzamiento (ISO string) */
  releaseDateFrom?: string;
  /** Fecha máxima de lanzamiento (ISO string) */
  releaseDateTo?: string;
  /** Duración mínima en segundos */
  minDuration?: number;
  /** Duración máxima en segundos */
  maxDuration?: number;
  /** Búsqueda por texto en título o descripción */
  search?: string;
  /** IDs específicos de videos */
  ids?: number[];
}

/**
 * Opciones de ordenamiento
 */
export type SortField = 'release_date' | 'title' | 'running_time' | 'id';
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

/**
 * Opciones de paginación para la consulta
 */
export interface QueryOptions {
  filter?: FilterCriteria;
  sort?: SortOptions;
  limit?: number;
  offset?: number;
}

// Cache interno
let cachedData: VideoItem[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// En desarrollo usa el proxy de Vite, en producción la URL directa
const API_URL = import.meta.env.DEV
  ? '/api/vrp'
  : 'https://np.virtualrealhub.com/affiliates/json-export/vrp';

/**
 * Mapa de calidades para comparación numérica
 */
const QUALITY_MAP: Record<string, number> = {
  '3K': 3,
  '4K': 4,
  '5K': 5,
  '6K': 6,
  '7K': 7,
  '8K': 8,
};

/**
 * Obtiene todos los datos de la API (con cache)
 */
export async function fetchAllVideos(): Promise<VideoItem[]> {
  const now = Date.now();

  if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedData;
  }

  try {
    console.log('[ApiService] Fetching from:', API_URL);
    const response = await fetch(API_URL);
    console.log('[ApiService] Response status:', response.status);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const json: ApiResponse = await response.json();

    if (!json.success || !Array.isArray(json.data)) {
      throw new Error('Invalid API response format');
    }

    cachedData = json.data;
    cacheTimestamp = now;
    return cachedData;
  } catch (error) {
    console.error('[ApiService] Error fetching videos:', error);
    // Si hay cache expirado, usarlo como fallback
    if (cachedData) {
      console.warn('[ApiService] Using expired cache as fallback');
      return cachedData;
    }
    throw error;
  }
}

/**
 * Aplica filtros a un array de videos
 */
export function applyFilters(videos: VideoItem[], criteria: FilterCriteria): VideoItem[] {
  return videos.filter(video => {
    // Filtro por IDs específicos
    if (criteria.ids && criteria.ids.length > 0) {
      if (!criteria.ids.includes(video.id)) return false;
    }

    // Filtro por tags
    if (criteria.tags && criteria.tags.length > 0) {
      const videoTagsLower = video.video_tags.map(t => t.toLowerCase());
      const filterTagsLower = criteria.tags.map(t => t.toLowerCase());

      if (criteria.tagsMode === 'AND') {
        if (!filterTagsLower.every(tag => videoTagsLower.includes(tag))) return false;
      } else {
        // OR por defecto
        if (!filterTagsLower.some(tag => videoTagsLower.includes(tag))) return false;
      }
    }

    // Filtro por performers
    if (criteria.performers && criteria.performers.length > 0) {
      const allPerformers = [
        ...(video.performers_names.male || []),
        ...(video.performers_names.female || [])
      ].map(p => p.toLowerCase());

      const hasPerformer = criteria.performers.some(p =>
        allPerformers.some(vp => vp.includes(p.toLowerCase()))
      );
      if (!hasPerformer) return false;
    }

    // Filtro por calidad mínima
    if (criteria.minQuality && video.max_image_quality) {
      const minVal = QUALITY_MAP[criteria.minQuality] || 0;
      const videoVal = QUALITY_MAP[video.max_image_quality] || 0;
      if (videoVal < minVal) return false;
    }

    // Filtro por ángulo
    if (criteria.videoAngle) {
      if (video.video_angle !== criteria.videoAngle) return false;
    }

    // Filtro por rango de fechas
    if (criteria.releaseDateFrom) {
      const from = new Date(criteria.releaseDateFrom).getTime();
      const videoDate = new Date(video.release_date).getTime();
      if (videoDate < from) return false;
    }
    if (criteria.releaseDateTo) {
      const to = new Date(criteria.releaseDateTo).getTime();
      const videoDate = new Date(video.release_date).getTime();
      if (videoDate > to) return false;
    }

    // Filtro por duración
    if (criteria.minDuration && video.running_time < criteria.minDuration) return false;
    if (criteria.maxDuration && video.running_time > criteria.maxDuration) return false;

    // Filtro por búsqueda de texto
    if (criteria.search) {
      const searchLower = criteria.search.toLowerCase();
      const matchesTitle = video.title.toLowerCase().includes(searchLower);
      const matchesDesc = video.short_description.toLowerCase().includes(searchLower);
      const matchesPerformer = [
        ...(video.performers_names.male || []),
        ...(video.performers_names.female || [])
      ].some(p => p.toLowerCase().includes(searchLower));

      if (!matchesTitle && !matchesDesc && !matchesPerformer) return false;
    }

    return true;
  });
}

/**
 * Aplica ordenamiento a un array de videos
 */
export function applySort(videos: VideoItem[], sort: SortOptions): VideoItem[] {
  const sorted = [...videos];
  const multiplier = sort.order === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    switch (sort.field) {
      case 'release_date':
        return multiplier * (new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
      case 'title':
        return multiplier * a.title.localeCompare(b.title);
      case 'running_time':
        return multiplier * (a.running_time - b.running_time);
      case 'id':
        return multiplier * (a.id - b.id);
      default:
        return 0;
    }
  });

  return sorted;
}

/**
 * Consulta principal: fetch + filter + sort + paginate
 */
export async function queryVideos(options: QueryOptions = {}): Promise<VideoItem[]> {
  let videos = await fetchAllVideos();

  // Aplicar filtros
  if (options.filter) {
    videos = applyFilters(videos, options.filter);
  }

  // Aplicar ordenamiento (por defecto: más recientes primero)
  const sort = options.sort || { field: 'release_date', order: 'desc' };
  videos = applySort(videos, sort);

  // Aplicar paginación
  const offset = options.offset || 0;
  if (options.limit) {
    videos = videos.slice(offset, offset + options.limit);
  } else if (offset > 0) {
    videos = videos.slice(offset);
  }

  return videos;
}

/**
 * Obtiene un video por su ID
 */
export async function getVideoById(id: number): Promise<VideoItem | undefined> {
  const videos = await fetchAllVideos();
  return videos.find(v => v.id === id);
}

/**
 * Obtiene un video por su slug (video_string)
 */
export async function getVideoBySlug(slug: string): Promise<VideoItem | undefined> {
  const videos = await fetchAllVideos();
  return videos.find(v => v.video_string === slug);
}

/**
 * Obtiene la lista de todos los tags disponibles (con conteo)
 */
export async function getAvailableTags(): Promise<Map<string, number>> {
  const videos = await fetchAllVideos();
  const tagCount = new Map<string, number>();

  videos.forEach(video => {
    video.video_tags.forEach(tag => {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    });
  });

  return new Map([...tagCount.entries()].sort((a, b) => b[1] - a[1]));
}

/**
 * Obtiene la lista de todos los performers disponibles (con conteo)
 */
export async function getAvailablePerformers(): Promise<Map<string, number>> {
  const videos = await fetchAllVideos();
  const performerCount = new Map<string, number>();

  videos.forEach(video => {
    const all = [
      ...(video.performers_names.female || []),
      ...(video.performers_names.male || [])
    ];
    all.forEach(name => {
      performerCount.set(name, (performerCount.get(name) || 0) + 1);
    });
  });

  return new Map([...performerCount.entries()].sort((a, b) => b[1] - a[1]));
}

/**
 * Obtiene solo las performers femeninas (con conteo), ordenadas por cantidad de vídeos
 */
export async function getAvailableFemalePerformers(): Promise<Map<string, number>> {
  const videos = await fetchAllVideos();
  const performerCount = new Map<string, number>();

  videos.forEach(video => {
    const females = video.performers_names.female || [];
    females.forEach(name => {
      performerCount.set(name, (performerCount.get(name) || 0) + 1);
    });
  });

  return new Map([...performerCount.entries()].sort((a, b) => b[1] - a[1]));
}

/**
 * Invalida el cache forzando una nueva petición en la próxima consulta
 */
export function invalidateCache(): void {
  cachedData = null;
  cacheTimestamp = 0;
}
