# Revisión de Extracta

Revisión realizada el 1 de octubre de 2026.

## Evidencia funcional

- `python pipeline.py`: 3 páginas HTML, 10 registros únicos, 1 duplicado, 1 precio incompleto; archivos CSV y JSON generados.
- `python pipeline.py --browser`: el mismo resultado con Chrome headless y Selenium.
- 9 pruebas Python: paginación, límite, validación, formato de precio, stock cero, opt-in de red, confinamiento de archivos y CSV con Unicode/comillas/fórmulas.
- Prueba Playwright: extracción de tres páginas, filtro de stock y texto, CSV descargado con los registros visibles, selector inválido, límite de páginas, HTML pegado, texto que contiene etiquetas sin ejecución, protección de fórmulas CSV y móvil sin desbordamiento de página.
- Capturas producidas por el navegador, sin reconstruir la interfaz en una herramienta de imágenes: escritorio, móvil y formato 4:3.

## Cambios frente al legado

El repositorio original contenía scripts de consulta de DNI con rutas absolutas de otro equipo, pausas fijas y listas separadas de nombres/códigos que podían quedar desalineadas al fallar una consulta. La comparación no reconciliaba con claridad por identificador. Otro script modificaba un formulario en BeautifulSoup sin enviarlo.

La página de presentación no realizaba extracción: mostraba 2.450 consultas, 99,8% y otras cifras estáticas sin evidencia. La descarga de CSV no estaba conectada a una acción.

La reconstrucción cambia el alcance a catálogos. Cada registro contiene código, nombre, categoría, precio, stock y procedencia. Los errores se reportan; la duplicación usa el código como clave. El modo web analiza HTML local real; el motor Python comparte el mismo catálogo y validación. Las imágenes antiguas y la carpeta `VERIFICAR_DNI` se retiran porque pertenecían a la presentación anterior.

## Lo no verificado

No se ejecutaron extracciones de portales de terceros. Los ejemplos de URL son instrucciones de uso y requieren un esquema adaptado, autorización de la fuente y su propia prueba. No se afirma rendimiento comercial ni disponibilidad de un proveedor externo. La publicación de GitHub Pages debe comprobarse después del push; una captura local no certifica la publicación remota.
