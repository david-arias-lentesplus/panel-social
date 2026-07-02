/**
 * Badge — LIVO Design System
 * Semantic: info | success | warning | error | promo
 * Style:    outline (default) | solid
 */

const STYLES = {
  info: {
    outline: 'bg-[#E8E8FF] border border-[#0000C0] text-[#0000C0]',
    solid:   'bg-[#0000E1] text-white',
  },
  success: {
    outline: 'bg-[#DCFCE7] border border-[#15803D] text-[#15803D]',
    solid:   'bg-[#16A34A] text-white',
  },
  warning: {
    outline: 'bg-[#FEF3C7] border border-[#B45309] text-[#B45309]',
    solid:   'bg-[#D97706] text-white',
  },
  error: {
    outline: 'bg-[#FEE2E2] border border-[#B91C1C] text-[#B91C1C]',
    solid:   'bg-[#DC2626] text-white',
  },
  promo: {
    outline: 'bg-[#FCE7F3] border border-[#BE185D] text-[#BE185D]',
    solid:   'bg-[#D92D8E] text-white',
  },
}

export default function Badge({ children, semantic = 'info', style = 'outline', className = '' }) {
  const cls = STYLES[semantic]?.[style] ?? STYLES.info.outline
  return (
    <span
      className={`inline-flex items-center px-[10px] py-[4px] rounded-full text-[11px] font-bold ${cls} ${className}`}
    >
      {children}
    </span>
  )
}
