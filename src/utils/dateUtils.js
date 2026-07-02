/**
 * dateUtils.js — helpers de fecha y formato numérico
 */

// ── Formato de números ────────────────────────────────────────────

/**
 * Formatea un número con separadores de miles en español colombiano.
 * Acepta strings con comas ("35,038") y null/undefined.
 */
export function formatNumber(val, decimals = 0) {
  if (val === null || val === undefined || val === '') return '—'
  const n = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : Number(val)
  if (isNaN(n)) return '—'
  return n.toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Calcula el Engagement Rate: (Interacciones / Alcance) × 100
 * Retorna 0 si el alcance es 0 (evita NaN / Infinity)
 */
export function calcER(interacciones, alcance) {
  if (!alcance || alcance === 0) return 0
  return (interacciones / alcance) * 100
}


export function formatPct(val) {
  const n = typeof val === 'string' ? parseFloat(val) : Number(val)
  if (isNaN(n)) return '—'
  return `${n.toFixed(1)}%`
}

// ── Helpers de fecha ─────────────────────────────────────────────

export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}
export function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}
export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}
export function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return startOfDay(d)
}
export function endOfWeek(date) {
  return endOfDay(addDays(startOfWeek(date), 6))
}
export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}
export function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1)
}

export function isSameDay(a, b) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

export function parseDate(val) {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

export function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(date) {
  return date.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
}

export function monthsBetween(start, end) {
  const months = []
  const d = new Date(start.getFullYear(), start.getMonth(), 1)
  const endY = end.getFullYear()
  const endM = end.getMonth()
  while (d.getFullYear() < endY || (d.getFullYear() === endY && d.getMonth() <= endM)) {
    months.push(new Date(d))
    d.setMonth(d.getMonth() + 1)
  }
  return months
}

export function formatDateShort(date) {
  if (!date) return ''
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

export function formatDateFull(date) {
  if (!date) return ''
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Presets ──────────────────────────────────────────────────────

export const PRESETS = [
  {
    id: 'yesterday',
    label: 'Ayer',
    getDates: (t) => { const d = addDays(t, -1); return [startOfDay(d), endOfDay(d)] },
  },
  {
    id: 'last7',
    label: 'Últimos 7 días',
    getDates: (t) => [startOfDay(addDays(t, -6)), endOfDay(t)],
  },
  {
    id: 'last28',
    label: 'Últimos 28 días',
    getDates: (t) => [startOfDay(addDays(t, -27)), endOfDay(t)],
  },
  {
    id: 'last90',
    label: 'Últimos 90 días',
    getDates: (t) => [startOfDay(addDays(t, -89)), endOfDay(t)],
  },
  {
    id: 'thisWeek',
    label: 'Esta semana',
    getDates: (t) => [startOfWeek(t), endOfWeek(t)],
  },
  {
    id: 'thisMonth',
    label: 'Este mes',
    getDates: (t) => [startOfMonth(t), endOfMonth(t)],
  },
  {
    id: 'thisYear',
    label: 'Este año',
    getDates: (t) => [startOfYear(t), endOfDay(t)],
  },
  {
    id: 'lastWeek',
    label: 'La semana pasada',
    getDates: (t) => { const w = addDays(startOfWeek(t), -7); return [w, endOfDay(addDays(w, 6))] },
  },
  {
    id: 'lastMonth',
    label: 'El mes pasado',
    getDates: (t) => { const m = new Date(t.getFullYear(), t.getMonth() - 1, 1); return [m, endOfMonth(m)] },
  },
  {
    id: 'custom',
    label: 'Personalizado',
    getDates: () => [null, null],
  },
]

// ── Helpers de calendario ─────────────────────────────────────────

export const DAYS_ES  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const MONTHS_ES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
]
export const MONTHS_SHORT = [
  'Ene','Feb','Mar','Abr','May','Jun',
  'Jul','Ago','Sep','Oct','Nov','Dic',
]

/** Returns a 42-cell grid (6 rows × 7 cols) for the given month */
export function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0).getDate()

  // Monday-first: Sunday (0) → position 6
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const cells = []
  // Previous month fill
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month, -i), current: false })
  }
  // Current month
  for (let d = 1; d <= lastDate; d++) {
    cells.push({ date: new Date(year, month, d), current: true })
  }
  // Next month fill
  while (cells.length < 42) {
    const d = cells.length - startOffset - lastDate + 1
    cells.push({ date: new Date(year, month + 1, d), current: false })
  }
  return cells
}
