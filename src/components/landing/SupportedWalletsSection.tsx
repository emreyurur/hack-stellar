

import freighterImg from '../../assets/freighter.jpg'
import lobstrImg from '../../assets/lobstr.jpg'
import xbullImg from '../../assets/xbull.jpg'
import albedoImg from '../../assets/albedo.png'

export function SupportedWalletsSection() {
  const wallets = [
    {
      name: 'Freighter',
      type: 'Browser Extension & Mobile',
      badge: 'RECOMMENDED',
      badgeColor: '#F2C12E',
      description: 'Native Soroban smart contract support, fast transaction signing, and built-in network switcher.',
      logo: <img alt="Freighter" className="size-10 rounded-full object-cover border border-white/10" src={freighterImg} />,
    },
    {
      name: 'xBull Wallet',
      type: 'Multi-Platform Wallet',
      badge: 'POPULAR',
      badgeColor: '#16A34A',
      description: 'Cross-platform non-custodial Stellar wallet with multi-account management and hardware signer support.',
      logo: <img alt="xBull" className="size-10 rounded-full object-cover border border-white/10" src={xbullImg} />,
    },
    {
      name: 'LOBSTR',
      type: 'Mobile & Web Vault',
      badge: 'EASY SETUP',
      badgeColor: '#3B82F6',
      description: 'The most widely used Stellar mobile wallet with integrated multisig security and biometric protection.',
      logo: <img alt="LOBSTR" className="size-10 rounded-full object-cover border border-white/10" src={lobstrImg} />,
    },
    {
      name: 'Albedo',
      type: 'Zero-Install Web Signer',
      badge: 'INSTANT WEB',
      badgeColor: '#F59E0B',
      description: 'Zero-install web signer that delegates transaction authorization securely without browser extensions.',
      logo: <img alt="Albedo" className="size-10 rounded-full object-cover border border-white/10" src={albedoImg} />,
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
