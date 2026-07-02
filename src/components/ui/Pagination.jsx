/**
 * Pagination — componente reutilizable
 */

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const pages = []
  const delta = 2
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 py-3">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 rounded-full flex items-center justify-center text-[#666] hover:bg-[#F0F0F0] disabled:opacity-30 transition-colors"
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-[#AAA] text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${
              p === page
                ? 'bg-[#0000E1] text-white'
                : 'text-[#666] hover:bg-[#F0F0F0]'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-full flex items-center justify-center text-[#666] hover:bg-[#F0F0F0] disabled:opacity-30 transition-colors"
      >
        ›
      </button>
    </div>
  )
}
