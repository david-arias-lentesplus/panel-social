/**
 * useDataSources.js — v4
 *
 * Arquitectura simplificada: TODAS las fuentes son iguales y eliminables.
 * No existe el concepto de "permanente". Las URLs por defecto se pre-cargan
 * en la primera visita si localStorage está vacío, pero el usuario puede
 * eliminarlas o modificarlas libremente.
 *
 * Esto permite manejar compendios de múltiples fuentes por período:
 *   ej: resultados-Q1.csv + resultados-Q2.csv → se fusionan en la vista
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { DEFAULT_SOURCES } from '../config/defaultSources'

const STORAGE_KEY = 'livo_panel_social_sources_v5'

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function loadSources() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (Array.isArray(stored) && stored.length > 0) return stored
  } catch { /* ignore */ }
  // Primera visita: cargar defaults (sin la flag isDefault para que sean iguales a cualquier otra)
  return DEFAULT_SOURCES.map(s => ({ ...s, isDefault: false }))
}

function saveSources(sources) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources))
  } catch { /* quota */ }
}

export function useDataSources() {
  const [sources, setSources] = useState(loadSources)

  useEffect(() => {
    saveSources(sources)
  }, [sources])

  // ── Mutators ─────────────────────────────────────────────────────

  const addSource = useCallback((data) => {
    const s = {
      id:       uid(),
      label:    data.label || 'Sin nombre',
      url:      data.url?.trim() || '',
      type:     data.type || 'resultados',
      enabled:  true,
      addedAt:  new Date().toISOString(),
    }
    setSources(prev => [...prev, s])
    return s
  }, [])

  const updateSource = useCallback((id, patch) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }, [])

  const removeSource = useCallback((id) => {
    setSources(prev => prev.filter(s => s.id !== id))
  }, [])

  const toggleSource = useCallback((id) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }, [])

  // ── Memoized by type (stable refs for useSheetData) ──────────────

  const resultados = useMemo(() => sources.filter(s => s.type === 'resultados' && s.enabled), [sources])
  const contenido  = useMemo(() => sources.filter(s => s.type === 'contenido'  && s.enabled), [sources])
  const publico    = useMemo(() => sources.filter(s => s.type === 'publico'    && s.enabled), [sources])
  const byType     = useMemo(() => ({ resultados, contenido, publico }), [resultados, contenido, publico])
  const getByType  = useCallback((type) => byType[type] ?? [], [byType])

  return { sources, addSource, updateSource, removeSource, toggleSource, getByType }
}
