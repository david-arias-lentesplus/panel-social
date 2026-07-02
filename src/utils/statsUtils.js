/**
 * statsUtils.js — Funciones estadísticas puras para el módulo de análisis
 * No tienen efectos secundarios, solo reciben arrays y retornan resultados.
 */

import { calcER } from './dateUtils'
import { parseMetaNumber } from './audienceParser'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Percentil p de un array numérico (interpolación lineal).
 * p = 90 → P90. p = 50 → mediana.
 *
 * Fórmula (método nearest rank con interpolación):
 *   idx = (p / 100) × (n − 1)
 *   result = sorted[⌊idx⌋] + frac(idx) × (sorted[⌈idx⌉] − sorted[⌊idx⌋])
 */
export function percentile(arr, p) {
  if (!arr.length) return 0
  const sorted = [...arr].filter(v => isFinite(v) && !isNaN(v)).sort((a, b) => a - b)
  if (!sorted.length) return 0
  if (sorted.length === 1) return sorted[0]
  const idx   = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (idx - lower) * (sorted[upper] - sorted[lower])
}

/**
 * Análisis de Pareto: calcula qué porcentaje de posts genera el X% del total de interacciones.
 * Retorna cuántos posts (y qué % del total) generaron el 80% de las interacciones.
 *
 * Fórmula:
 *   1. Ordenar posts por interacciones DESC
 *   2. Acumular interacciones hasta alcanzar ≥ 0.8 × total
 *   3. Contar cuántos posts se necesitaron
 */
export function paretoAnalysis(rows, valueKey = 'interacciones') {
  const withValues = rows.filter(r => (r[valueKey] ?? 0) > 0)
  if (!withValues.length) return null

  const sorted = [...withValues].sort((a, b) => (b[valueKey] ?? 0) - (a[valueKey] ?? 0))
  const total  = sorted.reduce((s, r) => s + (r[valueKey] ?? 0), 0)
  if (!total)  return null

  let cumulative = 0
  let count = 0
  for (const row of sorted) {
    cumulative += row[valueKey] ?? 0
    count++
    if (cumulative / total >= 0.8) break
  }

  return {
    count,
    total: rows.length,
    pctPosts:  +((count / rows.length) * 100).toFixed(1),
    pctValue:  +((cumulative / total)  * 100).toFixed(1),
    valueTotal: total,
    topRows: sorted.slice(0, count),
  }
}

/**
 * Detecta outliers: publicaciones cuyo Alcance O Interacciones superan el P90.
 * Devuelve un array de filas clasificadas como 'Viral' (ambos) o 'Alto Rendimiento' (uno).
 */
export function detectOutliers(rows, p = 90) {
  if (!rows.length) return []
  const alcances      = rows.map(r => r.alcance ?? 0)
  const interacciones = rows.map(r => r.interacciones ?? 0)
  const p90Alcance = percentile(alcances, p)
  const p90Inter   = percentile(interacciones, p)

  return rows
    .filter(r => r.alcance > p90Alcance || r.interacciones > p90Inter)
    .map(r => ({
      ...r,
      tag: (r.alcance > p90Alcance && r.interacciones > p90Inter) ? 'Viral' : 'Alto Rendimiento',
      p90Alcance,
      p90Inter,
    }))
    .sort((a, b) => b.alcance - a.alcance)
}

/**
 * Rendimiento por formato de publicación.
 * Agrupa por tipo, calcula promedios de Alcance e Interacciones.
 */
export function formatPerformance(rows) {
  const groups = {}
  for (const r of rows) {
    const tipo = r.tipo ?? 'Desconocido'
    if (!groups[tipo]) groups[tipo] = { count: 0, alcance: 0, interacciones: 0, er: 0 }
    groups[tipo].count++
    groups[tipo].alcance       += r.alcance ?? 0
    groups[tipo].interacciones += r.interacciones ?? 0
    groups[tipo].er            += calcER(r.interacciones ?? 0, r.alcance ?? 0)
  }
  return Object.entries(groups).map(([tipo, g]) => ({
    tipo,
    count:          g.count,
    alcancePromedio: Math.round(g.alcance / g.count),
    interaccionesPromedio: Math.round(g.interacciones / g.count),
    erPromedio: +(g.er / g.count).toFixed(2),
  })).sort((a, b) => b.alcancePromedio - a.alcancePromedio)
}

/**
 * Mapa de calor: Día de semana × Hora → ER promedio.
 *
 * Fórmula por celda:
 *   avgER(día, hora) = Σ ER_i / N  donde i son los posts publicados ese día+hora
 *
 * Retorna matriz [7][24] con { count, avgER }
 */
export function buildHeatmapGrid(rows) {
  // grid[dayIdx][hourIdx] = { count, totalER, avgER }
  const grid = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({ count: 0, totalER: 0, avgER: 0 }))
  )

  for (const r of rows) {
    const d = parseHora(r.horaRaw ?? r.hora ?? '')
    if (!d) continue
    let dayIdx = d.getDay() - 1   // getDay(): 0=Dom,1=Lun,...,6=Sab
    if (dayIdx < 0) dayIdx = 6    // Domingo → índice 6
    const hourIdx = d.getHours()
    const er = calcER(r.interacciones ?? 0, r.alcance ?? 0)
    grid[dayIdx][hourIdx].count++
    grid[dayIdx][hourIdx].totalER += er
  }

  for (const day of grid) {
    for (const cell of day) {
      cell.avgER = cell.count > 0 ? +(cell.totalER / cell.count).toFixed(2) : 0
    }
  }

  return grid
}

/**
 * Parsea string de hora de publicación de MBS.
 * Soporta:
 *   - "11/26/2025 09:13"   (M/D/YYYY H:MM — Historias)
 *   - ISO 8601 strings
 *   - timestamps numéricos
 */
export function parseHora(str) {
  if (!str) return null
  const s = String(str).trim()
  if (!s) return null

  // ISO / timestamp directo
  const d1 = new Date(s)
  if (!isNaN(d1)) return d1

  // M/D/YYYY H:MM o MM/DD/YYYY HH:MM
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/)
  if (m) {
    const [, month, day, year, hour, min] = m
    const d2 = new Date(+year, +month - 1, +day, +hour, +min)
    if (!isNaN(d2)) return d2
  }

  return null
}

/**
 * Normaliza una fila cruda de CSV de contenido para los módulos de análisis.
 * (Independiente del normalizeRow de Content.jsx para no crear acoplamiento.)
 */
export function analyzeContentRow(row) {
  const g = (term) => {
    const key = Object.keys(row).find(k => k.toLowerCase().includes(term))
    return key ? row[key] : ''
  }

  const tipoRaw = String(g('tipo') || '').toLowerCase()
  const TIPO_MAP = {
    'reel':     'Reel',
    'secuencia':'Carrusel',
    'historia': 'Historia',
    'foto':     'Post',
    'video':    'Video',
  }
  const tipo = Object.entries(TIPO_MAP).find(([k]) => tipoRaw.includes(k))?.[1] ?? 'Post'

  const me_gusta     = parseMetaNumber(g('me gusta'))
  const comentarios  = parseMetaNumber(g('comentario'))
  const compartidos  = parseMetaNumber(g('compartió') || g('compartidos'))
  const guardados    = parseMetaNumber(g('guardó') || g('guardados'))
  const seguimientos = parseMetaNumber(g('seguimiento'))
  const alcance      = parseMetaNumber(g('alcance'))
  const interacciones = me_gusta + comentarios + compartidos + guardados + seguimientos
  const id           = g('identificador de la publicación') || g('identificador') || ''
  const horaRaw      = g('hora de publicación') || g('hora') || g('fecha')
  const descripcion  = g('descripción') || g('descripcion') || '—'

  const fechaObj = parseHora(horaRaw)

  return {
    id, tipo, horaRaw, fechaObj,
    descripcion: String(descripcion).slice(0, 120),
    alcance, interacciones,
    er: calcER(interacciones, alcance),
  }
}
