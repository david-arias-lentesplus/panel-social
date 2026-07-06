/**
 * GlobalBar — barra global fija en la parte superior del área de contenido.
 * Contiene: DateRangePicker + botón Exportar PDF.
 */
import DateRangePicker from '../ui/DateRangePicker'
import Spinner from '../ui/Spinner'

export default function GlobalBar({ dateRange, setPreset, setCustomRange, toggleCompare, loading, accountFilter, setAccountFilter }) {
  function handleExport() {
    // TODO: integrar librería de PDF (jsPDF + html2canvas) en iteración futura
    alert('Exportación a PDF próximamente 📄')
  }

  return (
    <div className="flex items-center justify-between bg-white border-b border-[#F0F0F0] px-6 py-2.5 h-14 shrink-0 z-10">
      {/* Left: Loading indicator */}
      <div className="flex items-center gap-2 min-w-[80px]">
        {loading && (
          <>
            <Spinner size={14} />
            <span className="text-xs text-[#AAA]">Cargando…</span>
          </>
        )}
      </div>

      {/* Right: filtro de cuenta + date picker + export */}
      <div className="flex items-center gap-2">
        {setAccountFilter && (
          <div className="flex items-center rounded-input border-[1.5px] border-[#DDD] overflow-hidden h-9" title="Filtrar publicaciones por cuenta">
            <button
              onClick={() => setAccountFilter('todas')}
              className={`h-full px-3 text-xs font-bold tracking-[0.3px] transition-all ${
                accountFilter === 'todas' ? 'bg-[#0000E1] text-white' : 'bg-white text-[#666] hover:text-[#0000E1]'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setAccountFilter('propia')}
              className={`h-full px-3 text-xs font-bold tracking-[0.3px] transition-all border-l-[1.5px] border-[#DDD] ${
                accountFilter === 'propia' ? 'bg-[#0000E1] text-white' : 'bg-white text-[#666] hover:text-[#0000E1]'
              }`}
            >
              Solo propia
            </button>
          </div>
        )}

        <DateRangePicker
          dateRange={dateRange}
          setPreset={setPreset}
          setCustomRange={setCustomRange}
          toggleCompare={toggleCompare}
        />

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 h-9 px-3 rounded-input border-[1.5px] border-[#DDD] bg-white text-sm font-bold text-[#444] hover:border-[#0000E1] hover:text-[#0000E1] transition-all"
          title="Exportar PDF"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <span className="hidden sm:inline">Exportar PDF</span>
        </button>
      </div>
    </div>
  )
}
