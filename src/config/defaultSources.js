/**
 * defaultSources.js
 * ─────────────────────────────────────────────────────────────────
 * Fuentes de datos predeterminadas del Panel Social LIVO.
 *
 * Los archivos CSV consolidados viven en public/data/ y se sirven
 * estáticamente tanto en Vite dev (/data/*.csv) como en Vercel.
 *
 * Para actualizar los datos:
 *   1. Colocar los nuevos exports MBS en csv-exports/insta-lentesplus.latam/
 *   2. Ejecutar: python3 scripts/consolidate.py
 *   3. Hacer commit de los nuevos archivos en public/data/ y desplegar.
 */

export const DEFAULT_SOURCES = [
  {
    id:       'default-resultados',
    label:    'Resultados diarios (MBS)',
    url:      '/data/resultados.csv',
    type:     'resultados',
    enabled:  true,
    isDefault: true,
    addedAt:  '2026-06-24T00:00:00.000Z',
  },
  {
    id:       'default-contenido',
    label:    'Rendimiento de contenido (MBS)',
    url:      '/data/contenido.csv',
    type:     'contenido',
    enabled:  true,
    isDefault: true,
    addedAt:  '2026-06-24T00:00:00.000Z',
  },
  {
    id:       'default-publico',
    label:    'Datos de público (MBS)',
    url:      '/data/publico.csv',
    type:     'publico',
    enabled:  true,
    isDefault: true,
    addedAt:  '2026-06-24T00:00:00.000Z',
  },
  {
    id:       'default-anuncios',
    label:    'Pauta pagada (manual)',
    url:      '/data/anuncios.csv',
    type:     'anuncios',
    enabled:  true,
    isDefault: true,
    addedAt:  '2026-06-25T00:00:00.000Z',
  },
]
