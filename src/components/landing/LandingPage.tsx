import { useState } from 'react'
import xlmLogo from '../../assets/xlm.svg'
import usdcLogo from '../../assets/usdc.svg'
import eightLogo from '../../assets/eight.svg'
import { FeaturesSectionWithHoverEffects } from './FeaturesSectionWithHoverEffects'
import { FAQSection } from './FAQSection'
import { Footer7 } from './Footer7'
import { SupportedEcosystemSection } from './SupportedEcosystemSection'
import { WavyBackground } from './WavyBackground'

type LandingPageProps = {
  onLaunch: () => void
  onOpenDocs: () => void
}

export function LandingPage({ onLaunch, onOpenDocs }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeNav, setActiveNav] = useState<'home' | 'features' | 'protocols' | 'faq' | 'docs'>('home')

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleNavClick = (key: 'home' | 'features' | 'protocols' | 'faq' | 'docs') => {
    setActiveNav(key)
    setMobileMenuOpen(false)
    if (key === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (key === 'docs') {
      onOpenDocs()
    } else {
      scrollToSection(key)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0E] text-[#F0F0F0] selection:bg-[#F2C12E]/30">
      {/* ── Top Sticky Navbar (Flowbite Responsive Layout) ── */}
      <nav className="fixed start-0 top-0 z-50 w-full border-b border-white/[0.08] bg-[#0A0A0E]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between p-4">
          <button
            onClick={() => {
              setActiveNav('home')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="group flex items-center space-x-3 text-left rtl:space-x-reverse"
            type="button"
          >
            <span
              className="flex items-center gap-1.5 leading-none text-[#F0F0F0]"
              style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em' }}
            >
              <span>TERMINAL</span>
              <img
                alt="8"
                className="h-7 w-auto shrink-0 transition-transform duration-200 group-hover:scale-105"
                src={eightLogo}
              />
            </span>
          </button>

          <div className="flex space-x-3 md:order-2 md:space-x-0 rtl:space-x-reverse">
            <button
              onClick={onLaunch}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F2C12E] px-4 py-2 text-xs font-bold tracking-wide text-[#0D0D12] transition-colors duration-150 hover:bg-[#e0b429] focus:outline-none focus:ring-2 focus:ring-[#F2C12E]/50"
              type="button"
            >
              <span>Launch App</span>
              <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>

            <button
              aria-controls="navbar-sticky"
              aria-expanded={mobileMenuOpen}
              className="inline-flex size-10 items-center justify-center rounded-lg p-2 text-sm text-[#9CA3AF] hover:bg-white/[0.06] hover:text-[#F0F0F0] focus:outline-none focus:ring-2 focus:ring-white/20 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
            >
              <span className="sr-only">Open main menu</span>
              <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
              </svg>
            </button>
          </div>

          <div
            className={`${mobileMenuOpen ? 'block' : 'hidden'} w-full items-center justify-between md:order-1 md:flex md:w-auto`}
            id="navbar-sticky"
          >
            <ul className="mt-4 flex flex-col rounded-xl border border-white/[0.08] bg-[#12121A] p-4 font-medium md:mt-0 md:flex-row md:space-x-8 md:border-0 md:bg-transparent md:p-0 rtl:space-x-reverse">
              {(['home', 'features', 'protocols', 'faq', 'docs'] as const).map((key) => {
                const labels: Record<string, string> = {
                  home: 'Home',
                  features: 'Features',
                  protocols: 'Protocols',
                  faq: 'FAQ',
                  docs: 'Docs',
                }
                const isActive = activeNav === key
                return (
                  <li key={key}>
                    <button
                      aria-current={isActive ? 'page' : undefined}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm tracking-wide transition md:p-0 ${
                        isActive
                          ? 'font-semibold text-[#F2C12E]'
                          : 'font-medium text-[#9CA3AF] hover:bg-white/[0.06] hover:text-[#F2C12E] md:hover:bg-transparent'
                      }`}
                      onClick={() => handleNavClick(key)}
                      type="button"
                    >
                      {labels[key]}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </nav>

      {/* ── Hero Section with Billiard Background ── */}
      <WavyBackground
        className="mx-auto max-w-6xl px-5 py-10 text-center sm:px-8"
        containerClassName="min-h-screen pt-32 pb-8 sm:pt-36 md:pt-40"
      >
        <h1
          className="mt-4 text-6xl font-extrabold leading-[1.03] tracking-tight text-white drop-shadow-[0_4px_32px_rgba(255,255,255,0.25)] sm:text-8xl lg:text-[7rem] xl:text-[7.5rem]"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Every wallet deserves a{' '}
          <span className="bg-gradient-to-r from-[#FDE047] via-[#4ADE80] to-[#60A5FA] bg-clip-text text-transparent drop-shadow-[0_0_45px_rgba(242,193,46,0.30)]">
            DeFi command center
          </span>
          .
        </h1>

        <p
          className="mx-auto mt-9 max-w-4xl text-2xl font-medium leading-relaxed text-[#F1F5F9] drop-shadow sm:text-3xl"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          One unified interface for all of Stellar DeFi.{' '}
          <span className="font-semibold text-white">Batch-sweep idle dust into yield</span>, evaluate pools with{' '}
          <span className="font-semibold text-[#FDE047]">verified on-chain trust scores</span>, and manage Blend, Soroswap, and Aquarius positions without switching tabs.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <button
            onClick={onLaunch}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F2C12E] px-5 py-3 text-xs font-bold tracking-wide text-[#0D0D12] shadow-[0_0_24px_rgba(242,193,46,0.35)] transition-all duration-150 hover:bg-[#FDE047] hover:shadow-[0_0_32px_rgba(242,193,46,0.55)]"
            type="button"
          >
            <span>Enter Dashboard</span>
            <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          </button>

          <button
            onClick={() => scrollToSection('features')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.18] bg-white/[0.06] px-5 py-3 text-xs font-semibold text-white transition-colors duration-150 hover:border-white/[0.30] hover:bg-white/[0.10]"
            type="button"
          >
            <span>Explore Architecture</span>
          </button>
        </div>

        {/* Native Asset Support Row */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-4 text-xs text-[#E2E8F0]">
          <span className="font-mono font-bold uppercase tracking-[0.2em] text-[11px] text-[#CBD5E1]">Native Support:</span>
          <div className="flex items-center gap-2 rounded-full border border-white/[0.14] bg-[#12121A] px-3.5 py-1.5">
            <img alt="XLM" className="size-4" src={xlmLogo} />
            <span className="font-mono text-xs font-bold text-white">XLM</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/[0.14] bg-[#12121A] px-3.5 py-1.5">
            <img alt="USDC" className="size-4" src={usdcLogo} />
            <span className="font-mono text-xs font-bold text-white">USDC</span>
          </div>
        </div>
      </WavyBackground>

      {/* ── Stats Strip ── */}
      <section className="border-y border-white/[0.08] bg-[#0D0D12] py-10">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#9CA3AF]">Tracked DeFi TVL</p>
              <p className="mt-1 font-mono text-3xl font-extrabold text-[#F0F0F0]">$300M+</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">Across Stellar ecosystem</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#9CA3AF]">Integrated Protocols</p>
              <p className="mt-1 font-mono text-3xl font-extrabold text-[#F2C12E]">3 Major</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">Blend, Soroswap & Aquarius</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#9CA3AF]">Pool Trust Evaluation</p>
              <p className="mt-1 font-mono text-3xl font-extrabold text-[#16A34A]">4 Factors</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">Liquidity, Age, Audit & Activity</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#9CA3AF]">Execution Mode</p>
              <p className="mt-1 font-mono text-3xl font-extrabold text-[#F0F0F0]">Non-Custodial</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">Direct Freighter wallet signing</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-24" id="features">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F2C12E]">
              Unified Infrastructure
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#F0F0F0] sm:text-4xl">
              Engineered to eliminate fragmentation across Stellar DeFi.
            </h2>
          </div>

          <div className="mt-12">
            <FeaturesSectionWithHoverEffects />
          </div>
        </div>
      </section>

      {/* ── Supported Ecosystem Marquee Section (Protocols, Assets & Wallets) ── */}
      <SupportedEcosystemSection />

      {/* ── Frequently Asked Questions Section ── */}
      <FAQSection />

      {/* ── Footer ── */}
      <Footer7 onLaunch={onLaunch} onOpenDocs={onOpenDocs} />
    </div>
  )
}
