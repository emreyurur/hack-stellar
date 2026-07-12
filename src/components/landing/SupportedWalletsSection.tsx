

export function SupportedWalletsSection() {
  const wallets = [
    {
      name: 'Freighter',
      type: 'Browser Extension & Mobile',
      badge: 'RECOMMENDED',
      badgeColor: '#F2C12E',
      description: 'Native Soroban smart contract support, fast transaction signing, and built-in network switcher.',
      logo: (
        <svg className="size-8" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="18" fill="#1E1E2E" />
          <path
            d="M18 7L25 18L18 29L11 18L18 7Z"
            fill="url(#freighter-grad)"
            stroke="#8B5CF6"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="18" cy="18" r="3.5" fill="#F0F0F0" />
          <defs>
            <linearGradient id="freighter-grad" x1="11" y1="7" x2="25" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>
      ),
    },
    {
      name: 'xBull Wallet',
      type: 'Multi-Platform Wallet',
      badge: 'POPULAR',
      badgeColor: '#16A34A',
      description: 'Cross-platform non-custodial Stellar wallet with multi-account management and hardware signer support.',
      logo: (
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
      ),
    },
    {
      name: 'LOBSTR',
      type: 'Mobile & Web Vault',
      badge: 'EASY SETUP',
      badgeColor: '#3B82F6',
      description: 'The most widely used Stellar mobile wallet with integrated multisig security and biometric protection.',
      logo: (
        <svg className="size-8" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="18" fill="#141926" />
          <path
            d="M18 10C13.5 10 10 13.5 10 18C10 22.5 13.5 26 18 26C22.5 26 26 22.5 26 18C26 13.5 22.5 10 18 10Z"
            stroke="#3B82F6"
            strokeWidth="2"
          />
          <path
            d="M18 13V18L21.5 21.5"
            stroke="#60A5FA"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="18" cy="18" r="2" fill="#60A5FA" />
        </svg>
      ),
    },
    {
      name: 'Albedo',
      type: 'Zero-Install Web Signer',
      badge: 'INSTANT WEB',
      badgeColor: '#F59E0B',
      description: 'Zero-install web signer that delegates transaction authorization securely without browser extensions.',
      logo: (
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
      ),
    },
  ]

  return (
    <section className="border-t border-white/[0.08] bg-[#0A0A0E] py-20" id="wallets">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F2C12E]">
              Supported Wallets
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#F0F0F0] sm:text-4xl">
              Connect any Stellar & Soroban wallet.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#9CA3AF]">
            Terminal8 integrates seamlessly with Stellar Wallets Kit, supporting both native Soroban extensions and multi-platform signers.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {wallets.map((wallet) => (
            <div
              key={wallet.name}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#12121A] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/[0.2] hover:bg-[#151520] hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between">
                  {wallet.logo}
                  <span
                    className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider"
                    style={{
                      color: wallet.badgeColor,
                      backgroundColor: `${wallet.badgeColor}18`,
                      border: `1px solid ${wallet.badgeColor}35`,
                    }}
                  >
                    {wallet.badge}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#F0F0F0] group-hover:text-[#F2C12E] transition-colors">
                  {wallet.name}
                </h3>
                <p className="mt-0.5 font-mono text-xs text-[#9CA3AF]">{wallet.type}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#9CA3AF]/90">
                  {wallet.description}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 border-t border-white/[0.06] pt-4 font-mono text-xs text-[#F0F0F0]/80">
                <span className="size-2 rounded-full bg-[#16A34A]" />
                <span>Ready for 1-Click Signing</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
