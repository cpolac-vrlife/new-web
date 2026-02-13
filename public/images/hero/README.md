# Hero Banner Images

## Requerimientos

Coloca aquí las imágenes para el hero banner (slides principales).

### Formato recomendado:
- **Dimensiones**: 1920x1080 (Full HD) 
- **Formato**: JPG o WebP
- **Peso máximo**: 500KB por imagen
- **Ratio**: 16:9

### Imágenes necesarias:
- `slide1.jpg` - Primer slide del hero
- `slide2.jpg` - Segundo slide del hero
- `slide3.jpg` - Tercer slide del hero
- `slide4.jpg` - Cuarto slide del hero
- (Puedes añadir más según necesites)

## Thumbnails

Las thumbnails (miniaturas) deben estar en `/public/images/thumbnails/`:
- **Dimensiones**: 280x160 (o similar ratio 16:9)
- **Formato**: JPG o WebP
- **Peso máximo**: 50KB por thumbnail
- Nombres: `thumb1.jpg`, `thumb2.jpg`, etc.

## Optimización

Antes de usar las imágenes, optimízalas con herramientas como:
- [TinyPNG](https://tinypng.com/)
- [Squoosh](https://squoosh.app/)
- ImageMagick CLI

Ejemplo con ImageMagick:
```bash
# Convertir y optimizar
magick input.jpg -resize 1920x1080 -quality 85 slide1.jpg
magick input.jpg -resize 280x160 -quality 80 thumb1.jpg
```
