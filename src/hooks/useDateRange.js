import { useState, useMemo } from 'react'
import { PRESETS, addDays, startOfDay, endOfDay } from '../utils/dateUtils'

const DEFAULT_PRESET = 'last90'

function computePreset(presetId) {
  const today = new Date()
  const preset = PRESETS.find(p => p.id === presetId) ?? PRESETS[3]
  const [start, end] = preset.getDates(today)
  return { preset: presetId, start, end }
}

export function useDateRange() {
  const [state, setState] = useState(() => ({
    ...computePreset(DEFAULT_PRESET),
    compare: false,
  }))

  const monthSpan = useMemo(() => {
    if (!state.start || !state.end) return 1
    return (
      (state.end.getFullYear() - state.start.getFullYear()) * 12 +
      state.end.getMonth() - state.start.getMonth() + 1
    )
  }, [state.start, state.end])

  function setPreset(presetId) {
    const preset = PRESETS.find(p => p.id === presetId)
    if (!preset || preset.id === 'custom') return
    const [s, e] = preset.getDates(new Date())
    setState(prev => ({ ...prev, preset: presetId, start: s, end: e }))
  }

  function setCustomRange(start, end) {
    setState(prev => ({ ...prev, preset: 'custom', start, end }))
  }

  function toggleCompare() {
    setState(prev => ({ ...prev, compare: !prev.compare }))
  }

  /**
   * Filter an array of rows by date field.
   * @param {Object[]} rows
   * @param {string} dateField — key of the date value in each row
   */
  function filterByDate(rows, dateField) {
    const { start, end } = state
    if (!start || !end) return rows
    return rows.filter(row => {
      const raw = row[dateField]
      if (!raw) return false
      const d = new Date(raw)
      if (isNaN(d.getTime())) return false
      return d >= start && d <= end
    })
  }

  return { dateRange: state, setPreset, setCustomRange, toggleCompare, monthSpan, filterByDate }
}
