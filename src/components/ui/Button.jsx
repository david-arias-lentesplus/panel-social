/**
 * Button — LIVO Design System
 * Variants: primary | secondary | outline | darker
 * Sizes:    sm | md (default) | lg
 */

const VARIANTS = {
  primary:
    'bg-[#0000E1] text-white hover:bg-[#0000C0] active:bg-[#00009A] focus:shadow-[0px_0px_0px_3px_rgba(0,0,225,0.5)] disabled:bg-[#8888CC]',
  secondary:
    'bg-[#DEFF00] text-black hover:bg-[#C8E800] active:bg-[#B2CC00] focus:shadow-[0px_0px_0px_3px_rgba(222,255,0,0.5)] disabled:bg-[#EEFFAA]',
  outline:
    'bg-[#F5F5F5] border-[1.5px] border-[#0000E1] text-[#0000E1] hover:bg-[#E8E8FF] active:bg-[#D0D0FF] focus:shadow-[0px_0px_0px_3px_rgba(0,0,225,0.5)] disabled:border-[#CCC] disabled:text-[#CCC]',
  darker:
    'bg-black text-white hover:bg-[#111] active:bg-[#222] focus:shadow-[0px_0px_0px_3px_rgba(0,0,225,0.5)] disabled:bg-[#888]',
  ghost:
    'bg-transparent text-[#0000E1] hover:bg-[#E8E8FF] active:bg-[#D0D0FF] focus:shadow-[0px_0px_0px_3px_rgba(0,0,225,0.5)]',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-[18px] py-3 text-sm',
  lg: 'px-6 py-3.5 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2',
        'font-bold tracking-[0.5px] rounded-full',
        'transition-all duration-150',
        'focus:outline-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
