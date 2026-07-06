/**
 * useAccountFilter — estado global del filtro de cuenta (sistema completo)
 * 'todas'  → incluye collabs y publicaciones de cuentas externas
 * 'propia' → solo publicaciones de la cuenta propia (detectada automáticamente)
 */
import { useState } from 'react'

const DEFAULT_MODE = 'todas'

export function useAccountFilter() {
  const [accountFilter, setAccountFilter] = useState(DEFAULT_MODE)

  function toggleAccountFilter() {
    setAccountFilter(m => (m === 'todas' ? 'propia' : 'todas'))
  }

  return { accountFilter, setAccountFilter, toggleAccountFilter }
}
