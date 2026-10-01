<div align="center">

# Enybyy Extract

De una página HTML a una tabla de trabajo: extracción de una carta de restaurante, selección de campos y exportación CSV o JSON.

<a href="https://enybyy.github.io/web-scraping-selenium-pipeline/"><img src="docs/media/demo.svg" width="360" alt="Abrir demo"></a>

<p><a href="https://github.com/Enybyy"><img src="docs/media/github.svg" width="112" alt="GitHub de Eliud Rojas Mendoza"></a>
<a href="https://www.linkedin.com/in/eliud-rojas-mendoza-414652212/"><img src="docs/media/linkedin.svg" width="112" alt="LinkedIn de Eliud Rojas Mendoza"></a>
<a href="https://www.upwork.com/freelancers/~01471ca462b236e8e5"><img src="docs/media/upwork.svg" width="112" alt="Upwork de Eliud Rojas Mendoza"></a></p>

[![Enybyy Extract en uso](assets/screenshots/enybyy-extract-desktop.png)](https://enybyy.github.io/web-scraping-selenium-pipeline/)

*Captura real de la extracción sobre una copia local adaptada. La fuente no representa una consulta en vivo.*

[Acerca del proyecto](#acerca-del-proyecto) · [Capturas](#capturas) · [Recorrido](#en-el-día-a-día) · [Tecnología](#cómo-está-construido) · [Uso local](#uso-local)

</div>

## Acerca del proyecto

Una carta o un catálogo puede ser fácil de leer en pantalla y difícil de reutilizar como tabla. Enybyy Extract mantiene la página de origen a la vista mientras extrae sus entradas y permite elegir qué campos pasarán al archivo de trabajo.

La misma extracción puede presentarse como detalle de artículos, lista de precios o resumen por categoría. Los filtros, las columnas y el orden se conservan en CSV y JSON, de modo que la salida corresponde a lo que se está revisando. La demo utiliza fuentes guardadas; la versión Python incorpora ejecución desde consola y navegador con Selenium.

## En el día a día

| Dentro del proyecto | Detalle |
| --- | --- |
| Página de origen | Vista de la fuente guardada y de su HTML con sangría. |
| Extracción | Selectores CSS aplicados al documento, con campos y procedencia por registro. |
| Selección de salida | Artículos, tarifas, columnas, categorías y orden de los resultados. |
| Formatos de trabajo | Detalle, lista de precios o resumen por categoría; CSV y JSON. |
| Consola y navegador | Flujo Python y ejecución opcional mediante Selenium. |

## Capturas

### La fuente HTML y sus etiquetas

![La fuente HTML y sus etiquetas](assets/screenshots/enybyy-extract-html.png)

### Catálogo adicional para probar paginación

![Catálogo adicional para probar paginación](assets/screenshots/enybyy-extract-catalog.png)

## La fuente de ejemplo

`fixtures/menu.html` es una copia simplificada del archivo de carta real proporcionado para este proyecto. Conserva **164 entradas**, sus precios en soles y sus descripciones. Se eliminaron 44 repeticiones de las variantes responsive, marcas de restaurante y bebidas, scripts, rastreadores, recursos externos y el código del constructor de páginas. Los nombres comerciales se sustituyeron por nombres generales. Los códigos `CARTA-001` son identificadores locales añadidos para el ejemplo; no son códigos publicados por el restaurante.

La carta se visualiza con su propio diseño de restaurante. La pestaña **HTML** muestra el documento con dos espacios de sangría y resaltado de etiquetas. La extracción lee el archivo HTML mediante selectores CSS: los resultados no están incrustados como una tabla precalculada. Se conserva el contenido de la copia guardada; no se afirma que los precios sigan vigentes ni que exista una consulta en vivo.

No se inventa stock: la carta extrae `sku`, `name`, `category`, `price`, `description`, `record_type` y `source`. Los campos vacíos de descripción se conservan. Puedes filtrar resultados y descargar solo los registros visibles. El catálogo sintético Atelier de tres páginas sigue disponible como fuente adicional para probar paginación, duplicados, stock y registros incompletos.

## Elegir qué extraer

El alcance cambia según la fuente. La carta distingue **2 tarifas del buffet**, **2 adicionales** y **160 bebidas**. Por defecto muestra los **162 artículos**; Adultos y Niños solo aparecen en **Tarifas del buffet** o **Todo, separado por tipo**, con su clasificación explícita. Los tipos se añadieron en la copia según las secciones originales; no son metadatos publicados por el restaurante. El catálogo muestra sus 10 productos con stock y moneda USD.

Ambas fuentes permiten **detalle completo**, **lista de precios** y **resumen por categoría**. El resumen calcula cantidad de entradas y precios mínimo y máximo sobre la selección actual. Puedes marcar las columnas de salida y ordenar por nombre, precio o categoría. Tabla, CSV y JSON usan exactamente la misma selección; los selectores y la moneda se actualizan al cambiar de fuente. Si no seleccionas columnas, se desactiva la descarga.

La fuente completa se extrae y valida antes de aplicar alcance, filtros y columnas. No se omite la validación de precios por ocultar una columna. En consola se usa el mismo criterio:

```powershell
# Artículos de la carta, sin tarifas de ingreso (predeterminado)
.venv\Scripts\python pipeline.py
# Tarifas: Adultos y Niños
.venv\Scripts\python pipeline.py --scope rates
# Todo, con tipo explícito
.venv\Scripts\python pipeline.py --scope all
# Precios, solo nombre y precio
.venv\Scripts\python pipeline.py --format prices --fields name,price
# Agrupar los artículos por categoría
.venv\Scripts\python pipeline.py --format categories
```

## Selectores y Selenium

`schema.json` configura la carta; `catalog-schema.json` configura el catálogo sintético. Los selectores de campos son relativos a cada entrada.

```powershell
# La misma carta con Chrome headless y espera explícita
.venv\Scripts\python pipeline.py --browser

# Catálogo adicional: 3 páginas, 10 registros, 1 duplicado y 1 incompleto
.venv\Scripts\python pipeline.py --source "file:///C:/ruta/web-scraping-selenium-pipeline/fixtures/catalog-1.html" --schema catalog-schema.json

# Copia local propia (URI absoluta)
.venv\Scripts\python pipeline.py --source "file:///C:/datos/carta.html" --schema schema.json
```

Para el catálogo adicional, sustituye la URI de ejemplo por una URI `file:///` absoluta a tu copia. Selenium requiere Chrome y Selenium Manager puede necesitar conexión para resolver el controlador. El navegador se cierra también ante errores.

Una fuente HTTP requiere `--allow-network`, un esquema adaptado y un `robots.txt` legible. La CLI limita páginas y tamaño, rechaza ciclos y paginación fuera del origen o de la carpeta inicial. Los precios usan punto decimal; CSV conserva Unicode y neutraliza prefijos de fórmula. El HTML pegado se analiza sin ejecutar scripts. La demo estática usa el navegador; Python y Selenium se ejecutan desde la consola.

## Cómo está construido

| Área | Tecnología |
| --- | --- |
| Demo | HTML, CSS y JavaScript |
| Extracción local | Python y selectores CSS configurados en JSON |
| Navegador opcional | Selenium y Chrome |
| Salida | CSV y JSON |
| Verificación | unittest y Playwright |

## Uso local

<details>
<summary><strong>Ejecutar en tu equipo</strong></summary>

Requiere Python 3.10 o posterior.

```powershell
git clone https://github.com/Enybyy/web-scraping-selenium-pipeline.git
cd web-scraping-selenium-pipeline
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python pipeline.py
.venv\Scripts\python -m http.server 5083 --bind 127.0.0.1
```

Abre [localhost:5083](http://localhost:5083) y pulsa **Extraer datos**. La consola escribe `output/catalog.csv` y `output/report.json`.

</details>

### Verificar

```powershell
.venv\Scripts\python -m unittest discover -s tests -v
npm install
npx playwright install chromium
# Con el servidor del puerto 5083 activo:
npm test
```

Las pruebas verifican la carta, el catálogo adicional, exportaciones, selectores, HTML formateado y vista móvil. Ver [revisión](docs/verification.md).

---

<div align="center">

**Eliud Rojas Mendoza · Enybyy**

<p><a href="https://github.com/Enybyy"><img src="docs/media/github.svg" width="112" alt="GitHub de Eliud Rojas Mendoza"></a>
<a href="https://www.linkedin.com/in/eliud-rojas-mendoza-414652212/"><img src="docs/media/linkedin.svg" width="112" alt="LinkedIn de Eliud Rojas Mendoza"></a>
<a href="https://www.upwork.com/freelancers/~01471ca462b236e8e5"><img src="docs/media/upwork.svg" width="112" alt="Upwork de Eliud Rojas Mendoza"></a></p>

</div>
