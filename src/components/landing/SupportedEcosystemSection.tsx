import React from 'react'
import xlmLogo from '../../assets/xlm.svg'
import usdcLogo from '../../assets/usdc.svg'
import aquaLogo from '../../assets/aquaris.svg'
import { InfiniteSlider } from './InfiniteSlider'

type EcosystemItem = {
  accentColor: string
  category: 'PROTOCOL' | 'ASSET' | 'WALLET'
  desc: string
  logo: React.ReactNode
  name: string
}

export function SupportedEcosystemSection() {
  const freighterLogo = (
    <svg className="size-8" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#1E1E2E" />
      <path
        d="M18 7L25 18L18 29L11 18L18 7Z"
        fill="#8B5CF6"
        stroke="#8B5CF6"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="18" r="3.5" fill="#F0F0F0" />
    </svg>
  )

  const xbullLogo = (
    <svg className="size-8" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#14211A" />
      <path
        d="M11 12C14 12 16 15 18 18C20 15 22 12 25 12M11 24C14 24 16 21 18 18C20 21 22 24 25 24"
        stroke="#16A34A"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="18" r="2.5" fill="#F2C12E" />
    </svg>
  )

  const lobstrLogo = (
    <svg className="size-8" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#141926" />
      <path
        d="M18 10C13.5 10 10 13.5 10 18C10 22.5 13.5 26 18 26C22.5 26 26 22.5 26 18C26 13.5 22.5 10 18 10Z"
        stroke="#3B82F6"
        strokeWidth="2"
      />
      <path d="M18 13V18L21.5 21.5" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="18" cy="18" r="2" fill="#60A5FA" />
    </svg>
  )

  const albedoLogo = (
    <svg className="size-8" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="#221C14" />
      <path
        d="M18 9L20.8 15.2L27.5 16.2L22.6 21L23.8 27.7L18 24.6L12.2 27.7L13.4 21L8.5 16.2L15.2 15.2L18 9Z"
        stroke="#F2C12E"
        strokeWidth="1.8"
        fill="rgba(242, 193, 46, 0.15)"
        strokeLinejoin="round"
      />
    </svg>
  )

  const items: EcosystemItem[] = [
    {
      name: 'Blend Protocol',
      category: 'PROTOCOL',
      desc: 'Fixed & variable rate lending pools across Stellar Soroban.',
      accentColor: '#F2C12E',
      logo: <img alt="USDC" className="size-8" src={usdcLogo} />,
    },
    {
      name: 'Soroswap DEX',
      category: 'PROTOCOL',
      desc: 'Automated market maker liquidity pairs & smart routing.',
      accentColor: '#16A34A',
      logo: <img alt="XLM" className="size-8" src={xlmLogo} />,
    },
    {
      name: 'Aquarius (AQUA)',
      category: 'PROTOCOL',
      desc: 'Liquidity incentives & decentralized governance layer.',
      accentColor: '#3B82F6',
      logo: <img alt="AQUA" className="size-8" src={aquaLogo} />,
    },
    {
      name: 'XLM Native',
      category: 'ASSET',
      desc: 'Stellar native asset for lightning-fast network execution.',
      accentColor: '#F2C12E',
      logo: <img alt="XLM" className="size-8" src={xlmLogo} />,
    },
    {
      name: 'USDC Stablecoin',
      category: 'ASSET',
      desc: 'Regulated dollar liquidity backed 1:1 on Stellar network.',
      accentColor: '#16A34A',
      logo: <img alt="USDC" className="size-8" src={usdcLogo} />,
    },
    {
      name: 'Freighter Wallet',
      category: 'WALLET',
      desc: 'Native Soroban extension & mobile wallet for Stellar.',
      accentColor: '#8B5CF6',
      logo: freighterLogo,
    },
    {
      name: 'xBull Wallet',
      category: 'WALLET',
      desc: 'Multi-platform non-custodial Stellar wallet ecosystem.',
      accentColor: '#16A34A',
      logo: xbullLogo,
    },
    {
      name: 'LOBSTR Vault',
      category: 'WALLET',
      desc: 'Popular mobile wallet with built-in multisig security.',
      accentColor: '#3B82F6',
      logo: lobstrLogo,
    },
    {
      name: 'Albedo Signer',
      category: 'WALLET',
      desc: 'Zero-install web transaction signer for instant access.',
      accentColor: '#F2C12E',
      logo: albedoLogo,
    },
  ]

  const renderCard = (item: EcosystemItem, idx: number) => (
    <div
      key={`${item.name}-${idx}`}
      className="flex w-80 shrink-0 flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#12121A] p-5 transition-colors duration-150 hover:border-white/[0.18]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {item.logo}
          <div>
            <h3 className="font-bold text-[#F0F0F0]">{item.name}</h3>
            <span
              className="rounded px-2 py-0.5 font-mono text-[10px] font-bold"
              style={{
                color: item.accentColor,
                backgroundColor: `${item.accentColor}15`,
              }}
            >
              {item.category}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-[#9CA3AF]">{item.desc}</p>
    </div>
  )

  return (
    <section className="border-t border-white/[0.08] bg-[#0A0A0E] py-24" id="ecosystem">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F2C12E]">
            Supported Ecosystem
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[#F0F0F0] sm:text-4xl">
            Protocols, Assets & Wallets in One Unified Hub.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#9CA3AF]">
            Terminal8 natively bridges Soroban lending protocols, Stellar AMMs, verified tokens, and your favorite non-custodial wallets.
          </p>
        </div>

        {/* Single Unified Marquee Row */}
        <div className="mt-14">
          <InfiniteSlider duration={45} gap={24} reverse={false}>
            {items.map((item, idx) => renderCard(item, idx))}
          </InfiniteSlider>
        </div>
      </div>
    </section>
  )
}
