<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0f766e,100:0891b2&height=220&section=header&text=Solver%20de%20Programaci%C3%B3n%20Lineal&fontSize=38&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=M%C3%A9todo%20Simplex%20%7C%20M%C3%A9todo%20Gr%C3%A1fico%20%7C%20An%C3%A1lisis%20de%20Sensibilidad&descAlignY=58&descSize=16"/>

<div align="center">

# Solver de Programación Lineal

Aplicativo académico web para formular y resolver problemas de Programación Lineal en forma básica, visualizar su transformación a forma aumentada y estudiar el proceso completo mediante Simplex tabular, método gráfico, visualización 3D y análisis de sensibilidad.

<p>
	<img src="https://img.shields.io/badge/React-19-0f172a?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
	<img src="https://img.shields.io/badge/TypeScript-5-0f172a?style=for-the-badge&logo=typescript&logoColor=3178C6" alt="TypeScript 5" />
	<img src="https://img.shields.io/badge/Vite-7-0f172a?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite 7" />
	<img src="https://img.shields.io/badge/Tailwind_CSS-4-0f172a?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8" alt="Tailwind CSS 4" />
</p>

<p>
	<img src="https://img.shields.io/badge/Programaci%C3%B3n%20Lineal-0f766e?style=for-the-badge&logoColor=white" alt="Programación Lineal" />
	<img src="https://img.shields.io/badge/M%C3%A9todo%20Simplex-0891b2?style=for-the-badge&logoColor=white" alt="Método Simplex" />
	<img src="https://img.shields.io/badge/M%C3%A9todo%20Gr%C3%A1fico-14b8a6?style=for-the-badge&logoColor=white" alt="Método gráfico" />
	<img src="https://img.shields.io/badge/Estado-En%20desarrollo%20acad%C3%A9mico-0f766e?style=for-the-badge" alt="Estado del proyecto" />
	<img src="https://img.shields.io/badge/Licencia-pendiente-64748b?style=for-the-badge" alt="Licencia pendiente" />
</p>

</div>

---

## Contenido

- [Descripción](#descripción)
- [Objetivo académico](#objetivo-académico)
- [Funcionalidades principales](#funcionalidades-principales)
- [Capturas de pantalla](#capturas-de-pantalla)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Módulos principales](#módulos-principales)
- [Ejemplos incluidos](#ejemplos-incluidos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Cómo usar la aplicación](#cómo-usar-la-aplicación)
- [Fundamento matemático](#fundamento-matemático)
- [Validación del proyecto](#validación-del-proyecto)
- [Limitaciones actuales](#limitaciones-actuales)
- [Roadmap](#roadmap)
- [Detalles técnicos adicionales](#detalles-técnicos-adicionales)
- [Créditos](#créditos)

---

## Descripción

Este proyecto es una aplicación web académica orientada a la enseñanza y resolución de modelos de Programación Lineal. El usuario puede ingresar el problema en su forma básica, definir si desea **maximizar** o **minimizar**, ajustar dinámicamente el número de variables y restricciones, y resolver el modelo con una experiencia visual e interactiva centrada en el proceso.

El sistema integra una cadena completa de trabajo:

- formulación del modelo original,
- conversión a forma aumentada,
- construcción y actualización del tablero Simplex,
- resolución paso a paso de cada iteración,
- método gráfico para problemas de dos variables,
- visualización 3D del espacio factible para modelos de tres variables,
- resumen visual algebraico para modelos de cuatro o más variables,
- análisis de sensibilidad base,
- ejemplos precargados para validación y estudio.

> [!IMPORTANT]
> **Alcance actual del solver**
>
> La implementación actual soporta problemas de **maximización o minimización** con restricciones **≤**, lado derecho **no negativo** y variables de decisión **no negativas**. Para minimización, el motor tabular transforma internamente el problema a la maximización equivalente **W = -Z** y luego recupera el valor original de la función objetivo.

---

## Objetivo académico

El aplicativo fue diseñado para apoyar el aprendizaje de **Programación Lineal** e **Investigación de Operaciones** mostrando no solo el resultado óptimo final, sino también la lógica matemática que conduce a ese resultado.

Su valor académico está en que permite estudiar de manera integrada:

- la **formulación** del problema,
- la **transformación** a forma aumentada,
- las **iteraciones** del método Simplex,
- la selección de variable **entrante**, **saliente** y **pivote**,
- la **interpretación** de la solución óptima,
- la lectura geométrica en **2D** y **3D**,
- y una primera aproximación al **análisis de sensibilidad**.

---

## Funcionalidades principales

| Funcionalidad | Descripción |
| --- | --- |
| Entrada dinámica | Permite agregar o quitar variables y restricciones manteniendo coherencia automática del formulario. |
| Maximización y minimización | Incluye selector explícito de tipo de optimización en el modelo. |
| Simplex tabular | Resuelve el problema tablero por tablero a partir de la forma aumentada. |
| Paso a paso | Explica iteraciones, variable entrante, variable saliente, pivote y operaciones de fila. |
| Método gráfico 2D | Grafica región factible, restricciones, vértices y rectas de nivel para problemas de dos variables. |
| Visualización 3D | Muestra planos de restricción, vértices factibles y punto óptimo en el espacio tridimensional. |
| Modelos de 4+ variables | Sustituye la gráfica cartesiana por un resumen visual algebraico con barras, holguras y mapa de calor. |
| Sensibilidad | Presenta restricciones activas, holguras, costos reducidos, precios sombra y estructura base de rangos permisibles. |
| Ejemplos precargados | Incluye 10 modelos listos para validar el flujo completo del aplicativo. |
| Responsive UI | La interfaz está adaptada a escritorio, tablet y móvil con componentes interactivos y animaciones. |

---

## Capturas de pantalla

No se detectó una carpeta de capturas dentro del repositorio actual. En lugar de inventar imágenes, el README deja una estructura recomendada para documentar la interfaz en GitHub:

```text
docs/screenshots/
├── home.png
├── simplex-step-by-step.png
├── graphical-2d.png
├── graphical-3d.png
├── sensitivity-analysis.png
└── summary-4plus.png
```

> Agrega aquí capturas reales del proyecto en ejecución.

| Inicio | Simplex paso a paso |
| --- | --- |
| ![Inicio](docs/screenshots/home.png) | ![Simplex](docs/screenshots/simplex-step-by-step.png) |

| Método gráfico 2D | Visualización 3D |
| --- | --- |
| ![2D](docs/screenshots/graphical-2d.png) | ![3D](docs/screenshots/graphical-3d.png) |

| Análisis de sensibilidad | Resumen visual 4+ variables |
| --- | --- |
| ![Sensibilidad](docs/screenshots/sensitivity-analysis.png) | ![Resumen visual](docs/screenshots/summary-4plus.png) |

---

## Tecnologías utilizadas

### Stack principal

<p>
	<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
	<img src="https://img.shields.io/badge/TypeScript-0F172A?style=for-the-badge&logo=typescript&logoColor=3178C6" alt="TypeScript" />
	<img src="https://img.shields.io/badge/Vite-0F172A?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
	<img src="https://img.shields.io/badge/Tailwind%20CSS-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8" alt="Tailwind CSS" />
	<img src="https://img.shields.io/badge/TanStack%20Start-0F172A?style=for-the-badge&logo=reactrouter&logoColor=white" alt="TanStack Start" />
	<img src="https://img.shields.io/badge/Framer%20Motion-0F172A?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
	<img src="https://img.shields.io/badge/Three.js-0F172A?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js" />
	<img src="https://img.shields.io/badge/React%20Three%20Fiber-0F172A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Three Fiber" />
</p>

### Dependencias principales detectadas desde `package.json`

| Categoría | Dependencias reales | Uso dentro del proyecto |
| --- | --- | --- |
| Frontend base | `react`, `react-dom`, `typescript`, `vite` | Construcción de la SPA académica y tipado del dominio. |
| Routing y app shell | `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/react-query` | Enrutamiento y composición de la aplicación. |
| Estilos e interfaz | `tailwindcss`, `@tailwindcss/vite`, `framer-motion`, `lucide-react`, `@radix-ui/*` | UI responsive, animaciones y componentes de interacción. |
| Formularios y validación | `react-hook-form`, `zod`, `@hookform/resolvers` | Base de validación y manejo de entradas estructuradas. |
| Visualización 2D y 4+ variables | `recharts` | Barras, resúmenes visuales y lectura algebraica complementaria. |
| Visualización 3D | `three`, `@react-three/fiber`, `@react-three/drei` | Escena 3D del espacio factible para modelos con tres variables. |
| Calidad y formato | `eslint`, `prettier`, `eslint-plugin-prettier`, `eslint-plugin-react-hooks` | Validación estática y consistencia de código. |
| Integración de entorno | `@cloudflare/vite-plugin` | Tooling adicional para entorno Vite/Cloudflare. |

---

## Estructura del proyecto

```text
.
├── package.json
├── vite.config.ts
├── wrangler.jsonc
├── src/
│   ├── components/
│   │   ├── examples/
│   │   │   ├── ExampleCard.tsx
│   │   │   └── ExampleSelector.tsx
│   │   ├── forms/
│   │   │   └── LinearModelForm.tsx
│   │   ├── graphical/
│   │   │   ├── FeasibleSpace3DSection.tsx
│   │   │   ├── GraphLegend.tsx
│   │   │   ├── GraphicalMethodSection.tsx
│   │   │   ├── GraphicalPlane.tsx
│   │   │   └── VertexEvaluationTable.tsx
│   │   ├── layout/
│   │   ├── math/
│   │   ├── results/
│   │   │   ├── ModelVisualSummarySection.tsx
│   │   │   ├── SensitivityAnalysisSection.tsx
│   │   │   └── SolutionShowcase.tsx
│   │   ├── steps/
│   │   │   ├── StepByStepPlayer.tsx
│   │   │   ├── StepCard.tsx
│   │   │   └── StepTimeline.tsx
│   │   ├── ui/
│   │   └── visualization/
│   ├── lib/
│   │   ├── error-capture.ts
│   │   ├── error-page.ts
│   │   ├── utils.ts
│   │   └── linear-programming/
│   │       ├── examples.ts
│   │       ├── graphical.ts
│   │       ├── sensitivity.ts
│   │       ├── simplex.ts
│   │       ├── types.ts
│   │       ├── utils.ts
│   │       └── visualization.ts
│   ├── routes/
│   │   ├── __root.tsx
│   │   └── index.tsx
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
└── README.md
```

### Lectura rápida de carpetas

| Carpeta / archivo | Propósito |
| --- | --- |
| `src/routes/index.tsx` | Orquesta el flujo principal: ejemplos, formulario, solver, gráficos, 3D y resultados. |
| `src/components/forms` | Entrada dinámica del modelo lineal y selector de maximización/minimización. |
| `src/components/examples` | Catálogo de ejemplos precargados con resultados esperados. |
| `src/components/steps` | Reproductor paso a paso del método Simplex. |
| `src/components/graphical` | Método gráfico 2D y visualización 3D del espacio factible. |
| `src/components/results` | Solución óptima, sensibilidad y resumen visual de modelos de alta dimensión. |
| `src/lib/linear-programming` | Núcleo matemático: tipos, utilidades, solver, sensibilidad, ejemplos y visualizaciones. |
| `src/styles.css` | Estilos globales, tokens visuales y utilidades de la interfaz. |

---

## Módulos principales

### Formulario del modelo

El formulario principal permite definir la función objetivo, ajustar el número de variables y restricciones, elegir entre **maximizar** o **minimizar** y resolver el modelo desde una vista moderna y responsive. La entrada se mantiene sincronizada automáticamente al agregar o quitar columnas y filas.

Incluye validaciones para:

- coeficientes numéricos,
- coherencia entre número de variables y restricciones,
- lado derecho numérico y no negativo,
- operador `≤` como alcance actual del solver,
- detección de intento de resolver un problema vacío.

### Motor Simplex

El motor tabular se implementa principalmente en `src/lib/linear-programming/simplex.ts`. Sus responsabilidades incluyen:

- construcción del tablero inicial,
- generación de variables de holgura,
- selección de variable entrante por coeficiente más negativo en la fila Z,
- prueba de razones para la variable saliente,
- pivoteo y operaciones elementales por fila,
- detección de casos óptimos y no acotados,
- recuperación del valor original para problemas de minimización transformados a `W = -Z`.

### Método gráfico 2D

Para problemas con exactamente dos variables, `graphical.ts` construye la lectura geométrica del modelo mediante:

- rectas frontera de las restricciones,
- intersecciones candidatas,
- filtrado de puntos factibles,
- polígono de la región factible,
- evaluación de vértices,
- rectas de nivel de la función objetivo,
- identificación del punto óptimo y secuencia explicativa por etapas.

### Visualización 3D

Para modelos con tres variables, `visualization.ts` y `FeasibleSpace3DSection.tsx` generan una escena tridimensional basada en:

- planos de restricción,
- planos coordenados,
- detección de vértices factibles por intersección de planos,
- evaluación de `Z` en cada vértice,
- resaltado del punto óptimo,
- interacción con cámara: rotación, zoom y desplazamiento.

### Análisis de sensibilidad

El módulo `sensitivity.ts` construye una lectura base del tablero final y presenta:

- holguras finales,
- restricciones activas e inactivas,
- costos reducidos,
- precios sombra,
- estructura preparada para rangos permisibles de coeficientes y lados derechos.

En problemas de minimización, los costos reducidos y precios sombra se muestran de forma **técnicamente cauta**, ya que provienen del tablero equivalente `W = -Z` y no se fuerzan interpretaciones económicas del signo en el modelo original.

---

## Ejemplos incluidos

El proyecto incluye **10 ejemplos precargados** definidos en `src/lib/linear-programming/examples.ts`.

| Ejemplo | Tipo | Variables | Método visual | Resultado esperado |
| --- | --- | ---: | --- | --- |
| Wyndor Glass | Maximización | 2 | Gráfico 2D | `Z = 36` |
| Word Light | Maximización | 2 | Gráfico 2D | `Z = 175` |
| Caso tabular del material | Maximización | 2 | Gráfico 2D | `Z = 21` |
| Producción de mesas y sillas | Maximización | 2 | Gráfico 2D | `Z = 2600` |
| Minimización simple compatible | Minimización | 2 | Gráfico 2D | `Z = 0` |
| Minimización 3D equivalente | Minimización | 3 | Visualización 3D | `Z = -13` |
| Producción con 3 variables | Maximización | 3 | Visualización 3D | `Z = 13` |
| Modelo de 4 variables | Maximización | 4 | Resumen visual | `Z = 86.6667` |
| Modelo de 5 variables | Maximización | 5 | Resumen visual | `Z = 260` |
| Modelo grande de 10 variables | Maximización | 10 | Resumen visual | `Z = 730` |

---

## Instalación y ejecución

### Clonar el repositorio

```bash
git clone https://github.com/spalacioc05/pl-optimizacion.git
cd pl-optimizacion
```

### Instalar dependencias

```bash
npm install
```

### Ejecutar en desarrollo

```bash
npm run dev
```

### Construir y validar

```bash
npm run build
npm run lint
```

### Scripts disponibles

| Script | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo con Vite. |
| `npm run build` | Genera la compilación de producción. |
| `npm run build:dev` | Genera una compilación usando el modo `development`. |
| `npm run preview` | Previsualiza localmente el build generado. |
| `npm run lint` | Ejecuta ESLint sobre el proyecto. |
| `npm run format` | Formatea el proyecto con Prettier. |

---

## Cómo usar la aplicación

1. Selecciona un ejemplo precargado o ingresa un modelo manualmente.
2. Define si el problema es de **maximización** o **minimización**.
3. Ajusta el número de variables y restricciones si es necesario.
4. Ingresa los coeficientes de la función objetivo y las restricciones.
5. Presiona **Resolver con Método Simplex**.
6. Revisa el modelo original y la forma aumentada.
7. Sigue las iteraciones del tablero Simplex paso a paso.
8. Si el problema tiene **2 variables**, analiza la región factible y la recta objetivo en el método gráfico 2D.
9. Si el problema tiene **3 variables**, explora la escena 3D del espacio factible.
10. Si el modelo tiene **4 o más variables**, consulta el resumen visual algebraico.
11. Examina la solución óptima y el análisis de sensibilidad base.

---

## Fundamento matemático

La aplicación se apoya en conceptos fundamentales de Programación Lineal:

- **Función objetivo**: expresión lineal que se busca maximizar o minimizar.
- **Restricciones**: conjunto de desigualdades que delimitan la región factible.
- **No negatividad**: condición que impone `Xi ≥ 0` sobre las variables de decisión.
- **Forma aumentada**: representación equivalente del modelo al introducir variables de holgura.
- **Método Simplex**: procedimiento iterativo que recorre soluciones básicas factibles hasta alcanzar el óptimo.
- **Método gráfico**: lectura geométrica del problema cuando existen dos variables de decisión.
- **Visualización 3D**: representación espacial del poliedro factible cuando existen tres variables.
- **Análisis de sensibilidad**: estudio base del comportamiento de restricciones, holguras y efectos marginales en torno al óptimo actual.

---

## Validación del proyecto

El proyecto puede validarse localmente con:

```bash
npm run lint
npm run build
```

### Casos base verificados

| Ejemplo | Resultado esperado |
| --- | --- |
| Wyndor Glass | `Z = 36` |
| Word Light | `Z = 175` |
| Producción de mesas y sillas | `Z = 2600` |
| Producción con 3 variables | `Z = 13` |
| Minimización simple compatible | `Z = 0` |
| Minimización 3D equivalente | `Z = -13` |

---

## Limitaciones actuales

El README documenta el estado real del proyecto al momento del análisis:

- el solver actual trabaja con restricciones `≤`, lado derecho no negativo y variables no negativas,
- el soporte robusto para restricciones `≥` o `=` requeriría extender el motor con **Gran M** o **dos fases**,
- la gráfica cartesiana completa aplica solo para modelos de **2 variables**,
- la visualización tridimensional completa aplica solo para modelos de **3 variables**,
- los modelos de **4 o más variables** se presentan mediante resumen visual y solución tabular,
- los **rangos permisibles completos** del análisis de sensibilidad todavía aparecen como estructura preparada o pendiente,
- en minimización, la lectura de costos reducidos y precios sombra se muestra como referencia técnica del modelo equivalente `W = -Z`.

---

## Roadmap

- [x] Entrada dinámica de variables y restricciones
- [x] Selector de maximización y minimización
- [x] Método Simplex tabular paso a paso
- [x] Método gráfico 2D
- [x] Visualización 3D para tres variables
- [x] Resumen visual para 4+ variables
- [x] Ejemplos precargados
- [x] Análisis de sensibilidad base
- [ ] Rangos permisibles completos
- [ ] Soporte robusto para restricciones `≥` y `=`
- [ ] Exportación de resultados a PDF
- [ ] Documentación académica final

---

## Detalles técnicos adicionales

<details>
<summary><strong>Ver explicación del Método Simplex tabular</strong></summary>

El motor construye un tablero inicial con variables de holgura como base factible. En cada iteración identifica la variable entrante por el coeficiente más negativo de la fila Z, calcula la razón mínima positiva para elegir la variable saliente, ejecuta el pivoteo y registra una explicación narrativa del paso. Este flujo se traduce a la interfaz en una secuencia de tarjetas con tablero, razón, pivote, operaciones por fila y lectura de optimalidad.

</details>

<details>
<summary><strong>Ver explicación del Método gráfico 2D</strong></summary>

Cuando el modelo tiene exactamente dos variables, el sistema calcula intersecciones entre restricciones, filtra puntos factibles, construye la región convexa, evalúa `Z` en cada vértice y muestra una secuencia visual con rectas de restricción, región factible, tabla de evaluación y punto óptimo. La experiencia incluye controles de reproducción paso a paso y una leyenda de elementos gráficos.

</details>

<details>
<summary><strong>Ver explicación de la Visualización 3D</strong></summary>

Para tres variables, la app genera una escena 3D con ejes, planos de restricción y vértices factibles obtenidos por intersección exacta de planos. La escena permite rotar, hacer zoom y desplazar la cámara, y acompaña la vista con una secuencia de etapas que explica el surgimiento del poliedro factible, la evaluación de vértices y la identificación del óptimo.

</details>

<details>
<summary><strong>Ver explicación del Análisis de sensibilidad</strong></summary>

El análisis de sensibilidad actual es una lectura base del tablero óptimo. Muestra restricciones activas, holguras, variables básicas y no básicas, costos reducidos y precios sombra. Los rangos permisibles aún no se calculan por completo, pero la estructura visual y tabular para incorporarlos ya está preparada dentro del módulo.

</details>

---

## Créditos

Proyecto académico desarrollado para el curso de **Programación Lineal / Investigación de Operaciones**.

**Institución:** Universidad de Antioquia

---

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0891b2,100:0f766e&height=120&section=footer"/>
