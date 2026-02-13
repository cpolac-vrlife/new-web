# Instrucciones para imágenes del Hero Banner

## Imágenes necesarias:

Todas las imágenes deben estar en `/public/images/hero-thumbnails/` para mantenerlas organizadas:

### Thumbnails para navegación:
- `The_lust_of_us_thumb.webp` - Thumbnail del video "The Lust of Us"
- `Valentines_mischief_thumb.webp` - Thumbnail del video "Valentine's Mischief" (Octavia Red & Madison Wilde)
- `Vrp_irl_eu_thumb.webp` - Thumbnail del video "VRP IRL EU Edition"
- `Valentines_mischief_evamaxim_thumb.webp` - Thumbnail del video "Valentine's Mischief" (Eva Maxim) **NUEVO**
- `Valentines_hero.webp` - Imagen de San Valentín con modelos y -80%

### Estructura final:

```
public/
├── images/
│   └── hero-thumbnails/
│       ├── The_lust_of_us_thumb.webp          ← Thumbnail del video 1
│       ├── Valentines_mischief_thumb.webp     ← Thumbnail del video 2
│       ├── Vrp_irl_eu_thumb.webp              ← Thumbnail del video 3
│       ├── Valentines_mischief_evamaxim_thumb.webp  ← Thumbnail del video 4 (NUEVO)
│       └── Valentines_hero.webp               ← Imagen promo San Valentín
└── videos/
    ├── The_lust_of_us-desktop.mp4    ✓ Ya existe
    ├── Valentines_mischief-desktop.mp4   ✓ Ya existe
    └── Vrp_irl_eu_edition-desktop.mp4    ✓ Ya existe
```

## Especificaciones técnicas:

**Thumbnails:**
- Dimensiones: Pueden ser las originales de las portadas
- Formato: JPG
- Ratio recomendado: 16:9
- Las imágenes que subiste ya están perfectas

**Hero Banner:**
- El banner ahora usa ratio 16:9 (como los videos)
- El contenido de texto aparece justo encima de los thumbnails
- Los thumbnails NO tienen overlay de texto (se gestionará aparte)
- La imagen de San Valentín se muestra sin botones ni overlay

Una vez que coloques todas las imágenes en `/public/images/hero-thumbnails/`, el hero banner funcionará perfectamente.
