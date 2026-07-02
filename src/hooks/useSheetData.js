/**
 * useSheetData.js
 * ─────────────────────────────────────────────────────────────────
 * BUGFIX v2:
 *   - Usa JSON.stringify(sources) como clave de efecto para evitar
 *     el loop infinito causado por referencias de array inestables.
 *   - getByType() devuelve un array nuevo en cada render; sin esto
 *     el useEffect se dispararía infinitamente congelandola app.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllSources } from '../utils/csvParser'

export function useSheetData(sources) {
  const [rows, setRows]       = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const abortRef              = useRef(null)
  const sourcesRef            = useRef(sources)

  // Serializar sources para detectar cambios reales de contenido,
  // no de referencia. Esto rompe el loop infinito.
  const sourcesKey = JSON.stringify(
    sources.map((s) => ({ id: s.id, url: s.url, enabled: s.enabled, type: s.type }))
  )

  const fetchData = useCallback(async (srcs) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const { rows: merged, results: res } = await fetchAllSources(srcs, controller.signal)
      if (!controller.signal.aborted) {
        setRows(merged)
        setResults(res)
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message ?? 'Error desconocido al cargar datos')
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // sin dependencias — recibe srcs como argumento

  useEffect(() => {
    sourcesRef.current = sources
    if (sources.length > 0) {
      fetchData(sources)
    } else {
      setRows([])
      setResults([])
      setLoading(false)
      setError(null)
    }
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  // sourcesKey es la clave real de cambio, no sources (ref inestable)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcesKey, fetchData])

  const refetch = useCallback(() => fetchData(sourcesRef.current), [fetchData])

  return { rows, results, loading, error, refetch }
}
