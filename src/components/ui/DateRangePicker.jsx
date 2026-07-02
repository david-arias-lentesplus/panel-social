/**
 * DateRangePicker
 * ─────────────────────────────────────────────────────────────────
 * Dropdown con presets + calendario dual para selección de rango.
 * Diseño basado en el mockup LIVO proporcionado.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  PRESETS, DAYS_ES, MONTHS_ES,
  getCalendarDays, isSameDay,
  startOfDay, endOfDay, formatDateShort, formatDateFull,
} from '../../utils/dateUtils'

// ── Mini Calendar Month ───────────────────────────────────────────

function CalMonth({ year, month, selStart, selEnd, hoverDate, selecting, onDay, onHover, showPrev, showNext, onPrev, onNext }) {
  const cells = getCalendarDays(year, month)

  return (
    <div className="w-[260px] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        {showPrev
          ? <button onClick={onPrev} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F0F0F0] text-[#666] text-lg leading-none">‹</button>
          : <span className="w-7" />}
        <span className="text-sm font-bold text-[#111] capitalize">
          {MONTHS_ES[month]} {year}
        </span>
        {showNext
          ? <button onClick={onNext} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F0F0F0] text-[#666] text-lg leading-none">›</button>
          : <span className="w-7" />}
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_ES.map(d => (
          <div key={d} className="text-center text-[11px] font-bold text-[#AAA] py-0.5">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map(({ date, current }, i) => {
          if (!current) return <span key={i} className="h-8" />

          const isStart = selStart && isSameDay(date, selStart)
          const isEnd   = selEnd   && isSameDay(date, selEnd)
          const isEdge  = isStart || isEnd

          const effectiveEnd = selecting && hoverDate ? hoverDate : selEnd
          const normalizedEnd = effectiveEnd && selStart && effectiveEnd < selStart ? selStart : effectiveEnd
          const inRange = selStart && normalizedEnd && date > selStart && date < normalizedEnd

          return (
            <button
              key={i}
              onClick={() => onDay(date)}
              onMouseEnter={() => onHover(date)}
              className={[
                'h-8 w-full text-[12px] rounded-full transition-colors',
                isEdge  ? 'bg-[#0000E1] text-white font-bold' : '',
                !isEdge && inRange ? 'bg-[#DDEEFF] text-[#0000E1]' : '',
                !isEdge && !inRange ? 'hover:bg-[#F0F0F0] text-[#111]' : '',
              ].join(' ')}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────

export default function DateRangePicker({ dateRange, setPreset, setCustomRange, toggleCompare }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Temporary state while picker is open
  const [tempStart, setTempStart] = useState(null)
  const [tempEnd,   setTempEnd]   = useState(null)
  const [tempPreset, setTempPreset] = useState(null)
  const [selecting, setSelecting] = useState(false) // waiting for 2nd click
  const [hover, setHover] = useState(null)

  // Which two months to show (left, right)
  const [leftY, setLeftY]   = useState(() => new Date().getFullYear())
  const [leftM, setLeftM]   = useState(() => {
    const m = new Date().getMonth() - 1
    return m < 0 ? 11 : m
  })

  const rightY = leftM === 11 ? leftY + 1 : leftY
  const rightM = leftM === 11 ? 0 : leftM + 1

  // Sync temp state when opening
  useEffect(() => {
    if (open) {
      setTempStart(dateRange.start)
      setTempEnd(dateRange.end)
      setTempPreset(dateRange.preset)
      setSelecting(false)
      setHover(null)
      // Set calendars so end month is visible on the right
      if (dateRange.end) {
        const m = dateRange.end.getMonth()
        const y = dateRange.end.getFullYear()
        const prevM = m === 0 ? 11 : m - 1
        const prevY = m === 0 ? y - 1 : y
        setLeftM(prevM)
        setLeftY(prevY)
      }
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Click outside → close
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleDayClick(date) {
    if (!selecting) {
      // First click = start
      setTempStart(startOfDay(date))
      setTempEnd(null)
      setSelecting(true)
      setTempPreset('custom')
    } else {
      // Second click = end (ensure end >= start)
      const s = tempStart
      const e = endOfDay(date)
      if (e < s) {
        setTempStart(startOfDay(date))
        setTempEnd(endOfDay(s))
      } else {
        setTempEnd(e)
      }
      setSelecting(false)
    }
  }

  function handlePresetClick(presetId) {
    const preset = PRESETS.find(p => p.id === presetId)
    if (!preset || preset.id === 'custom') {
      setTempPreset('custom')
      return
    }
    const [s, e] = preset.getDates(new Date())
    setTempStart(s)
    setTempEnd(e)
    setTempPreset(presetId)
    setSelecting(false)
    // Navigate calendar to show end month
    if (e) {
      const m = e.getMonth()
      const y = e.getFullYear()
      const prevM = m === 0 ? 11 : m - 1
      const prevY = m === 0 ? y - 1 : y
      setLeftM(prevM)
      setLeftY(prevY)
    }
  }

  function handlePrev() {
    if (leftM === 0) { setLeftM(11); setLeftY(y => y - 1) }
    else setLeftM(m => m - 1)
  }
  function handleNext() {
    if (leftM === 11) { setLeftM(0); setLeftY(y => y + 1) }
    else setLeftM(m => m + 1)
  }

  function handleApply() {
    if (!tempStart || !tempEnd) return
    if (tempPreset && tempPreset !== 'custom') {
      setPreset(tempPreset)
    } else {
      setCustomRange(tempStart, tempEnd)
    }
    setOpen(false)
  }

  function handleCancel() {
    setOpen(false)
  }

  // Trigger label
  const presetLabel = PRESETS.find(p => p.id === dateRange.preset)?.label ?? 'Personalizado'
  const startLabel  = dateRange.start ? formatDateShort(dateRange.start) : '—'
  const endLabel    = dateRange.end   ? formatDateShort(dateRange.end)   : '—'

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 h-9 px-3 rounded-input border-[1.5px] text-sm font-bold transition-all ${
          open
            ? 'border-[#0000E1] bg-[#F2F2FD] text-[#0000E1]'
            : 'border-[#DDD] bg-white text-[#111] hover:border-[#0000E1]'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="hidden sm:inline">{startLabel} — {endLabel}</span>
        <span className="sm:hidden">{presetLabel}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-11 right-0 z-50 bg-white rounded-card shadow-2xl border border-[#E0E0E0] flex" style={{ minWidth: 620 }}>
          {/* ── Presets panel ── */}
          <div className="w-40 border-r border-[#F0F0F0] py-3 shrink-0">
            {PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => handlePresetClick(p.id)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                  tempPreset === p.id
                    ? 'text-[#0000E1] font-bold bg-[#F2F2FD]'
                    : 'text-[#444] hover:bg-[#F8F8F8]'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full border-[2px] flex items-center justify-center shrink-0 ${
                  tempPreset === p.id ? 'border-[#0000E1]' : 'border-[#CCC]'
                }`}>
                  {tempPreset === p.id && <span className="w-2 h-2 rounded-full bg-[#0000E1]" />}
                </span>
                {p.label}
              </button>
            ))}
          </div>

          {/* ── Calendar panel ── */}
          <div className="flex-1 p-5 flex flex-col gap-4">
            {/* Dual calendars */}
            <div className="flex gap-6">
              <CalMonth
                year={leftY} month={leftM}
                selStart={tempStart} selEnd={tempEnd}
                hoverDate={hover} selecting={selecting}
                onDay={handleDayClick}
                onHover={setHover}
                showPrev onPrev={handlePrev}
                showNext={false} onNext={handleNext}
              />
              <CalMonth
                year={rightY} month={rightM}
                selStart={tempStart} selEnd={tempEnd}
                hoverDate={hover} selecting={selecting}
                onDay={handleDayClick}
                onHover={setHover}
                showPrev={false} onPrev={handlePrev}
                showNext onNext={handleNext}
              />
            </div>

            {/* Comparar */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dateRange.compare}
                onChange={toggleCompare}
                className="w-4 h-4 rounded accent-[#0000E1]"
              />
              <span className="text-sm text-[#111]">Comparar</span>
            </label>

            {/* Bottom bar */}
            <div className="flex items-center gap-3 pt-1 border-t border-[#F0F0F0]">
              {/* Preset select */}
              <select
                value={tempPreset ?? 'custom'}
                onChange={e => handlePresetClick(e.target.value)}
                className="h-9 px-2 border-[1.5px] border-[#DDD] rounded-input text-sm text-[#111] bg-white focus:outline-none focus:border-[#0000E1] flex-shrink-0"
              >
                {PRESETS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>

              {/* Range display */}
              <div className="flex items-center gap-1 text-sm text-[#666] min-w-0 flex-1">
                <span className="truncate">{tempStart ? formatDateShort(tempStart) : '—'}</span>
                <span>–</span>
                <span className="truncate">{tempEnd ? formatDateShort(tempEnd) : '—'}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleCancel}
                  className="h-9 px-4 rounded-btn border-[1.5px] border-[#DDD] text-sm font-bold text-[#444] hover:border-[#AAA] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApply}
                  disabled={!tempStart || !tempEnd}
                  className="h-9 px-4 rounded-btn bg-[#0000E1] text-white text-sm font-bold hover:bg-[#0000BF] disabled:opacity-40 transition-colors"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
