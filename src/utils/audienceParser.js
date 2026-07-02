/**
 * audienceParser.js
 * ─────────────────────────────────────────────────────────────────
 * El sheet de Público de Meta tiene 3 tablas LADO A LADO en el
 * mismo CSV (separadas por columnas vacías):
 *
 *   Cols A–C : Rango de edad | Mujeres (%) | Hombres (%)
 *   Col  D   : vacía
 *   Cols E–F : Ciudad        | Porcentaje (%)
 *   Col  G   : vacía
 *   Cols H–I : País          | Porcentaje (%)
 *
 * PapaParse lo lee como UNA tabla de 9 columnas con headers en fila 1.
 * Esta función reconstruye las 3 tablas desde ese resultado.
 */

function num(val) {
  if (val === null || val === undefined || val === '') return 0
  return parseFloat(String(val).replace(',', '.')) || 0
}

/**
 * @param {Object[]} rows  — output de PapaParse con header:true
 * @returns {{ ages: [], cities: [], countries: [] }}
 */
export function parseAudienceSheet(rows) {
  const ages      = []
  const cities    = []
  const countries = []

  // Los headers reales después de PapaParse (con posibles sufijos _1, _2
  // si hay columnas duplicadas como "Porcentaje (%)"):
  // Detectamos por nombre parcial de columna.

  if (!rows.length) return { ages, cities, countries }

  const headers = Object.keys(rows[0])

  // Encontrar los índices de cada sub-tabla por nombre de header
  const idxEdad     = headers.findIndex(h => h.toLowerCase().includes('rango') || h.toLowerCase().includes('edad'))
  const idxMujeres  = headers.findIndex(h => h.toLowerCase().includes('mujeres'))
  const idxHombres  = headers.findIndex(h => h.toLowerCase().includes('hombres'))
  const idxCiudad   = headers.findIndex(h => h.toLowerCase().includes('ciudad'))
  // Porcentaje aparece dos veces → primer match = ciudades, segundo = países
  const pctIndexes  = headers.reduce((acc, h, i) => {
    if (h.toLowerCase().includes('porcentaje')) acc.push(i)
    return acc
  }, [])
  const idxPctCiudad  = pctIndexes[0] ?? -1
  const idxPais       = headers.findIndex(h => h.toLowerCase().includes('pa') && !h.toLowerCase().includes('porcentaje'))
  const idxPctPais    = pctIndexes[1] ?? -1

  const SKIP_LABELS = ['subtotal', 'total', '']

  for (const row of rows) {
    const vals = Object.values(row)

    // ── EDAD ──────────────────────────────────────────────────────
    if (idxEdad !== -1) {
      const label = String(vals[idxEdad] ?? '').trim()
      if (label && !SKIP_LABELS.includes(label.toLowerCase())) {
        ages.push({
          label,
          Mujeres: num(vals[idxMujeres]),
          Hombres: num(vals[idxHombres]),
          Total:   num(vals[idxMujeres]) + num(vals[idxHombres]),
        })
      }
    }

    // ── CIUDADES ──────────────────────────────────────────────────
    if (idxCiudad !== -1) {
      const ciudad = String(vals[idxCiudad] ?? '').trim()
      if (ciudad && !SKIP_LABELS.includes(ciudad.toLowerCase())) {
        cities.push({
          name:  ciudad,
          value: num(vals[idxPctCiudad]),
        })
      }
    }

    // ── PAÍSES ────────────────────────────────────────────────────
    if (idxPais !== -1) {
      const pais = String(vals[idxPais] ?? '').trim()
      if (pais && !SKIP_LABELS.includes(pais.toLowerCase())) {
        countries.push({
          name:  pais,
          value: num(vals[idxPctPais]),
        })
      }
    }
  }

  return { ages, cities, countries }
}

/** Limpia número con coma de miles (ej: "35,038" → 35038) */
export function parseMetaNumber(val) {
  if (val === null || val === undefined || val === '') return 0
  return parseFloat(String(val).replace(/,/g, '')) || 0
}
