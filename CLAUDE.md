# CLAUDE.md — Panel Social · LIVO Analytics
> Archivo de instrucciones para agentes Claude (Cowork / Claude Code).
> Este archivo se carga automáticamente al inicio de cada sesión.

---

## 🎯 Propósito del Proyecto

Dashboard analítico de Instagram para **LIVO / LentesPlus B2B**.
Consume datos de Google Sheets publicados como CSV (sin API de Meta).
Desplegado en Vercel. Código en GitHub.

---

## 🛠️ Tech Stack

| Capa | Tecnología |
|------|-----------|
| Framework | React 18 + Vite 5 |
| Estilos | Tailwind CSS v3 (tokens LIVO) |
| Routing | React Router v6 |
| Gráficas | Recharts v2 |
| CSV Parsing | PapaParse v5 |
| Deploy | Vercel (SPA con rewrite `/*` → `/index.html`) |

---

## 📁 Estructura de Carpetas

```
panel-social/
├── src/
│   ├── components/
│   │   ├── ui/           # Button, Badge, Card, Input, Spinner
│   │   ├── charts/       # LineChartComponent, BarChartComponent, PieChartComponent
│   │   ├── layout/       # Sidebar, Header
│   │   └── DataManager/  # DataSourceManager (modal de fuentes CSV)
│   ├── hooks/
│   │   ├── useDataSources.js  # CRUD + localStorage de fuentes
│   │   └── useSheetData.js    # Fetch + dedup + estado de carga
│   ├── utils/
│   │   └── csvParser.js       # fetchAllSources, previewUrl, normalizeSheetUrl
│   ├── views/
│   │   ├── Overview.jsx   # Visión General (seguidores, alcance, impresiones)
│   │   ├── Content.jsx    # Top 10 publicaciones
│   │   └── Audience.jsx   # Ciudades, género, edad
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── tailwind.config.js     # Tokens LIVO extendidos
├── vite.config.js
├── vercel.json            # SPA rewrite
├── package.json
├── CLAUDE.md              ← este archivo
└── HANDOFF.md             ← registro de proyecto
```

---

## 🎨 Design System

**SIEMPRE** seguir `DESIGN_SYSTEM-LIVO.md` (en la raíz del folder del proyecto).
Reglas clave:
- Colores: Electric Blue `#0000E1`, Lime `#DEFF00`, Black, White + escala de tono en `livo.*`
- Tipografías: Poppins (body/UI) · Ballinger (headings) · T29 Carbon (números)
- Botones: `rounded-full`, variantes `primary | secondary | outline | darker | ghost`
- Inputs: `rounded-lg` (8px), focus ring azul `rgba(0,0,225,0.2)`
- Nunca usar Lime sobre fondo blanco (contraste insuficiente)
- Texto sobre lime: siempre `text-black`, nunca `text-white`

---

## 🗃️ Fuentes de Datos (CSV)

Cada fuente tiene:
```js
{
  id:      string,   // generado automáticamente
  label:   string,   // nombre amigable
  url:     string,   // URL pública de Google Sheets en formato CSV
  type:    'overview' | 'content' | 'audience',
  enabled: boolean,
  addedAt: ISO string
}
```

Persistencia: `localStorage` clave `livo_panel_social_sources`.
Deduplicación: por fingerprint de los valores de cada fila (JSON.stringify).

### Cómo publicar un Google Sheet como CSV
1. Archivo → Compartir → Publicar en la web
2. Seleccionar la hoja específica
3. Formato: CSV
4. Copiar el enlace

---

## 🧩 Skills de Agente Disponibles

| Skill | Cuándo usar |
|-------|-------------|
| `xlsx` | Analizar o generar archivos Excel de datos exportados |
| `pdf` | Generar reportes PDF del dashboard |
| `pptx` | Crear presentaciones de resultados con datos del panel |
| `handoff-documenter` | Actualizar HANDOFF.md con cambios, errores y pasos |
| `frontend-developer` | Cambios de UI, nuevos componentes, bugs de React/Tailwind |

---

## ⚙️ Comandos de Desarrollo

```bash
cd panel-social
npm install       # instalar dependencias
npm run dev       # servidor local (http://localhost:5173)
npm run build     # compilar para producción (carpeta dist/)
npm run preview   # preview del build
```

---

## 🚀 Deploy en Vercel

1. Subir `panel-social/` a GitHub
2. Importar repositorio en Vercel
3. Framework preset: **Vite**
4. Root directory: `panel-social` (si está en subcarpeta) o raíz
5. Build command: `npm run build`
6. Output directory: `dist`
7. `vercel.json` ya tiene el rewrite SPA configurado

---

## 🚫 Restricciones para Agentes

- No inventar colores que no estén en el Design System
- No usar `localStorage` directamente en componentes — usar `useDataSources`
- No hardcodear URLs de Google Sheets en el código
- No instalar librerías de charts distintas a Recharts
- No crear archivos `.env` con credenciales — el sistema es 100% público por diseño
- Al crear nuevos componentes, revisar si ya existe uno en `src/components/ui/`

---

## 📋 Agente Documentador (handoff-documenter)

Invocar cuando:
- Se complete una sesión de trabajo significativa
- Se resuelva un bug importante
- Se agregue una nueva feature
- Se cambie la arquitectura del proyecto

Comando: usar el skill `handoff-documenter` o editar directamente `HANDOFF.md`.

