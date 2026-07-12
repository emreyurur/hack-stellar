import type { ReactElement } from 'react'
import eightLogo from '../../assets/eight.svg'

export interface Footer7Props {
  copyright?: string
  description?: string
  legalLinks?: Array<{
    href: string
    name: string
  }>
  logo?: {
    alt: string
    title: string
    url: string
  }
  onLaunch?: () => void
  onOpenDocs?: () => void
  sections?: Array<{
    links: Array<{ href?: string; name: string; onClick?: () => void }>
    title: string
  }>
  socialLinks?: Array<{
    href: string
    icon: ReactElement
    label: string
  }>
}

export function Footer7({
  copyright = '© 2026 TERMINAL8. Built on Stellar & Soroban. All rights reserved.',
  description = 'Unified non-custodial DeFi infrastructure across Stellar Soroban lending, DEX liquidity pools, and batch transaction routing.',
  legalLinks = [
    { name: 'Terms of Service', href: '#' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Security Audits', href: '#' },
  ],
  onLaunch,
  onOpenDocs,
  sections,
  socialLinks,
}: Footer7Props) {
  const defaultSocialLinks = [
    {
      label: 'Twitter / X',
      href: 'https://twitter.com/StellarOrg',
      icon: (
        <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      label: 'GitHub',
      href: 'https://github.com/stellar',
      icon: (
        <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
        </svg>
      ),
    },
    {
      label: 'Discord',
      href: 'https://discord.gg/stellar',
      icon: (
        <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
    },
  ]

  const defaultSections = [
    {
      title: 'Product',
      links: [
        { name: 'Launch Terminal App', onClick: onLaunch },
        { name: 'Protocol Architecture', href: '#features' },
        { name: 'Supported Ecosystem', href: '#ecosystem' },
        { name: 'Reputation Scoring Engine', href: '#features' },
      ],
    },
    {
      title: 'Stellar & Soroban',
      links: [
        { name: 'Developer Documentation', onClick: onOpenDocs },
        { name: 'Freighter Extension', href: 'https://freighter.app' },
        { name: 'Stellar Wallets Kit', href: 'https://github.com/Creit-Tech/Stellar-Wallets-Kit' },
        { name: 'Soroban Contracts', href: 'https://soroban.stellar.org' },
      ],
    },
    {
      title: 'Resources',
      links: [
        {
          name: 'Frequently Asked Questions (FAQ)',
          href: '#faq',
          onClick: () => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }),
        },
        { name: 'Project Overview', href: '#' },
        { name: 'Network Status', href: '#' },
        { name: 'Soroban Native Swap', href: '#' },
        { name: 'GitHub Repository', href: '#' },
      ],
    },
  ]

  const activeSections = sections || defaultSections
  const activeSocials = socialLinks || defaultSocialLinks

  return (
    <footer className="border-t border-white/[0.08] bg-[#0A0A0E] py-20 text-[#9CA3AF]">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="flex w-full flex-col justify-between gap-12 lg:flex-row lg:items-start lg:text-left">
          {/* Brand Column */}
          <div className="flex w-full flex-col justify-between gap-6 lg:max-w-sm lg:items-start">
            <div className="flex items-center gap-3">
              <span
                className="flex items-center gap-1.5 leading-none text-[#F0F0F0]"
                style={{ fontFamily: "'Syne', sans-serif", fontSize: '24px', fontWeight: 800 }}
              >
                <span>TERMINAL</span>
                <img
                  alt="8"
                  className="h-8 w-auto shrink-0"
                  src={eightLogo}
                />
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#9CA3AF]">{description}</p>
            <ul className="flex items-center space-x-6">
              {activeSocials.map((social, idx) => (
                <li key={idx}>
                  <a
                    aria-label={social.label}
                    className="flex size-9 items-center justify-center rounded-xl border border-white/[0.08] bg-[#12121A] text-[#9CA3AF] transition-colors duration-150 hover:border-white/[0.20] hover:text-[#F0F0F0]"
                    href={social.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {social.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Grid */}
          <div className="grid w-full gap-8 sm:grid-cols-3 lg:gap-16">
            {activeSections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#F0F0F0]">
                  {section.title}
                </h3>
                <ul className="space-y-3.5 text-sm">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      {link.onClick ? (
                        <button
                          className="font-medium text-[#9CA3AF] transition hover:text-[#F2C12E]"
                          onClick={link.onClick}
                          type="button"
                        >
                          {link.name}
                        </button>
                      ) : (
                        <a
                          className="font-medium text-[#9CA3AF] transition hover:text-[#F2C12E]"
                          href={link.href || '#'}
                        >
                          {link.name}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-white/[0.08] pt-8 text-xs font-medium text-[#9CA3AF] sm:flex-row sm:items-center">
          <p>{copyright}</p>
          <ul className="flex flex-wrap gap-6">
            {legalLinks.map((link, idx) => (
              <li key={idx}>
                <a className="transition hover:text-[#F0F0F0]" href={link.href}>
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
