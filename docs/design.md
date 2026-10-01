# Mesa de extracción

Qué es: un extractor de catálogos HTML con paginación y salida estructurada.
Para quién: equipos que necesitan preparar datos de páginas para análisis y desarrolladores que revisan el portafolio.
Objetivo: ejecutar una extracción real y reconocer de dónde salió cada registro.

Color: tinta `#192c48` para texto; niebla `#edf2f8` para fondo; blanco `#ffffff` para la fuente; lavanda `#6a4ed9` para selección; naranja `#bd4b20` para acción; azul gris `#52647e` para texto secundario.
Tipografía: Segoe UI para controles e información; Consolas para selectores y trazas.
Layout: alineado a la izquierda, configuración lateral y una mesa ancha con vista de la página y tabla de resultados.

```text
Marca / navegación
Título            fuente → selección → datos
┌ configuración ┬ página fuente / HTML ┐
│ selectores    │ catálogo navegable   │
│ ejecutar      ├ resultados / exportar┤
│ trazas        │ tabla con procedencia│
└───────────────┴──────────────────────┘
```

Principio rector: ver la página antes de convertirla en datos. La fuente principal tiene identidad de carta de restaurante y la mesa de extracción la enmarca. La tipografía, los selectores y la relación entre original y tabla comunican extracción, sin métricas inventadas ni gráficos decorativos.
La carta contiene datos de una copia real anonimizada; el catálogo secundario es sintético. El nombre Enybyy Extract liga la herramienta a la cuenta de su autor. Las cifras de cada ejecución se calculan a partir de los documentos extraídos.


## Carta y selección de salida

La carta utiliza ciruela `#793b50`, tinta `#252525`, blanco y divisores `#eadde1`. Georgia en títulos; Segoe UI en listados. Navegación por familias, tarifas en un bloque propio y precios alineados. El plato dibujado en CSS es el único gesto visual; no requiere imágenes externas.

La configuración presenta alcance, formato y columnas antes de los selectores técnicos. La tabla usa encabezados según el esquema, tipos visibles, precios numéricos alineados y texto de descripción con saltos. La moneda y los controles de stock cambian con la fuente. La selección visible coincide con la exportación.
