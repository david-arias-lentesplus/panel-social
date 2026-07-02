/**
 * Input — LIVO Design System
 */

export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-xs font-bold text-[#111] tracking-[0.5px] uppercase">
          {label}
        </label>
      )}
      <input
        className={[
          'w-full h-[44px] px-3 py-[10px]',
          'border-[1.5px] rounded-input text-sm text-[#111] placeholder-[#AAA]',
          'transition-shadow duration-150 focus:outline-none',
          error
            ? 'bg-[#FFF5F5] border-[#DC2626] focus:border-[#DC2626]'
            : 'bg-white border-[#DDD] focus:border-[#0000E1] focus:shadow-[0px_0px_0px_3px_rgba(0,0,225,0.2)]',
          'disabled:bg-[#F5F5F5] disabled:border-[#E0E0E0] disabled:opacity-60',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
    </div>
  )
}
