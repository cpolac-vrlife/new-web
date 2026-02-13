# Sistema de Templates

Este proyecto usa una arquitectura de layouts modular donde **cada página solo contiene su contenido específico**, mientras que la estructura HTML, head, header y footer se reutilizan automáticamente.

## Arquitectura del Sistema

### Layouts Base
Los elementos comunes están en **layouts** que se cargan automáticamente en cada página:

- **`src/layouts/_layout-top.html`**: Contiene `<html>`, `<head>`, `<body>` y el header
- **`src/layouts/_layout-bottom.html`**: Contiene el footer, scripts y cierre de tags

### Partials Reutilizables  
Componentes individuales que se usan dentro de los layouts o páginas:

- **`src/partials/_header.html`**: Header completo
- **`src/partials/_footer.html`**: Footer completo
- **`src/partials/_card.html`**: Tarjeta de contenido
- **`src/partials/_cards-grid.html`**: Grid de tarjetas
- **`src/partials/_slider.html`**: Carousel/Slider

## Estructura de Archivos

```
new-web/
├── index.html                          # Solo contenido del home
├── videos.html                         # Solo contenido de videos
├── categories.html                     # Solo contenido de categorías
├── models.html                         # Solo contenido de modelos
├── _base-template.html                 # Plantilla para nuevas páginas
├── src/
│   ├── layouts/
│   │   ├── _layout-top.html           # HTML + HEAD + BODY + HEADER
│   │   └── _layout-bottom.html        # FOOTER + SCRIPTS + cierre tags
│   ├── partials/
│   │   ├── _header.html               # Header reutilizable
│   │   ├── _footer.html               # Footer reutilizable
│   │   ├── _card.html
│   │   ├── _cards-grid.html
│   │   └── _slider.html
│   ├── scripts/
│   │   ├── HeaderModule.ts
│   │   ├── FooterModule.ts
│   │   └── [otros-módulos].ts
│   └── styles/
│       └── components/
│           ├── _header.css
│           ├── _footer.css
│           └── [otros-estilos].css
```

**Cada página HTML solo contiene su contenido específico**, no necesitas escribir `<html>`, `<head>`, `<body>`, header ni footer.

Copia `_base-template.html` o usa esta estructura mínima:

```html
<!-- Carga el layout superior (HTML, HEAD, HEADER) -->
<load src="src/layouts/_layout-top.html" />

<!-- Tu contenido específico -->
<main class="page-nombre">
  <div class="container">
    <h1>Tu Título</h1>
    
    <!-- Ejemplo: Grid de Cards -->
    <div class="cards-grid" data-grid-type="grid-cols-4" data-pagination="true" data-items-per-page="8">
      <load src="src/partials/_cards-grid.html" />
    </div>
  </div>
</main>

<!-- Carga el layout inferior (FOOTER, SCRIPTS) -->
<load src="src/layouts/_layout-bottom.html" />
```

✨ **¡Eso es todo!** Solo 3 elementos:
1. `<load>` del layout top
2. Tu contenido en `<main>`
3. `<load>` del layout bottom!-- Scripts (Siempre los mismos) -->
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

### 2. Los scripts y estilos se cargan automáticamente

No necesitas incluir CSS o JS adicionales. El archivo `main.ts` ya carga:
- Todos los estilos globales
- HeadeTodo lo demás se carga automáticamente

**No necesitas:**
- ❌ Escribir `<!DOCTYPE>`, `<html>`, `<head>`, `<body>`
- ❌ Incluir CSS manualmente
- ❌ Cargar scripts
- ❌ Añadir header o footer

**El sistema automáticamente incluye:**
- ✅ Estructura HTML completa desde `_layout-top.html`
- ✅ Todos los estilos globales via `main.ts`
- ✅ Header con navegación
- ✅ Footer con links
- ✅ Todos los módulos JavaScript (Header, Footer, Grids, Sliders)ild.rollupOptions.input` en `vite.config.ts`:

```typescript
build: {
  rollupOptions: {
    input: {
      main: resdel Sistema

### Layouts (Estructura Base)

**`src/layouts/_layout-top.html`**
- Contiene: `<!DOCTYPE>`, `<html>`, `<head>`, `<body>`, header
- Se carga al inicio de cada página
- **No necesitas editarlo** a menos que quieras cambiar meta tags globales

**`src/layouts/_layout-bottom.html`**
- Contiene: footer, scripts, cierre de `</body>` y `</html>`
- Se carga al final de cada página
- **No necesitas editarlo** a menos que quieras añadir scripts globales

### Componentes Reutilizables (Partials)e, 'index.html'),
      videos: resolve(__dirname, 'videos.html'),
      // Añade tu nueva página aquí
    }
  }
}Layouts y Partials

### Layouts
Los layouts se cargan en **cada página** para proporcionar la estructura:

```html
<!-- Inicio de toda página -->
<load src="src/layouts/_layout-top.html" />

<!-- Tu contenido aquí -->

<!-- Final de toda página -->
<load src="src/layouts/_layout-bottom.html" />
```

### Partials
Los partials se cargan **dentro del contenido** cuando los necesites:

```html
<!-- Cargar un grid de cards -->
<loadPáginas limpias**: Cada HTML solo contiene el contenido específico de esa página
2. **Layouts automáticos**: Siempre carga `_layout-top.html` al inicio y `_layout-bottom.html` al final
3. **Clase única**: Añade clase específica al `<main>`: `page-videos`, `page-categories`, etc.
4. **Container**: Usa `.container` para mantener el ancho máximo y padding consistente
5. **Reutiliza partials**: Los componentes de `src/partials/` pueden usarse en cualquier página
6. **No dupliques**: Nunca escribas `<html>`, `<head>`, header o footer en tus páginas
```
- **Características**: Logo, menú de navegación, buscador, botones de login/signup, responsive

### Footer
- **Ubicación**: `src/partials/_footer.html`
- **Estilos**: `src/styles/components/_footer.css`  
- **Script**: `src/scripts/FooterModule.ts`
- **Características**: Links organizados, redes sociales, información legal

### Otros Partials
- `_card.html`: Tarjeta individual de contenido
- `_cards-grid.html`: Grid de tarjetas con paginación opcional
- `_slider.html`: Carousel/Slider de contenido
- `_hero-banner.html`: Hero banner estilo Prime Video (ver [HERO-BANNER.md](HERO-BANNER.md))

## Uso de Partials

Los partials se cargan con la etiqueta `<load>`:

```html
<load src="src/partials/_header.html" />
```

Vite procesará esto durante el build y el desarrollo.

## Tips

1. **Consistencia**: Todas las páginas deben usar la misma estructura base
2. **Clase única**: Añade una clase específica al `<main>` de cada página: `page-videos`, `page-categories`, etc.
3. **Container**: Usa `.container` para mantener el ancho máximo y padding consistente
4. **Reutiliza components**: Los componentes de `src/partials/` pueden usarse en cualquier página

## Ejemplo de Páginas

- `index.html`: Página principal con sliders y grids → http://localhost:3000/
- `videos.html`: Listado de videos con filtros → http://localhost:3000/videos.html
- `categories.html`: Grid de categorías → http://localhost:3000/categories.html
- `models.html`: Listado de modelos → http://localhost:3000/models.html

Cada una reutiliza header y footer, pero tiene su propio contenido en `<main>`.

## Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

Todas las páginas estarán disponibles en:
- http://localhost:3000/ (index.html)
- http://localhost:3000/videos.html
- http://localhost:3000/categories.html
- http://localhost:3000/models.html

## Producción

El comando `npm run build` generará todas las páginas configuradas en `vite.config.ts`.

Para añadir una nueva página al build, edita `vite.config.ts`:

```typescript
build: {
  rollupOptions: {
    input: {
      main: resolve(__dirname, 'index.html'),
      videos: resolve(__dirname, 'videos.html'),
      categories: resolve(__dirname, 'categories.html'),
      models: resolve(__dirname, 'models.html'),
      tuNuevaPagina: resolve(__dirname, 'tu-nueva-pagina.html'), // Añade aquí
    }
  }
}
```
