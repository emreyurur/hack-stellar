import React from 'react'

export interface DisplayCardProps {
  className?: string
  date?: string
  description?: string
  icon?: React.ReactNode
  iconClassName?: string
  title?: string
  titleClassName?: string
}

export function DisplayCard({
  className = '',
  date = 'Stellar Testnet',
  description = '$300M+ TVL',
  icon,
  iconClassName = 'text-[#F2C12E]',
  title = 'Tracked TVL',
  titleClassName = 'text-[#F2C12E]',
}: DisplayCardProps) {
  return (
    <div
      className={`relative flex h-40 w-[19rem] sm:w-[24rem] -skew-y-[8deg] select-none flex-col justify-between rounded-2xl border-2 border-white/[0.16] bg-[#12121A]/95 px-5 py-4 shadow-2xl backdrop-blur-md transition-all duration-700 after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[18rem] after:bg-gradient-to-l after:from-[#0A0A0E] after:to-transparent after:content-[''] hover:border-white/30 hover:bg-[#161622] [&>*]:flex [&>*]:items-center [&>*]:gap-2 ${className}`}
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`relative inline-flex rounded-xl border border-white/[0.12] bg-black/60 p-2 ${iconClassName}`}>
            {icon}
          </span>
          <p className={`text-sm font-bold uppercase tracking-wider font-mono ${titleClassName}`}>
            {title}
          </p>
        </div>
        <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-[#9CA3AF]">
          LIVE
        </span>
      </div>

      <p className="relative z-10 font-mono text-2xl font-extrabold tracking-tight text-[#F0F0F0] sm:text-3xl">
        {description}
      </p>

      <p className="relative z-10 text-xs font-medium text-[#9CA3AF]">{date}</p>
    </div>
  )
}

export function StatsDisplayCards() {
  const cards: DisplayCardProps[] = [
    {
      title: 'Tracked DeFi TVL',
      description: '$300M+ Liquidity',
      date: 'Across Stellar ecosystem pools',
      titleClassName: 'text-[#F2C12E]', // Billiard Gold
      iconClassName: 'text-[#F2C12E]',
      icon: (
        <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      className:
        '[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-2xl before:outline-border before:h-[100%] before:content-[\'\'] before:bg-blend-overlay before:bg-black/60 grayscale-[80%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 z-10 hover:z-40',
    },
    {
      title: 'Integrated DEXs',
      description: 'Blend & Soroswap',
      date: 'Multi-protocol routing engine',
      titleClassName: 'text-[#16A34A]', // Billiard Green
      iconClassName: 'text-[#16A34A]',
      icon: (
        <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      className:
        '[grid-area:stack] translate-x-12 translate-y-10 sm:translate-x-16 sm:translate-y-12 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-2xl before:outline-border before:h-[100%] before:content-[\'\'] before:bg-blend-overlay before:bg-black/50 grayscale-[60%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 z-20 hover:z-40',
    },
    {
      title: 'Trust Engine Score',
      description: '0–100 Pool Ratings',
      date: 'Liquidity, Age, Audit & Activity',
      titleClassName: 'text-[#3B82F6]', // Billiard Blue
      iconClassName: 'text-[#3B82F6]',
      icon: (
        <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      className:
        '[grid-area:stack] translate-x-24 translate-y-20 sm:translate-x-32 sm:translate-y-24 hover:translate-y-10 z-30 hover:z-40',
    },
  ]

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8">
      <div className="grid items-center gap-16 lg:grid-cols-12">
        {/* Left column description */}
        <div className="lg:col-span-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F2C12E]">
            Live Telemetry
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#F0F0F0] sm:text-4xl">
            Real-time DeFi insights across Stellar.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#9CA3AF] sm:text-base">
            Every liquidity pool and lending market is continuously monitored. Terminal8 aggregates live on-chain metrics, calculates trust scores, and routes batch swaps directly through native Soroban execution.
          </p>
          <div className="mt-6 flex items-center gap-4 text-xs font-mono text-[#16A34A]">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#16A34A] animate-pulse" />
              Soroban RPC Connected
            </span>
          </div>
        </div>

        {/* Right column overlapping perspective stack */}
        <div className="flex justify-center lg:col-span-7 py-8">
          <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700 pr-16 sm:pr-24 pb-16">
            {cards.map((cardProps, index) => (
              <DisplayCard key={index} {...cardProps} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
