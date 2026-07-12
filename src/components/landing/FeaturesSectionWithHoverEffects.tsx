import React from 'react'

export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: 'Pool Reputation Scoring',
      description:
        'Every pool is rated from 0 to 100 based on verified on-chain liquidity depth, contract age, third-party audits, and trading activity.',
      icon: (
        <svg className="size-6 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    {
      title: 'Batch Swap Engine',
      description:
        'Sweep idle dust trustlines into clean USDC in a single transaction using native Stellar PathPaymentStrictSend routing.',
      icon: (
        <svg className="size-6 text-[#F2C12E]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      title: 'Unified Position Tracking',
      description:
        'Monitor all your lending positions, liquidity pools, and reward streams across Blend, Soroswap, and Aquarius in one clear dashboard.',
      icon: (
        <svg className="size-6 text-[#3B82F6]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      title: 'Risk-Matched Recommendations',
      description:
        'Take a quick 3-question risk assessment to get tailored conservative, moderate, or aggressive yield opportunities.',
      icon: (
        <svg className="size-6 text-[#F2C12E]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      ),
    },
    {
      title: 'Yield Bundles',
      description:
        'Deploy multi-protocol allocation strategies with curated bundles designed for capital preservation or maximum yield.',
      icon: (
        <svg className="size-6 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
    {
      title: 'Developer Terminal CLI',
      description:
        'Power users and developers can inspect, withdraw, and query state directly via our embedded command line console.',
      icon: (
        <svg className="size-6 text-[#8B5CF6]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="relative z-10 mx-auto grid max-w-[1440px] grid-cols-1 border border-white/[0.08] bg-[#0D0D12] md:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  )
}

function Feature({
  description,
  icon,
  index,
  title,
}: {
  description: string
  icon: React.ReactNode
  index: number
  title: string
}) {
  return (
    <div
      className={`group/feature relative flex flex-col py-10 border-white/[0.08] ${
        index < 3 ? 'border-b' : ''
      } ${index % 3 !== 2 ? 'lg:border-r' : ''} ${
        index % 2 === 0 ? 'md:border-r lg:border-r-0' : ''
      } ${index % 3 !== 2 ? 'lg:border-r' : ''} transition-colors duration-150 hover:bg-white/[0.02]`}
    >
      <div className="relative z-10 mb-4 px-10 text-[#9CA3AF] transition-colors duration-150 group-hover/feature:text-[#F2C12E]">
        {icon}
      </div>

      <div className="relative z-10 mb-2 px-10 text-lg font-bold">
        <div className="absolute inset-y-0 left-0 h-6 w-1 rounded-r-full bg-white/10 transition-colors duration-150 group-hover/feature:bg-[#F2C12E]" />
        <span className="inline-block text-[#F0F0F0]">
          {title}
        </span>
      </div>

      <p className="relative z-10 max-w-sm px-10 text-sm leading-relaxed text-[#9CA3AF]">
        {description}
      </p>
    </div>
  )
}
