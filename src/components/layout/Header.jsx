import Spinner from '../ui/Spinner'

export default function Header({ title, subtitle, loading = false, onRefresh }) {
  const now = new Date().toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <header className="flex items-center justify-between bg-white border-b border-[#F0F0F0] px-8 py-4">
      <div>
        <h1 className="text-xl font-bold text-[#111]">{title}</h1>
        {subtitle && <p className="text-xs text-[#666] mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-[#AAA]">{now}</span>
        {loading && <Spinner size={18} />}
        {onRefresh && !loading && (
          <button
            onClick={onRefresh}
            className="text-[#0000E1] hover:text-[#0000BF] transition-colors"
            title="Refrescar datos"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
