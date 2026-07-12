import type { ReactNode } from 'react'

export function BentoGrid({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`grid w-full auto-rows-[21rem] grid-cols-1 gap-5 md:grid-cols-3 ${className}`}
    >
      {children}
    </div>
  )
}

export function BentoCard({
  accentColor = '#F2C12E',
  background,
  className = '',
  cta = 'Launch Feature',
  description,
  icon,
  name,
  onClick,
  tag,
}: {
  accentColor?: string
  background?: ReactNode
  className?: string
  cta?: string
  description: string
  icon: ReactNode
  name: string
  onClick?: () => void
  tag: string
}) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.12] bg-[#12121A] text-[#F0F0F0] shadow-xl transition-all duration-300 hover:border-white/[0.25] hover:bg-[#14141E] hover:shadow-[0_0_50px_-15px_rgba(242,193,46,0.2)] ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Background graphic element */}
      <div className="absolute inset-0 overflow-hidden opacity-80 transition-transform duration-500 group-hover:scale-[1.03]">
        {background}
      </div>

      {/* Subtle top gradient overlay so text stays readable */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#12121A] via-[#12121A]/75 to-transparent opacity-95 transition-opacity duration-300 group-hover:opacity-90" />

      {/* Card Content - translates up on hover */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-end p-6 transition-all duration-300 group-hover:-translate-y-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex size-11 items-center justify-center rounded-xl border border-white/[0.12] bg-black/40 text-xl transition-transform duration-300 group-hover:scale-90">
            {icon}
          </div>
          <span
            className="rounded-md px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider uppercase"
            style={{ color: accentColor, backgroundColor: `${accentColor}18`, border: `1px solid ${accentColor}35` }}
          >
            {tag}
          </span>
        </div>

        <h3 className="text-xl font-bold tracking-tight text-[#F0F0F0] sm:text-2xl">
          {name}
        </h3>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#9CA3AF] transition-colors duration-200 group-hover:text-[#F0F0F0]/90">
          {description}
        </p>
      </div>

      {/* Sliding Bottom CTA */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex translate-y-10 items-center justify-between border-t border-white/[0.08] bg-[#0D0D12]/95 px-6 py-3.5 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#F2C12E]">
          {cta}
        </span>
        <span className="flex size-6 items-center justify-center rounded-full bg-[#F2C12E]/15 text-xs text-[#F2C12E]">
          →
        </span>
      </div>

      {/* Subtle highlight border on hover */}
      <div className="pointer-events-none absolute inset-0 transition-colors duration-300 group-hover:bg-white/[0.02]" />
    </div>
  )
}
