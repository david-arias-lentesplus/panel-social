/**
 * accountFilter.js
 * ─────────────────────────────────────────────────────────────────
 * Filtro global de cuenta: permite mostrar TODAS las publicaciones
 * (incluye collabs / cuentas externas que aparecen en "Nombre de
 * usuario de la cuenta") o SOLO las publicadas por la cuenta propia.
 *
 * La cuenta propia se detecta automáticamente como la más frecuente
 * en el dataset (moda), para no depender de un valor hardcodeado.
 */

/**
 * Detecta el usuario de la cuenta propia a partir de un array de filas
 * ya normalizadas (con propiedad `usuario`). Retorna el username más
 * frecuente, o '' si no hay datos suficientes.
 */
export function detectOwnAccount(rows) {
  const counts = {}
  for (const r of rows) {
    const u = r.usuario
    if (!u) continue
    counts[u] = (counts[u] ?? 0) + 1
  }
  let best = '', bestCount = 0
  for (const [u, c] of Object.entries(counts)) {
    if (c > bestCount) { best = u; bestCount = c }
  }
  return best
}

/**
 * Filtra un array de filas normalizadas según el modo elegido.
 * @param {Object[]} rows       filas con propiedad `usuario`
 * @param {'todas'|'propia'} mode
 * @param {string} ownAccount   username de la cuenta propia (detectado o fijo)
 */
export function filterByAccount(rows, mode, ownAccount) {
  if (mode !== 'propia') return rows
  // Filas sin usuario (datos antiguos / incompletos) se tratan como propias
  // para no perder histórico por falta de esa columna.
  return rows.filter(r => !r.usuario || r.usuario === ownAccount)
}
