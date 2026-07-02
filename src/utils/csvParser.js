/**
 * csvParser.js — v2
 * BUGFIX: toda la lógica de parse y fetch queda dentro de try/catch
 * para evitar que un error de PapaParse o de red rompa la app.
 */

import Papa from 'papaparse'

export function normalizeSheetUrl(rawUrl) {
  try {
    const url = new URL(rawUrl.trim())
    if (url.pathname.includes('/pub') && !url.searchParams.get('output')) {
      url.searchParams.set('output', 'csv')
    }
    if (url.pathname.includes('/edit')) {
      url.pathname = url.pathname.replace('/edit', '/pub')
      url.searchParams.set('output', 'csv')
    }
    return url.toString()
  } catch {
    return rawUrl.trim()
  }
}

async function fetchAndParse(url, signal) {
  const normalizedUrl = normalizeSheetUrl(url)
  let text

  try {
    const res = await fetch(normalizedUrl, { signal })
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`)
    text = await res.text()
  } catch (err) {
    if (err.name === 'AbortError') throw err
    return { data: [], meta: {}, errors: [{ message: err.message }], source: url, ok: false }
  }

  // Verificar que la respuesta es realmente un CSV y no HTML de error
  const trimmed = text.trim()
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    return {
      data: [], meta: {}, source: url, ok: false,
      errors: [{ message: 'El enlace devolvió HTML en lugar de CSV. Verifica que la hoja esté publicada como CSV.' }],
    }
  }

  return new Promise((resolve) => {
    try {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h?.trim() ?? h,
        transform: (val) => (typeof val === 'string' ? val.trim() : val),
        complete: (results) => {
          resolve({
            data:   results.data   ?? [],
            meta:   results.meta   ?? {},
            errors: results.errors ?? [],
            source: url,
            ok:     (results.errors ?? []).length === 0 && (results.data ?? []).length > 0,
          })
        },
        error: (err) => {
          resolve({
            data: [], meta: {}, source: url, ok: false,
            errors: [{ message: err?.message ?? 'Error de parseo CSV' }],
          })
        },
      })
    } catch (err) {
      resolve({
        data: [], meta: {}, source: url, ok: false,
        errors: [{ message: err?.message ?? 'Error inesperado en PapaParse' }],
      })
    }
  })
}

export async function fetchAllSources(sources, signal) {
  const activeSources = sources.filter((s) => s.enabled && s.url?.trim())
  if (activeSources.length === 0) return { rows: [], results: [] }

  const settled = await Promise.allSettled(
    activeSources.map((s) => fetchAndParse(s.url, signal))
  )

  const results = []
  const seenKeys = new Set()
  const merged = []

  settled.forEach((outcome, i) => {
    const source = activeSources[i]
    if (outcome.status === 'rejected') {
      results.push({ ...source, ok: false, error: outcome.reason?.message })
      return
    }
    const parsed = outcome.value
    results.push({
      ...source,
      ok:       parsed.ok,
      rowCount: parsed.data.length,
      errors:   parsed.errors,
    })

    for (const row of parsed.data) {
      try {
        const key = JSON.stringify(Object.values(row))
        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          merged.push({ ...row, _source: source.label || source.url })
        }
      } catch {
        // fila corrupta — saltar sin romper el loop
      }
    }
  })

  return { rows: merged, results }
}

export async function previewUrl(url, rowLimit = 5) {
  try {
    const result = await fetchAndParse(url)
    return {
      ...result,
      preview: (result.data ?? []).slice(0, rowLimit),
      columns: result.meta?.fields ?? [],
    }
  } catch (err) {
    return {
      data: [], meta: {}, ok: false, preview: [], columns: [],
      errors: [{ message: err?.message ?? 'Error al previsualizar' }],
    }
  }
}
