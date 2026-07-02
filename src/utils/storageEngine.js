/**
 * storageEngine.js — Motor de persistencia local con IndexedDB (via localforage)
 *
 * Estrategia de datos (Vercel free tier, sin backend):
 *   - IndexedDB almacena todos los datos parseados como JSON arrays
 *   - Cada tipo tiene su propia store instance
 *   - Merge inteligente: no reemplaza, ACUMULA y deduplica
 *     · resultados → clave: Fecha
 *     · contenido  → clave: Identificador de la publicación
 *     · publico    → replace (snapshot, no serie temporal)
 *
 * Flujo de actualización:
 *   1. Usuario descarga nuevos CSV de MBS
 *   2. Los arrastra a la vista "Datos" (/ingestion)
 *   3. Se parsean en cliente → merge → guardados en IndexedDB
 *   4. Se dispara evento 'livo:data-updated' → vistas recargan reactivamente
 *   5. En next session, los datos ya están en IndexedDB sin re-subir
 */

import localforage from 'localforage'

// ── Instancias separadas por tipo ──────────────────────────────────────────

const stores = {
  resultados: localforage.createInstance({
    name: 'panel-social-livo',
    storeName: 'resultados',
    description: 'Resultados diarios de rendimiento',
  }),
  contenido: localforage.createInstance({
    name: 'panel-social-livo',
    storeName: 'contenido',
    description: 'Publicaciones de contenido (Posts, Reels, Historias)',
  }),
  publico: localforage.createInstance({
    name: 'panel-social-livo',
    storeName: 'publico',
    description: 'Datos de público (snapshot más reciente)',
  }),
  anuncios: localforage.createInstance({
    name: 'panel-social-livo',
    storeName: 'anuncios',
    description: 'Métricas de pauta pagada por publicación',
  }),
}

const ROWS_KEY    = 'rows'
const META_KEY    = 'meta'

// ── API Pública ──────────────────────────────────────────────────────────────

/**
 * Retorna las filas almacenadas para un tipo.
 * @returns {Promise<Array>} — array de objetos (puede ser vacío)
 */
export async function getRows(type) {
  try {
    return (await stores[type]?.getItem(ROWS_KEY)) ?? []
  } catch {
    return []
  }
}

/**
 * Retorna metadatos del último ingreso (timestamp, count, dateRange).
 */
export async function getMeta(type) {
  try {
    return (await stores[type]?.getItem(META_KEY)) ?? null
  } catch {
    return null
  }
}

/**
 * Merge de nuevas filas con las existentes (deduplicación por clave).
 * Para publico: reemplaza completamente.
 *
 * @param {string} type - 'resultados' | 'contenido' | 'publico'
 * @param {Array}  newRows - filas parseadas del nuevo CSV
 * @returns {Promise<{added: number, total: number}>}
 */
export async function mergeRows(type, newRows) {
  if (!stores[type]) throw new Error(`Tipo desconocido: ${type}`)

  let merged
  let added = newRows.length

  if (type === 'publico') {
    // Snapshot: reemplazar siempre
    merged = newRows
  } else {
    const existing = await getRows(type)
    const keyFn = type === 'resultados'
      ? (r) => (r['Fecha'] ?? r['fecha'] ?? '').slice(0, 10)
      : type === 'anuncios'
      ? (r) => r['Identificador_Publicacion'] ?? r['Identificador de la publicación'] ?? ''
      : (r) => r['Identificador de la publicación'] ?? r['id'] ?? JSON.stringify(r).slice(0, 60)

    const map = new Map(existing.map(r => [keyFn(r), r]))
    const before = map.size

    for (const r of newRows) {
      const k = keyFn(r)
      if (k) map.set(k, r)
    }

    merged = [...map.values()]
    added = map.size - before
  }

  const meta = {
    lastUpdated: new Date().toISOString(),
    total: merged.length,
    added,
    dateRange: type === 'resultados' ? getDateRange(merged) : null,
  }

  await stores[type].setItem(ROWS_KEY, merged)
  await stores[type].setItem(META_KEY, meta)

  // Notificar a los hooks que escuchan
  window.dispatchEvent(new CustomEvent('livo:data-updated', { detail: { type } }))

  return { added, total: merged.length }
}

/**
 * Elimina todos los datos de un tipo (fuerza fallback a CSV estático).
 */
export async function clearRows(type) {
  if (!stores[type]) return
  await stores[type].removeItem(ROWS_KEY)
  await stores[type].removeItem(META_KEY)
  window.dispatchEvent(new CustomEvent('livo:data-updated', { detail: { type } }))
}

/** Limpia TODOS los tipos a la vez. */
export async function clearAllRows() {
  await Promise.all(Object.keys(stores).map(clearRows))
}

// ── Helpers internos ────────────────────────────────────────────────────────

function getDateRange(rows) {
  const dates = rows
    .map(r => (r['Fecha'] ?? r['fecha'] ?? '').slice(0, 10))
    .filter(Boolean)
    .sort()
  return dates.length ? { from: dates[0], to: dates[dates.length - 1] } : null
}
