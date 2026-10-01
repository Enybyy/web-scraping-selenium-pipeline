# Verificación de Enybyy Extract

Revisión: 1 de octubre de 2026.

## Corrección semántica

Adultos y Niños son tarifas de ingreso al buffet. Se corrigió la clasificación y se separó su extracción de los artículos de la carta. La tabla identifica nombre, tipo de entrada, categoría, precio, descripción y referencia local; no llama producto a una tarifa.

Se cotejaron las 164 entradas únicas con el archivo original aportado por el usuario: todos los precios, descripciones y categorías coinciden, salvo la generalización documentada de marcas y el cambio del rótulo Precios a Tarifas buffet. Se verificó cada tipo según la sección original. Resultado: 2 tarifas, 2 adicionales y 160 bebidas. Ver [informe de origen](source-audit.json).

## Pruebas ejecutadas

- Python: 12 pruebas aprobadas. Cubren ambos esquemas, clasificación, los tres formatos de salida, columnas seleccionadas, rechazo de tipos incorrectos, CSV, validación de precios/stock y paginación.
- Comparación completa navegador/Python: coinciden todos los campos de las 164 entradas de la carta y de los 10 productos del catálogo, normalizando únicamente la URI de procedencia.
- Selenium con Chrome: carta completa, 1 página y 164 entradas válidas; catálogo, 3 páginas y 10 productos válidos, 1 duplicado y 1 registro sin precio excluido.
- Playwright: tarifas separadas, alcance de artículos/todo/tarifas, categorías con suma correcta, lista de precios, orden numérico, columnas desmarcadas ausentes también en JSON, descarga desactivada sin columnas, CSV filtrado, cambio de fuente y vuelta a carta, selectores inválidos, límite de páginas, HTML propio, texto seguro y protección de fórmulas.
- Capturas renovadas. Revisadas visualmente escritorio, móvil, carta independiente y catálogo. Verificación de ausencia de desbordamiento de la página en móvil; la tabla y navegación de la carta tienen desplazamiento propio.

La extracción de origen usa una copia local; no se consulta la página original en vivo ni se afirma vigencia de sus precios. La clasificación y las referencias CARTA se añadieron en la copia. Atelier sigue siendo un catálogo sintético. La extracción valida todos los campos del esquema antes de elegir alcance y columnas de salida.
