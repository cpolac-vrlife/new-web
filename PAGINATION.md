# Sistema de Paginación para Cards Grid

## 📋 Descripción

Este sistema de paginación permite dividir grandes cantidades de cards en múltiples páginas, mejorando la experiencia del usuario y el rendimiento de la aplicación.

## 🚀 Uso Básico

Para activar la paginación en un grid de cards, agrega los siguientes atributos `data-*` al elemento con clase `.cards-grid`:

```html
<div class="cards-grid" 
     data-grid-type="grid-cols-4" 
     data-pagination="true" 
     data-items-per-page="8">
    <!-- Tus cards aquí -->
</div>
```

## ⚙️ Configuración

### Atributos Disponibles

| Atributo | Tipo | Por Defecto | Descripción |
|----------|------|-------------|-------------|
| `data-pagination` | string | `"false"` | Habilita/deshabilita la paginación (`"true"` o `"false"`) |
| `data-items-per-page` | number | `8` | Número de cards a mostrar por página |
| `data-grid-type` | string | - | Tipo de grid (ej: `grid-cols-3`, `grid-cols-4`, `grid-cols-5`) |

### Ejemplos de Configuración

#### Grid con 12 items por página:
```html
<div class="cards-grid" 
     data-grid-type="grid-cols-4" 
     data-pagination="true" 
     data-items-per-page="12">
    <!-- Cards -->
</div>
```

#### Grid de 3 columnas con 9 items por página:
```html
<div class="cards-grid" 
     data-grid-type="grid-cols-3" 
     data-pagination="true" 
     data-items-per-page="9">
    <!-- Cards -->
</div>
```

#### Grid sin paginación:
```html
<div class="cards-grid" data-grid-type="grid-cols-4">
    <!-- Cards -->
</div>
```

## 🎨 Características

### Controles de Navegación
- ✅ Botones "Anterior" y "Siguiente"
- ✅ Números de página clickeables
- ✅ Indicador de página activa
- ✅ Puntos suspensivos (...) para grandes cantidades de páginas
- ✅ Deshabilita automáticamente los botones en los extremos

### Optimizaciones
- ⚡ Solo muestra los controles si hay más items que el límite por página
- ⚡ Animación suave al cambiar de página
- ⚡ Scroll automático al inicio del grid al cambiar de página
- 📱 Diseño responsivo completo

## 🎯 Comportamiento

1. **Inicio Automático**: La paginación se inicializa automáticamente al cargar la página
2. **Página Inicial**: Siempre comienza en la página 1
3. **Navegación**: Los usuarios pueden navegar usando:
   - Botones "Anterior/Siguiente"
   - Números de página directos
4. **Visibilidad**: Solo las cards de la página actual son visibles
5. **Animación**: Las cards aparecen con una animación suave al cambiar de página

## 📱 Diseño Responsivo

La paginación se adapta automáticamente a diferentes tamaños de pantalla:

- **Desktop**: Muestra hasta 5 números de página visibles
- **Tablet** (≤768px): Botones más pequeños
- **Móvil** (≤480px): Solo muestra iconos de flechas en los botones

## 🎨 Personalización de Estilos

Los estilos de paginación están en `src/styles/components/_pagination.css`. Puedes personalizar:

```css
/* Variables CSS principales */
--color-primary: #6366f1;        /* Color principal */
--color-text: #334155;           /* Color de texto */
--color-text-muted: #94a3b8;     /* Color de texto secundario */
```

### Clases CSS Disponibles

- `.pagination-controls`: Contenedor principal
- `.pagination-btn`: Botones Anterior/Siguiente
- `.pagination-pages`: Contenedor de números de página
- `.pagination-page`: Botón de número de página
- `.pagination-page.active`: Página activa
- `.pagination-dots`: Puntos suspensivos

## 💡 Mejores Prácticas

1. **Items por Página**: Usa múltiplos del número de columnas para mejor presentación
   - Grid 4 columnas → 8, 12, 16 items
   - Grid 3 columnas → 6, 9, 12 items

2. **Performance**: Para mejor rendimiento con muchas cards (>100):
   - Usa paginación con límites razonables (8-16 items)
   - Considera lazy loading para imágenes

3. **UX**: Mantén consistencia en el número de items por página en todo el sitio

## 🔧 Desarrollo

### Estructura de Código

```
src/
├── scripts/
│   └── GridManager.ts       # Lógica de paginación
├── styles/
│   └── components/
│       └── _pagination.css  # Estilos de paginación
└── main.ts                  # Inicialización
```

### API TypeScript

```typescript
// La clase GridPagination maneja la lógica
class GridPagination {
  constructor(grid: HTMLElement, itemsPerPage: number = 8)
  private goToPage(page: number): void
  private showPage(page: number): void
}
```

## 🐛 Solución de Problemas

### La paginación no aparece
- ✅ Verifica que `data-pagination="true"` esté presente
- ✅ Asegúrate de tener más cards que el valor de `data-items-per-page`
- ✅ Comprueba que los estilos estén importados en `main.css`

### Los botones no funcionan
- ✅ Verifica que `GridManager.ts` esté importado en `main.ts`
- ✅ Revisa la consola del navegador por errores JavaScript

### Estilos incorrectos
- ✅ Asegúrate de que `_pagination.css` esté importado en `main.css`
- ✅ Verifica que las variables CSS estén definidas en `_variables.css`

## 📝 Ejemplo Completo

```html
<!DOCTYPE html>
<html>
<head>
    <title>Cards con Paginación</title>
</head>
<body>
    <div class="container">
        <h2>Nuestros Videos</h2>
        
        <!-- Grid con paginación -->
        <div class="cards-grid" 
             data-grid-type="grid-cols-4" 
             data-pagination="true" 
             data-items-per-page="8">
            
            <!-- Las cards se generan aquí -->
            <load src="src/partials/_cards-grid.html" />
        </div>
        
        <!-- Los controles de paginación se generan automáticamente aquí -->
    </div>
</body>
</html>
```

## 🚀 Versión

- **Versión actual**: 1.0.0
- **Última actualización**: Febrero 2026
