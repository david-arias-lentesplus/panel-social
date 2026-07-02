/**
 * useLocalData — Hook principal de datos
 *
 * Prioridad:
 *   1. IndexedDB (localforage) — datos subidos vía DataIngestion
 *   2. CSV estático en /data/{type}.csv — baseline siempre disponible en Vercel
 *
 * Se recarga automáticamente cuando otro componente hace mergeRows() y
 * dispara el evento 'livo:data-updated'.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import Papa from 'papaparse'
import { getRows, getMeta } from '../utils/storageEngine'

const STATIC_URLS = {
  resultados: '/data/resultados.csv',
  contenido:  '/data/contenido.csv',
  publico:    '/data/publico.csv',
  anuncios:   '/data/anuncios.csv',  // mantenido manualmente en public/data/
}

/**
 * @param {'resultados'|'contenido'|'publico'} type
 * @returns {{ rows, loading, source, meta, reload }}
 *   source: 'indexeddb' | 'static' | 'empty'
 */
export function useLocalData(type) {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [source,  setSource]  = useState('empty')
  const [meta,    setMeta]    = useState(null)
  const abortRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      // 1. Intentar IndexedDB
      const [stored, storedMeta] = await Promise.all([getRows(type), getMeta(type)])

      if (stored && stored.length > 0) {
        setRows(stored)
        setSource('indexeddb')
        setMeta(storedMeta)
        return
      }

      // 2. Fallback: CSV estático
      const url = STATIC_URLS[type]
      if (!url) { setRows([]); setSource('empty'); return }

      const res = await fetch(url, { signal: ctrl.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()

      const { data } = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
      })

      if (!ctrl.signal.aborted) {
        setRows(data)
        setSource('static')
        setMeta(null)
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn(`useLocalData(${type}):`, err)
        setRows([])
        setSource('empty')
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false)
    }
  }, [type])

  useEffect(() => {
    load()
    const handler = (e) => {
      if (!e.detail?.type || e.detail.type === type) load()
    }
    window.addEventListener('livo:data-updated', handler)
    return () => {
      window.removeEventListener('livo:data-updated', handler)
      abortRef.current?.abort()
    }
  }, [load, type])

  return { rows, loading, source, meta, reload: load }
}
