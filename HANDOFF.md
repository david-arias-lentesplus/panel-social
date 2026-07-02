# HANDOFF.md — Panel Social · LIVO Analytics
> Registro vivo del proyecto. Actualizar al final de cada sesión de trabajo.
> Agente responsable: `handoff-documenter` skill.

---

## 📌 Estado Actual del Proyecto

| Campo | Valor |
|-------|-------|
| **Versión** | 0.1.0 — Bootstrap inicial |
| **Fecha último update** | 2026-06-23 |
| **Estado** | 🟡 En desarrollo — listo para instalar dependencias y probar en local |
| **Prioridad siguiente** | Conectar primeros Google Sheets reales y validar columnas |

---

## 🏗️ Sesiones de Trabajo

### Sesión 001 — 2026-06-23 · Bootstrap del proyecto
**Realizado:**
- Scaffolding completo de la aplicación (Vite + React 18 + Tailwind CSS v3)
- Integración del Design System LIVO en `tailwind.config.js` (tokens de color, tipografía, sombras, radios)
- `csvParser.js`: fetch asíncrono de múltiples URLs, parsing con PapaParse, deduplicación por fingerprint
- `useDataSources.js`: CRUD de fuentes de datos con persistencia en localStorage
- `useSheetData.js`: hook de fetching reactivo con AbortController
- Componentes UI (Button, Badge, Card, Input, Spinner) — 100% LIVO Design System
- Layout (Sidebar colapsable, Header con refresh)
- `DataSourceManager`: modal panel para gestión de fuentes CSV con preview de URL
- 3 vistas: Overview (KPIs + líneas), Content (tabla Top 10), Audience (donut + barras)
- `CLAUDE.md` y `HANDOFF.md` (este archivo)
- `vercel.json` configurado para SPA

**Archivos creados:**
```
panel-social/
  package.json · vite.config.js · tailwind.config.js
  postcss.config.js · vercel.json · index.html
  src/index.css · src/main.jsx · src/App.jsx
  src/utils/csvParser.js
  src/hooks/useDataSources.js · src/hooks/useSheetData.js
  src/components/ui/Button.jsx · Badge.jsx · Card.jsx · Input.jsx · Spinner.jsx
  src/components/layout/Sidebar.jsx · Header.jsx
  src/components/DataManager/DataSourceManager.jsx
  src/components/charts/LineChartComponent.jsx
  src/components/charts/BarChartComponent.jsx
  src/components/charts/PieChartComponent.jsx
  src/views/Overview.jsx · Content.jsx · Audience.jsx
  CLAUDE.md · HANDOFF.md
```

---

## 🐛 Errores Conocidos y Soluciones

### ❌ Error: Tailwind no encuentra las clases en los archivos JSX
**Síntoma:** Los estilos de Tailwind no se aplican al compilar.
**Causa:** `tailwind.config.js` `content` no incluye `./src/**/*.jsx`.
**Solución:** El `content` ya incluye `'./src/**/*.{js,jsx,ts,tsx}'`. Verificar que no se haya modificado.

### ❌ Error: Google Sheets CORS en desarrollo local
**Síntoma:** `fetch` falla con `CORS error` al intentar cargar un CSV.
**Causa:** Google Sheets permite CORS en producción (HTTPS) pero puede bloquearlo en `localhost`.
**Solución:** Usar `npm run preview` (que sirve el build en HTTPS-like) o configurar un proxy en `vite.config.js`:
```js
server: {
  proxy: {
    '/sheets-proxy': {
      target: 'https://docs.google.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/sheets-proxy/, ''),
    },
  },
}
```

### ❌ Error: `normalizeSheetUrl` no convierte correctamente URLs de edición privada
**Síntoma:** El URL `/edit?usp=sharing` no se convierte a `/pub?output=csv` si el Sheet no es público.
**Causa:** Los Sheets deben estar publicados en la web, no solo compartidos con link.
**Solución (para el usuario):** Archivo → Compartir → **Publicar en la web** (diferente a "Obtener enlace"). El Sheet debe estar publicado, no solo compartido.

### ❌ Error: Columnas del CSV no reconocidas en las vistas
**Síntoma:** Los KPIs muestran `—` y los gráficos aparecen vacíos aunque hay datos.
**Causa:** Los nombres de columna del CSV exportado de Meta no coinciden con los esperados.
**Solución:** Las funciones `normalizeRow` en cada vista hacen matching flexible (lowercase + aliases). Si el CSV tiene columnas nuevas, agregar el alias en la función `normalizeRow` de la vista correspondiente. Ver sección "Columnas esperadas" en cada vista.

---

## 📋 Estructura de Columnas Esperadas por Vista

### Overview (`type: 'overview'`)
| Columna CSV | Alias aceptados |
|-------------|----------------|
| fecha | date, día |
| seguidores | followers, seguidores_totales |
| alcance | reach |
| impresiones | impressions |
| interacciones | interactions |

### Content (`type: 'content'`)
| Columna CSV | Alias aceptados |
|-------------|----------------|
| tipo | type |
| fecha | date |
| descripcion | description, título |
| me_gusta | likes |
| comentarios | comments |
| compartidos | shares |
| guardados | saved |
| interacciones | interactions |
| alcance | reach |

### Audience (`type: 'audience'`)
El sistema detecta automáticamente el tipo de dato mirando los encabezados:
- Si hay columna con "ciudad" o "city" → gráfica de ciudades
- Si hay columna con "edad" o "age" → gráfica de rangos de edad
- Si hay columna con "género", "genero" o "gender" → gráfica de género

---

## 🗺️ Roadmap y Próximos Pasos

### 🔴 Crítico (hacer antes del primer deploy)
- [ ] `npm install` en la carpeta `panel-social/` y verificar que compila sin errores
- [ ] Conectar primer Google Sheet real y validar que las columnas se mapean correctamente
- [ ] Ajustar aliases en `normalizeRow` según los encabezados reales de los exports de Meta
- [ ] Subir a GitHub y configurar proyecto en Vercel

### 🟡 Importante (sprint 2)
- [ ] Selector de rango de fechas en la vista Overview
- [ ] Exportar gráficas a imagen (html2canvas o similar)
- [ ] Generar reporte PDF con datos actuales (skill `pdf`)
- [ ] Página 404 para rutas no encontradas
- [ ] Loading skeleton en lugar de spinner para mejor UX
- [ ] Favicon personalizado LIVO

### 🟢 Mejoras futuras (backlog)
- [ ] Vista de comparativo período vs período
- [ ] Notificaciones cuando el fetch de una fuente falla
- [ ] Dark mode (tokens ya están en CSS variables)
- [ ] Ordenar columnas de la tabla de Contenido
- [ ] Búsqueda dentro de la tabla de Contenido
- [ ] Agregar fuentes de TikTok (mismo mecanismo CSV)

---

## 🔑 Decisiones de Arquitectura

| Decisión | Razón |
|----------|-------|
| Vite sobre Next.js | SPA sin SSR, más simple para Vercel con assets estáticos |
| PapaParse sobre fetch+split manual | Maneja encoding, escaping de comas y comillas correctamente |
| Dedup por JSON.stringify de valores | Evita duplicados de la misma fila en múltiples exports sin necesitar un ID |
| localStorage para persistencia | Sin backend ni auth — todo en el browser del usuario |
| Recharts sobre Chart.js | Mejor integración con React (componentes declarativos) |
| Detección automática de columnas | Los exports de Meta cambian nombres según el idioma de la cuenta |

---

## 👤 Contexto del Equipo

- **Proyecto:** Panel Social para Instagram de LIVO / LentesPlus B2B
- **Carpeta de trabajo:** Google Drive → DISEÑO → LENTESPLUS - B2B → DATOS_SOCIAL → Panel Social
- **Design System:** `DESIGN_SYSTEM-LIVO.md` en la raíz de la carpeta del proyecto
- **Stack de datos:** Exportación manual de Meta Business Suite → limpieza en Google Sheets → publicar como CSV

---

## 📝 Notas para el Siguiente Agente

1. Leer `CLAUDE.md` primero para contexto completo del proyecto
2. Siempre seguir el Design System LIVO — NO inventar colores ni estilos
3. Al agregar una nueva columna de datos, actualizar la sección "Columnas esperadas" de este archivo
4. Si hay un error nuevo, documentarlo en "Errores Conocidos" con síntoma + causa + solución
5. Las funciones `normalizeRow` en cada vista son el punto de mapeo de columnas — revisar ahí primero
6. `useSheetData` usa AbortController — no cancelar el request manualmente fuera del hook


---

### Sesión 002 — 2026-06-23 · Bug fix loop infinito + hardening

**Problema reportado:** "al cargar un nuevo link de sheets con el csv la pagina dejo de funcionar"

**Causa raíz:** `getByType()` devolvía una nueva referencia de array en cada render → `useEffect` en `useSheetData` se disparaba infinitamente → la app se congelaba.

**Fixes aplicados:**
- `useDataSources.js` v2: `useMemo` por tipo para referencias estables; `getByType` con `useCallback`
- `useSheetData.js` v2: `sourcesKey = JSON.stringify(...)` como dependencia del efecto en lugar de la referencia del array
- `ErrorBoundary.jsx` (nuevo): class component que envuelve `<Routes>`, muestra error amigable con botón Reintentar
- `csvParser.js` v2: detección de respuesta HTML (sheet no publicado), `error` callback en PapaParse, try/catch por fila

**Archivos modificados/creados:** `useDataSources.js`, `useSheetData.js`, `csvParser.js`, `ErrorBoundary.jsx`, `App.jsx`

---

### Sesión 003 — 2026-06-23 · Parsers reales + persistencia cross-device

**Contexto:** Se inspeccionaron las 3 URLs reales de Google Sheets. Requisito: URLs disponibles desde Vercel y cualquier dispositivo sin re-ingresar.

**Estructura real de los sheets:**

| Sheet | gid | Estructura |
|-------|-----|------------|
| Resultados | 2114262164 | Serie diaria: Fecha, Clics×2, Interacciones, Seguidores, Visitas, Visualizaciones |
| Contenido | 1327748114 | Export Meta BS: ~16 cols en español, números con coma `"35,038"`, tipos: Reel/Secuencia/Historia |
| Público | 2141796658 | 3 tablas paralelas: edad/género (A-C), ciudades (E-F), países (H-I) en una sola CSV |

**Solución persistencia cross-device:**
- `src/config/defaultSources.js` (NUEVO): 3 URLs hardcodeadas commitadas a git → disponibles en cualquier dispositivo/Vercel automáticamente
- `useDataSources.js` v3: arquitectura de dos capas — defaults (git) + extras del usuario (localStorage). Los defaults no se pueden borrar, solo desactivar.

**Cambios de nomenclatura (tipos):**
- `overview` → `resultados`
- `content` → `contenido`  
- `audience` → `publico`

**Parsers actualizados:**
- `src/utils/audienceParser.js` (NUEVO): extrae 3 sub-tablas del CSV multi-columna del sheet Público. Detecta headers por nombre parcial (robusto ante cambios de orden).
- `parseMetaNumber(val)` en `audienceParser.js`: limpia `"35,038"` → `35038`
- `Overview.jsx` (reescrito): mapea columnas reales de Resultados, calcula delta vs día anterior en KPIs, 6 gráficas de serie temporal
- `Content.jsx` (reescrito): detecta headers por término parcial (robusto), filtra por tipo de publicación, tabla Top N ordenable por cualquier métrica
- `Audience.jsx` (reescrito): usa `parseAudienceSheet()`, muestra donut de género, top ciudades, barras edad/género, barras países
- `DataSourceManager.jsx` v3: tipos `resultados|contenido|publico`, fuentes default marcadas como 📌 Permanente (no eliminables)

**Archivos creados/modificados:**
```
src/config/defaultSources.js (NUEVO)
src/utils/audienceParser.js (NUEVO)
src/hooks/useDataSources.js (v3)
src/views/Overview.jsx (v2 — parsers reales)
src/views/Content.jsx (v2 — parsers reales)
src/views/Audience.jsx (v2 — parser multi-tabla)
src/components/DataManager/DataSourceManager.jsx (v3)
```

**Build validado:** ✅ 6 chunks, 0 errores (en /tmp fuera de Google Drive por lock EPERM)

**Nota EPERM:** El directorio `dist/` dentro de Google Drive se bloquea por el sync daemon. Para hacer build en producción local: eliminar `dist/` manualmente desde Finder antes de correr `npm run build`. En Vercel no hay este problema.

---

## 🐛 Errores Conocidos / Workarounds

| Error | Causa | Workaround |
|-------|-------|------------|
| `EPERM: operation not permitted, unlink dist/` | Google Drive bloquea el directorio sync | Eliminar `dist/` desde Finder antes de `npm run build` |
| Sheet devuelve HTML en lugar de CSV | Sheet no publicado correctamente | Ir a Archivo → Publicar en la web → elegir hoja + CSV |
| Headers duplicados en Resultados ("Clics en el enlace" × 2) | Export de Meta con bug de headers | El parser toma col[0] como alcance y col[1] como clics reales |

---

## 🗺️ Roadmap

- [x] Scaffold React/Vite/Tailwind/Recharts
- [x] DataSourceManager con CRUD de fuentes
- [x] Fix infinite fetch loop  
- [x] Parsers reales para los 3 sheets de Meta
- [x] Persistencia cross-device (defaultSources.js en git)
- [ ] Deploy a Vercel y verificar con URLs reales
- [ ] Agregar rango de fecha (date picker) como filtro global
- [ ] Exportar vista a imagen/PDF
- [ ] Modo comparativo (período actual vs anterior)

---

### Sesión 004 — 2026-06-24 · UX v2 — DateRangePicker, comparativas, leyendas, paginación

**Rol:** Senior Frontend Developer & UI/UX Expert

---

#### Changelog UI/UX

**1. DateRangePicker global** (`src/components/ui/DateRangePicker.jsx` — NUEVO)
- Dropdown con presets (Ayer, Últimos 7/28/90 días, Esta semana, Este mes, Este año, La semana pasada, El mes pasado, Personalizado)
- Calendario dual (dos meses lado a lado, Monday-first, grid 7×6)
- Selección de rango con click-inicio / click-fin + hover preview
- Checkbox "Comparar" para activar modo comparativo
- Botones Cancelar / Actualizar (el rango solo aplica al presionar Actualizar)
- Posicionado en `GlobalBar` (barra fija encima del contenido, fuera del Header de cada vista)
- **Justificación UX:** Los filtros globales van en un espacio global y siempre visible, no dentro de cada vista, para evitar ambigüedad de alcance.

**2. Botón Exportar PDF** (`GlobalBar` — mockeado)
- `alert()` placeholder. Pendiente integrar jsPDF + html2canvas.

**3. Filtro de fecha en vistas** (`Overview.jsx`, `Content.jsx`)
- `useDateRange` hook proporciona `dateRange.start/end`
- Cada vista filtra sus `rows` por `dateObj >= start && dateObj <= end`
- Vista Público no tiene serie temporal → sin filtro de fecha (aplica al sheet completo)

**4. Comparativas mensuales** (`Overview.jsx`)
- Cuando `monthSpan >= 2`: aparece sección "Comparativa mensual" con 4 BarCharts agrupados por mes
- Agrupa datos por `monthKey(date)`, suma totales
- **Justificación:** Al comparar períodos de >1 mes, las métricas diarias pierden legibilidad; la comparativa mensual da la visión estratégica sin ruido.

**5. formatNumber() estandarizado** (`src/utils/dateUtils.js`)
- `formatNumber(val)`: limpia comas de miles Meta + `toLocaleString('es-CO')`
- Aplicado en: KPIs de todas las vistas, tabla de Contenido, tooltips de charts, paginación

**6. Charts — leyendas explícitas** (principio de dataviz: toda codificación visual debe tener leyenda)
- `PieChartComponent`: leyenda externa lateral (nombre + valor/%) en lugar de `<Legend>` de Recharts que no es legible con muchos items
- `BarChartComponent`: `<Legend>` cuando `bars.length > 1`; omitida si `singleColor` activo
- Público / Género: colores semánticos fijos (`#D92D8E` = Mujeres, `#0000E1` = Hombres)
- Público / Países: **color único** `#0000E1` (antes multicolor) — mismo color para misma variable es correcto según principios de Bertin; el multicolor implica categorías distintas

**7. LineChartComponent — tick management** (eje X)
- `interval` dinámico según largo del dataset: `>60 días → /8`, `>30 → /6`, `>14 → /4`, `≤14 → 0 (todos)`
- Evita solapamiento de etiquetas en rangos largos

**8. Paginación en Contenido** (`src/components/ui/Pagination.jsx` — NUEVO)
- 10 filas por página; controles numéricos con ellipsis para muchas páginas
- Reset de página al cambiar filtro de tipo o criterio de ordenamiento
- Muestra "N resultados · página X de Y"

**9. Icono External Link en Contenido**
- Icono SVG inline junto a la descripción, apunta al `enlace permanente MBS`
- `line-clamp-1` + `title` nativo en la celda de descripción

**10. Fuentes de datos — sin "permanentes"** (`useDataSources.js v4`)
- Todas las fuentes son iguales: editables, activables y eliminables
- Primera visita carga los 3 defaults de `defaultSources.js`; el usuario puede borrarlos
- DataSourceManager agrupa fuentes por tipo (Resultados / Contenido / Público)
- Tip en el footer: "Agrega múltiples CSVs del mismo tipo para cubrir períodos distintos"
- **Justificación:** Un período = un CSV export de Meta. Para tener histórico de 6 meses se necesitan 2 exports. La app fusiona automáticamente con deduplicación por fingerprint.

---

#### Nuevas Dependencias
Ninguna nueva librería externa. Todo implementado con:
- React 18 hooks (useState, useEffect, useMemo, useCallback, useRef)
- Recharts (ya instalado) — nuevas props aprovechadas: `interval` en XAxis
- CSS nativo para el calendario (grid de 7 columnas con Tailwind)

---

#### Nuevos Archivos
```
src/utils/dateUtils.js (NUEVO)
src/hooks/useDateRange.js (NUEVO)
src/components/ui/DateRangePicker.jsx (NUEVO)
src/components/ui/Pagination.jsx (NUEVO)
src/components/layout/GlobalBar.jsx (NUEVO)
```

#### Archivos modificados
```
src/App.jsx (v2 — GlobalBar + dateProps)
src/hooks/useDataSources.js (v4 — sin permanentes)
src/components/DataManager/DataSourceManager.jsx (v4)
src/components/charts/LineChartComponent.jsx (v2 — tick interval)
src/components/charts/PieChartComponent.jsx (v2 — leyenda externa)
src/components/charts/BarChartComponent.jsx (v2 — singleColor, leyenda)
src/views/Overview.jsx (v2 — dateFilter, MonthComparisonChart)
src/views/Content.jsx (v2 — dateFilter, paginación, external link)
src/views/Audience.jsx (v2 — leyendas, colores semánticos)
```

---

#### To-Do / Pendientes
- [ ] **Exportar PDF**: integrar `jsPDF` + `html2canvas`, capturar el área de contenido de cada vista
- [ ] **Modo "Comparar"**: al activar el checkbox, mostrar el período anterior en los mismos gráficos con línea punteada
- [ ] **Date Range en Público**: cuando haya múltiples sheets de Público con fechas distintas, filtrar por la fecha del archivo más reciente (actualmente sin filtro de fecha)
- [ ] **KPIs acumulados**: en Overview, mostrar totales del período (no solo último día)
- [ ] **Selector de columnas**: en tabla de Contenido, permitir mostrar/ocultar columnas de métricas

---

#### Build Validado
✅ 6 chunks, 0 errores, 859 módulos transformados (v2)

---

## Sesión 6 — Análisis profundo: Engagement Rate, KPIs por periodo, Data Bars, Sorting (2026-06-24)

### Fórmulas de Negocio

#### Engagement Rate (ER)
```
ER = (Interacciones / Alcance) × 100
```
- **Interacciones** = Me gusta + Comentarios + Compartidos + Guardados + Seguimientos (calculado por fila en `normalizeRow` de `Content.jsx`)
- Se protege contra división por cero: si `alcance === 0`, retorna `0`
- Implementada en `src/utils/dateUtils.js` como `export function calcER(interacciones, alcance)`

**ER por publicación (tabla):** ER de cada fila individual.  
**ER promedio del periodo (KPI):** Se calcula sobre los totales acumulados del periodo, no como promedio de ERs individuales — esto es la forma estadísticamente correcta:
```
ER_periodo = (Σ interacciones_del_periodo / Σ alcance_del_periodo) × 100
```

---

### Lógica de Estado: DateRangePicker → KPIs

#### Antes (v2): último punto de datos
Los KPIs mostraban `data[data.length - 1]` — el valor del último día disponible. No tenía relación con el rango seleccionado.

#### Ahora (v3): sumatoria total del periodo
```js
// Overview.jsx — totals calculado con useMemo reactivo al rango
const totals = useMemo(() => {
  const sum = (key) => data.reduce((acc, r) => acc + (r[key] ?? 0), 0)
  const alcance       = sum('alcance')
  const interacciones = sum('interacciones')
  return {
    alcance, interacciones,
    visualizaciones: sum('visualizaciones'),
    visitas:         sum('visitas'),
    seguidores:      sum('seguidores'),
    clics:           sum('clics'),
    er:              calcER(interacciones, alcance),  // ER del periodo completo
  }
}, [data])
```
`data` ya viene filtrado por el `DateRangePicker` global. Cuando el usuario cambia el rango, `dateRange.start/end` cambian → `data` se recalcula → `totals` se recalcula → los KPI Cards se re-renderizan automáticamente.

**KPIs en Overview (v3):** 6 tarjetas — Alcance total, Visualizaciones, Interacciones, Visitas al perfil, Nuevos Seguidores, Engagement Rate.  
**KPIs en Contenido (v3):** 4 tarjetas — Total publicaciones, Interacciones totales, Alcance total, Engagement Rate.

---

### Links a Meta Business Suite
En la tabla de Contenido, el ícono de enlace externo ahora apunta directamente a la vista de insights de esa publicación en MBS:
```
https://business.facebook.com/latest/insights/object_insights/
  ?asset_id=627596310710449        ← ID cuenta Instagram LentesPlus
  &business_id=385549068306940     ← ID Business Manager
  &ir_qe_exposed=1
  &content_id={Identificador de la publicación}  ← ID del post
  &nav_ref=bizweb_insights_uta_table
```
Construido en `Content.jsx` como `MBS_URL(r.id)`. El `id` se extrae en `normalizeRow` via `g('identificador de la publicación')`.

---

### Data Bars en columna Alcance
La celda de **Alcance** en la tabla tiene una barra de fondo visual:
```jsx
<div
  className="absolute inset-y-0 left-0 bg-[#0000E1] opacity-10 rounded-r pointer-events-none"
  style={{ width: `${(r.alcance / maxAlcancePagina) * 100}%` }}
/>
```
- El ancho es relativo al **máximo de Alcance en la página actual** (no del dataset completo), para que siempre haya una barra llena y la comparación sea visual dentro de lo que se ve.
- `pointer-events-none` asegura que no interfiere con clicks.

---

### Tabla Sorteable
Headers de métricas son clickeables. Estado: `sortBy` (clave) + `sortDir` (`'desc'` | `'asc'`).
- Click en columna nueva → sortea por esa columna, dirección `desc`
- Click en columna activa → invierte dirección (`desc` ↔ `asc`)
- Columna activa: fondo `bg-[#F0F0FF]` en celdas + indicador `▲/▼` en header
- Columnas no sorteables: `#`, Tipo, Fecha, Descripción

---

### Correcciones UX
- **Espacio en blanco en charts**: eliminado `className="h-full"` de la `Card` wrapper en `LineChartComponent` y `BarChartComponent`. Las cards ahora se ajustan a su contenido natural.
- **calcER**: `ER >= 5%` → verde, `2-5%` → naranja, `< 2%` → rojo (en columna ER de la tabla)

---

### Archivos Modificados (v3)
```
src/utils/dateUtils.js           — calcER() añadida
src/views/Overview.jsx           — v3: KPIs=totales, 6 cards, ER+Seguidores
src/views/Content.jsx            — v3: MBS link, ER col, data bars, sorting
src/components/charts/LineChartComponent.jsx  — fix: h-full eliminado
src/components/charts/BarChartComponent.jsx   — fix: h-full eliminado
```

### Build Validado
✅ 859 módulos, 0 errores, 6 chunks (v3 — 2026-06-24)

---

## Sesión 7 — Motor de Ingesta + Análisis Estadístico (2026-06-24)

### Nuevas dependencias
```
localforage  ^1.10.0  — IndexedDB wrapper (fallback: WebSQL → localStorage)
react-dropzone ^14.x  — Drag-and-drop de archivos en cliente
```

---

### Arquitectura de datos: IndexedDB + CSV estático

**Estrategia dual-layer (sin backend, Vercel free tier):**

```
┌─────────────────────────────────────────────────────┐
│                   useLocalData(type)                 │
│   1. Intenta IndexedDB (localforage)                 │
│      → si tiene datos → los usa                      │
│   2. Fallback: fetch /data/{type}.csv (estático)     │
│   3. Escucha evento 'livo:data-updated' → recarga    │
└─────────────────────────────────────────────────────┘
         ↑                          ↑
  DataIngestion.jsx          public/data/*.csv
  (sube CSVs → merge)        (baseline generado por
                              scripts/consolidate.py)
```

**IndexedDB Stores (via localforage):**
- `panel-social-livo/resultados` — filas de métricas diarias
- `panel-social-livo/contenido` — publicaciones
- `panel-social-livo/publico` — snapshot de audiencia

**Estrategia de merge por tipo:**
| Tipo        | Clave de deduplicación          | Estrategia     |
|-------------|----------------------------------|----------------|
| resultados  | `Fecha` (YYYY-MM-DD, 10 chars)  | Acumular/upsert|
| contenido   | `Identificador de la publicación`| Acumular/upsert|
| publico     | N/A (snapshot)                  | Replace total  |

**Flujo de actualización mensual:**
1. Descargar nuevos CSV de Meta Business Suite
2. Arrastrar a `/datos` (DataIngestion view)
3. PapaParse parsea en cliente → validación → `mergeRows()` → IndexedDB
4. `window.dispatchEvent('livo:data-updated')` → todas las vistas recargan sin refresh de página

---

### Validación de CSV por zona

| Zona        | Columna requerida                                  |
|-------------|---------------------------------------------------|
| resultados  | `Fecha` o `Date` + `Alcance`, `Visualizaciones` o `Primary` |
| contenido   | `Enlace permanente` **O** `Alcance`               |
| publico     | `Edad`, `Rango`, `Mujeres` **O** `País`/`Ciudad`  |

Si la validación falla → error amigable mostrado en la zona, sin persistir datos.

---

### Fórmulas Estadísticas (statsUtils.js)

#### 1. Percentil (P90) — detección de outliers
```
idx    = (p / 100) × (n − 1)
lower  = ⌊idx⌋
upper  = ⌈idx⌉
result = arr[lower] + frac(idx) × (arr[upper] − arr[lower])
```
Implementación: `percentile(arr, p)` en `statsUtils.js`. Para P90, una publicación es outlier si su Alcance o Interacciones > P90 del periodo.
- Clasificación "Viral": supera P90 en **ambas** métricas.
- Clasificación "Alto Rendimiento": supera P90 en **una** de las dos.

#### 2. Pareto (80/20)
```
1. Ordenar publicaciones por interacciones DESC
2. Acumular interacciones hasta Σ ≥ 0.8 × totalInteracciones
3. Contar N publicaciones necesarias
4. pctPosts = (N / totalPosts) × 100
5. pctValue = (acumulado / total) × 100
```
Resultado: "El X% de tus publicaciones generaron el Y% de las interacciones".

#### 3. Mapa de calor Día×Hora
```
Para cada publicación:
  dayIdx  = publicación.getDay() − 1   [0=Lun … 6=Dom]
  hourIdx = publicación.getHours()     [0–23]
  grid[dayIdx][hourIdx].count++
  grid[dayIdx][hourIdx].totalER += ER_publicación

avgER(día, hora) = totalER / count   (si count > 0, else 0)
```
Visualización: escala de color `rgba(0, 0, 225, α)` donde α = 0.08 + (avgER / maxER) × 0.82.
El eje X agrupa horas en bloques de 3h (00h, 03h, 06h … 21h) para legibilidad.

#### 4. Rendimiento por formato
```
Para cada tipo T:
  alcancePromedio(T)       = Σ alcance_i / N_T
  interaccionesPromedio(T) = Σ interacciones_i / N_T
  erPromedio(T)            = (Σ interacciones_i / Σ alcance_i) × 100
                             [ER calculado sobre totales, no promedio de ERs individuales]
```

---

### Nuevos archivos
```
src/utils/storageEngine.js         — localforage: getRows, mergeRows, clearRows, getMeta
src/utils/statsUtils.js            — percentile, paretoAnalysis, detectOutliers, formatPerformance, buildHeatmapGrid, parseHora, analyzeContentRow
src/hooks/useLocalData.js          — hook primario: IndexedDB → fallback CSV estático → event listener
src/views/DataIngestion.jsx        — /datos: 3 DropZones (react-dropzone), validación, merge, status
src/views/Analysis.jsx             — /analisis: Pareto banner, Heatmap, Formato, Outliers P90
src/components/charts/HeatmapChart.jsx — grid CSS nativo 7×8 bloques, escala de color LIVO
```

### Archivos modificados
```
src/App.jsx                  — v3: nuevas rutas /analisis + /datos; vistas sin prop dataSources
src/components/layout/Sidebar.jsx — v2: 5 ítems (+ Análisis + Datos); "Fuentes URL" relegado
src/views/Overview.jsx       — usa useLocalData('resultados') internamente
src/views/Content.jsx        — usa useLocalData('contenido') internamente
src/views/Audience.jsx       — usa useLocalData('publico') internamente
package.json                 — +localforage, +react-dropzone
```

### Build Validado
✅ 875 módulos, 0 errores, 6 chunks (v7 — 2026-06-24)

---

## Sesión 8 — Pauta Pagada vs Orgánico (2026-06-25)

### Problema
Los datos de MBS no separan alcance orgánico del pagado. El usuario provee datos de pauta manualmente.

### Solución implementada

**Schema `anuncios` (nuevo tipo de datos):**
- Clave de deduplicación: `Identificador_Publicacion`
- Métricas: `Alcance_Pagado`, `Visualizaciones_Pagadas`, `Seguidores_Pagados`
- Orgánico = Total (de contenido.csv) − Pagado (de anuncios)
- Sin CSV estático por defecto; solo persiste en IndexedDB

**Archivos modificados:**
- `src/utils/storageEngine.js` — nueva store `anuncios` con keyFn por `Identificador_Publicacion`
- `src/hooks/useLocalData.js` — tipo `anuncios` con URL estática `null` (solo IndexedDB)
- `src/views/DataIngestion.jsx` — 4ta zona "💰 Pauta Pagada" con validación y hint al template
- `src/views/Content.jsx` → v4:
  - `paidMap`: enriquece cada fila con `alcancePagado`, `alcanceOrganico`, `vistasPagadas`, `vistasOrganicas`, `seguidoresPagados`, `hasPauta`
  - Toggle **"Ver orgánico / pagado"**: alterna entre columnas estándar y columnas split (Org./Pag.)
  - Badge `💰` en publicaciones con pauta
  - Filtro rápido **"Con pauta"**
  - KPI dinámico: "Alcance pagado vs orgánico" con barra visual (% pagado)
  - Botón **"↓ Template pauta"**: genera CSV pre-llenado con IDs y totales de las publicaciones actuales
- `src/views/Analysis.jsx` — Módulo 4 "Pauta pagada vs orgánico":
  - 4 KPI cards: posts con pauta, alcance pagado, alcance orgánico, seguidores por pauta
  - BarChart agrupado: Alcance Orgánico vs Pagado por tipo de publicación
  - Tabla top posts con mayor alcance pagado
  - Estado vacío con instrucciones de onboarding

**Template CSV de pauta:**
- Ubicación: `public/data/template_anuncios.csv`
- Columnas: `Identificador_Publicacion, Fecha, Tipo, Descripcion_referencia, Alcance_Total, Alcance_Pagado, Visualizaciones_Total, Visualizaciones_Pagadas, Seguidores_Pagados`
- El usuario también puede generar el template desde Content → "Template pauta" (se pre-llena con los IDs y totales del periodo actual)

### Flujo de trabajo para el usuario
1. Ir a **Contenido** → clic en **"↓ Template pauta"** → se descarga un CSV con los posts actuales
2. Abrir en Excel/Google Sheets → llenar las columnas `Alcance_Pagado`, `Visualizaciones_Pagadas`, `Seguidores_Pagados` para los posts con anuncio (dejar vacío los sin pauta)
3. Guardar y subir a **Datos → 💰 Pauta Pagada**
4. El sistema actualiza automáticamente las vistas Contenido y Análisis

### Fórmulas
- `Alcance Orgánico = Alcance_Total (contenido.csv) − Alcance_Pagado (anuncios)`
- `Visualizaciones Orgánicas = Visualizaciones_Total − Visualizaciones_Pagadas`
- `ER Orgánico = (Interacciones / Alcance Orgánico) × 100`
- `% Alcance Pagado = (Alcance_Pagado / Alcance_Total) × 100`
