# Hero Banner Component

Hero banner estilo Prime Video con navegación por thumbnails, autoplay, transiciones suaves y header transparente.

## Características

- ✨ Diseño estilo Prime Video
- 🎥 Ratio 16:9 (proporciones del video)
- 🖼️ Navegación por thumbnails en la parte inferior (sin overlays de texto)
- 🎥 Soporte para videos y imágenes de fondo
- ⏯️ Autoplay con control de pausa/play (tanto del slider como de los videos)
- 🎯 Indicador de progreso animado
- ⌨️ Navegación por teclado (flechas)
- 📱 Totalmente responsive
- 🎨 Header transparente sobre el hero
- 🔄 Transiciones suaves entre slides
- 🎬 Reproducción automática de videos al cambiar de slide
- 📍 Contenido de texto posicionado justo encima de los thumbnails

## Uso

### Incluir en una página

```html
<load src="src/layouts/_layout-top.html" />

<!-- Hero Banner -->
<load src="src/partials/_hero-banner.html" />

<main class="page-home">
  <!-- Tu contenido -->
</main>

<load src="src/layouts/_layout-bottom.html" />
```

### Configuración

El hero banner se inicializa automáticamente en `main.ts`:

```typescript
if (document.querySelector('.hero-banner')) {
  initHeroBanner({
    autoPlay: true,           // Activar autoplay
    autoPlayInterval: 6000    // Intervalo en milisegundos (6 segundos)
  });
}
```

## Personalización

### Tipos de Slides

El hero banner soporta dos tipos de slides:

#### 1. Slides con Video y Botones
```html
<div class="hero-banner__slide" data-slide="0">
  <div class="hero-banner__background">
    <video class="hero-banner__bg-image" autoplay muted loop playsinline>
      <source src="/videos/tu-video.mp4" type="video/mp4">
    </video>
    <div class="hero-banner__overlay"></div>
  </div>
  <div class="container">
    <div class="hero-banner__content">
      <!-- Título, descripción, botones, meta -->
    </div>
  </div>
</div>
```

#### 2. Slides Solo con Imagen (Sin botones ni overlay)
```html
<div class="hero-banner__slide" data-slide="3">
  <div class="hero-banner__background">
    <img src="/images/hero/promo.jpg" alt="Promo" class="hero-banner__bg-image">
  </div>
</div>
```

### Añadir/Modificar Slides

Edita [src/partials/_hero-banner.html](src/partials/_hero-banner.html):

```html
<!-- Nuevo Slide -->
<div class="hero-banner__slide" data-slide="X">
  <div class="hero-banner__background">
    <img src="/images/hero/slideX.jpg" alt="Hero X" class="hero-banner__bg-image">
    <div class="hero-banner__overlay"></div>
  </div>
  <div class="container">
    <div class="hero-banner__content">
      <div class="hero-banner__badge">Tu Badge</div>
      <h1 class="hero-banner__title">Tu Título</h1>
      <p class="hero-banner__description">Tu descripción aquí...</p>
      <div class="hero-banner__actions">
        <button class="hero-banner__btn hero-banner__btn--primary">
          <span class="material-symbols-outlined">play_arrow</span>
          Watch Now
        </button>
        <button class="hero-banner__btn hero-banner__btn--secondary">
          <span class="material-symbols-outlined">info</span>
          More Info
        </button>
      </div>
      <div class="hero-banner__meta">
        <!-- Meta información -->
      </div>
    </div>
  </div>
</div>
```

### Añadir Thumbnail Correspondiente

```html
<div class="hero-banner__thumbnail" data-slide="X">
  <img src="/images/thumbnails/thumbX.jpg" alt="Thumbnail X">
  <div class="hero-banner__thumb-overlay">
    <div class="hero-banner__thumb-title">Título del Thumb</div>
    <div class="hero-banner__thumb-duration">Duración</div>
  </div>
  <div class="hero-banner__thumb-progress"></div>
</div>
```

### Usar Video en lugar de Imagen

Reemplaza el `<img>` por un `<video>`:

```html
<div class="hero-banner__background">
  <video class="hero-banner__bg-image" autoplay muted loop playsinline>
    <source src="/videos/hero-video.mp4" type="video/mp4">
  </video>
  <div class="hero-banner__overlay"></div>
</div>
```

## Estilos Personalizables

### Variables CSS

Puedes sobrescribir estas en tu CSS:

```css
.hero-banner {
  --hero-height: 100vh;
  --hero-min-height: 600px;
  --overlay-gradient: linear-gradient(...);
}
```

### Altura del Hero

El hero banner usa proporciones 16:9 (igual que los videos) en lugar de altura fija:

```css
.hero-banner {
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
}
```

### Overlay (Opacidad del fondo)

Ajusta el gradiente en `_hero-banner.css`:

```css
.hero-banner__overlay {
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3) 0%,    /* Menos opaco arriba */
    rgba(0, 0, 0, 0.9) 100%   /* Más opaco abajo */
  );
}
```

### Posición del Contenido

El contenido de texto se posiciona justo encima de los thumbnails:

```css
.hero-banner__content {
  position: absolute;
  bottom: 220px;  /* Justo encima de thumbnails */
  left: 0;
}
```

## API del Módulo

### Métodos Públicos

```typescript
const heroBanner = initHeroBanner();

// Pausar autoplay
heroBanner.pause();

// Reanudar autoplay
heroBanner.play();

// Activar/desactivar autoplay
heroBanner.setAutoPlay(true);  // activar
heroBanner.setAutoPlay(false); // desactivar

// Destruir instancia
heroBanner.destroy();
```

## Interacciones

### Teclado
- **←** (Flecha izquierda): Slide anterior
- **→** (Flecha derecha): Slide siguiente

### Mouse
- **Click en thumbnail**: Ir a ese slide
- **Hover sobre hero**: Pausar autoplay
- **Mouse sale del hero**: Reanudar autoplay
 (3 videos + 1 imagen)
├── styles/components/
│   └── _hero-banner.css         # Estilos del hero banner
└── scripts/
    └── HeroBannerModule.ts      # Lógica JavaScript con control de videos

public/
├── videos/
│   ├── The_lust_of_us-desktop.mp4
│   ├── Valentines_mischief-desktop.mp4
│   └── Vrp_irl_eu_edition-desktop.mp4
└── images/
    ├── hero/
    │   └── valentines-promo.jpg          # Imagen de promo
    └── thumbnails/
        ├── the-lust-of-us-thumb.jpg     # Thumbnails
        ├── valentines-mischief-thumb.jpg
        ├── vrp-irl-eu-thumb.jpg
        └── valentines-promo-thumb.jpg

## Header Transparente

El header se vuelve **transparente automáticamente** cuando detecta un hero banner en la página.

### Comportamiento:
- **Scroll = 0**: Header transparente
- **Scroll > 100px**: Header con fondo oscuro y blur

### Desactivar Transparencia

En `HeaderModule.ts`, comenta estas líneas:

```typescript
// Si hay hero banner, activar modo transparente
// if (this.hasHeroBanner && this.header) {
//   this.header.classList.add('header--transparent');
// }
```y Videos Requeridos

Ver [SETUP-HERO-IMAGES.md](/public/images/SETUP-HERO-IMAGES.md) para instrucciones completas.

### Videos (ya incluidos):
- `public/videos/The_lust_of_us-desktop.mp4`
- `public/videos/Valentines_mischief-desktop.mp4`
- `public/videos/Vrp_irl_eu_edition-desktop.mp4`
### Imágenes necesarias (en `/public/images/hero-thumbnails/`):

**Thumbnails (5 elementos):**
- `The_lust_of_us_thumb.webp` - Portada del video 1
- `Valentines_mischief_thumb.webp` - Portada del video 2 (Octavia Red & Madison Wilde)
- `Vrp_irl_eu_thumb.webp` - Portada del video 3
- `Valentines_mischief_evamaxim_thumb.webp` - Portada del video 4 (Eva Maxim) **NUEVO**
- `Valentines_hero.webp` - Imagen de San Valentín (-80% promo)

**Nota:** El carrusel de thumbnails siempre muestra 5 elementos con el seleccionado centrado automáticamente.
- `public/images/thumbnails/valentines-promo-thumb.jpg` - 280x160pxgúrate de tener estas imágenes en tu proyecto:

```
public/images/
├── hero/
│   ├── slide1.jpg    # 1920x1080 recomendado
│   ├── slide2.jpg
│   ├── slide3.jpg
│   └── slide4.jpg
└── thumbnails/
    ├── thumb1.jpg    # 280x160 recomendado
    ├── thumb2.jpg
    ├── thumb3.jpg
    └── thumb4.jpg
```

## Performance

### Optimizaciones incluidas:
- Lazy loading de imágenes no visibles
- Pausa de autoplay cuando la pestaña está inactiva
- Pausa de autoplay en hover
- Transiciones suaves con CSS
- Scroll behavior optimizado

### Tips adicionales:
- Usa imágenes WebP para mejor compresión
- Optimiza imágenes antes de subirlas (max 200KB por thumbnail)
- Considera usar videos cortos (< 10MB) en lugar de GIFs

## Compatibilidad

- ✅ Chrome/Edge 80+
- ✅ Firefox 75+
- ✅ Safari 13.1+
- ✅ Mobile browsers (iOS/Android)

## Ejemplo Completo

Ver [index.html](../index.html) para un ejemplo completo funcionando.
