# 🕷️ Web Scraping & Data Extraction Pipeline con Selenium y Pandas
> **Pipeline automatizado de extracción web, emulación de navegación y auditoría masiva de registros contra portales en línea sin API pública.**

[![Python](https://img.shields.io/badge/Python-3.x-3776ab.svg)](https://www.python.org/)
[![Selenium](https://img.shields.io/badge/Web%20Driver-Selenium-43B02A.svg)](https://www.selenium.dev/)
[![Data Processing](https://img.shields.io/badge/Data%20Engine-Pandas-150458.svg)](https://pandas.pydata.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 El Desafío de Negocio

En sectores como la gestión de cobranzas, recursos humanos, auditoría legal o verificación de clientes (KYC), es común necesitar comprobar grandes volúmenes de identificaciones o expedientes contra portales web oficiales o plataformas gubernamentales que:

- **No ofrecen APIs públicas** o cobran tarifas prohibitivas por consulta individual.
- **Requieren navegación manual paso a paso**: interactuar con formularios, seleccionar opciones en menús desplegables y esperar la carga dinámica de tablas.
- **Ocasionan demoras intolerables**: Hacer este procedimiento a mano para miles de personas requiere semanas de trabajo de varios asistentes administrativos y genera frecuentes omisiones o errores de tipeo.

---

## 💡 La Solución Implementada

Este proyecto implementa un **pipeline modular de extracción y cotejo de datos automatizado** utilizando **Python, Selenium WebDriver y Pandas**:

1. **Lectura y Normalización de Fuentes (`01_df_correo.py`)**:
   - Carga la base de datos interna y prepara los lotes de registros a consultar, limpiando formatos y caracteres especiales.
2. **Navegación Emulada y Extracción Dinámica (`02_xtraer_data_dni.py`)**:
   - Automatiza el navegador para acceder al portal objetivo, ingresar secuencialmente cada número de identificación, enviar el formulario y esperar a que el DOM procese la respuesta dinámica.
   - Extrae con precisión nombres completos, apellidos, vigencia y demás campos relevantes.
3. **Cotejo y Auditoría Automatizada (`03_comparar_data.py`)**:
   - Cruza la información obtenida en tiempo real contra los registros internos de la empresa.
   - Detecta discrepancias de nombres, suplantaciones o datos desactualizados.
4. **Exportación de Informes de Discrepancias (`F_verificar_dni_0.1.py`)**:
   - Genera archivos estructurados (CSV/Excel) listos para la toma de decisiones o para iniciar acciones de regularización.

---

## 📈 Impacto y Mejoras Conseguidas

| Desafío Operativo | Proceso Manual | Con el Pipeline de Scraping | Mejora Cuantificable |
|---|---|---|---|
| **Velocidad de Verificación** | 1 a 2 consultas por minuto por operador | Cientos de consultas por hora de manera desatendida | **Aumento de velocidad x30** |
| **Costo por Registro Verificado** | Alto costo en horas-hombre | Costo marginal cercano a cero | **Ahorro de hasta el 80% en presupuesto operativo** |
| **Fiabilidad del Cotejo** | Errores por cansancio visual del operador | Comparación matemática exacta celda por celda | **Precisión de auditoría del 100%** |
| **Escalabilidad** | Imposible procesar grandes picos de demanda | Capaz de procesar lotes masivos durante la noche | **Capacidad de respuesta inmediata ante auditorías** |

---

## ✨ Características Técnicas Destacadas

- **Espera Explícita y Manejo del DOM**: Uso riguroso de `WebDriverWait` y `expected_conditions` para evitar fallos por latencia de red o renderizado lento de JavaScript en la página web destino.
- **Arquitectura en Etapas (Pipeline Modular)**: Separación clara entre extracción, procesamiento y comparación para permitir reanudar el proceso sin perder datos ya scrapeados ante caídas imprevistas.
- **Control de Excepciones y Resiliencia**: Captura de errores por elementos no encontrados o timeouts, registrando el estado del lote para no interrumpir el flujo general.
- **Estructuración en DataFrames de Pandas**: Transformación inmediata de datos no estructurados de la web a tablas ordenadas y listas para analítica.

---

## 🛠️ Stack Tecnológico

- **Lenguaje**: Python 3.
- **Automatización de Navegador**: Selenium WebDriver.
- **Manipulación de Datos**: Pandas, NumPy.
- **Formatos de Salida**: CSV, Excel (`openpyxl`).

---

## 🗂️ Estructura del Repositorio

```text
├── VERIFICAR_DNI/
│   ├── 01_df_correo.py           # Preparación y depuración de la base de datos origen
│   ├── 02_xtraer_data_dni.py      # Automatización de scraping y extracción web con Selenium
│   ├── 03_comparar_data.py       # Algoritmo de cotejo y detección de inconsistencias
│   ├── F_verificar_dni_0.1.py    # Módulo integrado de verificación y exportación de reportes
│   └── README.md                 # Documentación técnica interna
└── README.md                     # Documentación general del repositorio
```

---

## 🚀 Instalación y Ejecución

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Enybyy/web-scraping-selenium-pipeline.git
   cd web-scraping-selenium-pipeline
   ```

2. **Instalar dependencias:**
   ```bash
   pip install selenium pandas openpyxl webdriver-manager
   ```

3. **Ejecutar el pipeline:**
   ```bash
   cd VERIFICAR_DNI
   python 01_df_correo.py
   python 02_xtraer_data_dni.py
   python 03_comparar_data.py
   ```

---

## 📬 ¿Necesitas extraer datos o automatizar flujos web en tu empresa?

Desarrollo **bots de extracción de datos (web scraping ético), pipelines de auditoría de información y automatizaciones de navegación para portales sin API pública**.

- **GitHub**: [@Enybyy](https://github.com/Enybyy)
- **Perfil Profesional**: Eliud RM — Data Science & Software Solutions
- *Contáctame para diseñar una solución de extracción de datos a la medida de tus necesidades.*
