import { useEffect, useRef, useState } from 'react'
import { truncatePublicKey } from '../../lib/format'
import { useWallet } from '../../context/useWallet'
import type { WalletErrorType } from '../../context/WalletContext'

type HeaderProps = {
  activePage: 'home' | 'docs'
  onPageChange: (page: 'home' | 'docs') => void
}

const navItems: HeaderProps['activePage'][] = ['home', 'docs']

const ERROR_ICONS: Record<WalletErrorType, string> = {
  wallet_not_found: '⬛',
  user_rejected: '✕',
  insufficient_balance: '◎',
  unknown: '!',
}

const ERROR_LABELS: Record<WalletErrorType, string> = {
  wallet_not_found: 'Wallet not found',
  user_rejected: 'Rejected by user',
  insufficient_balance: 'Insufficient balance',
  unknown: 'Connection error',
}

export function Header({ activePage, onPageChange }: HeaderProps) {
  const { connect, error, errorType, publicKey, reset, status } = useWallet()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const connected = status === 'CONNECTED' && publicKey

  useEffect(() => {
    if (!accountMenuOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [accountMenuOpen])

  const handleWalletClick = () => {
    if (connected) {
      setAccountMenuOpen((current) => !current)
      return
    }

    void connect()
  }

  const handleDisconnect = () => {
    void reset()
    setAccountMenuOpen(false)
  }

  return (
    <header className="relative border-b border-[#C8A84B]/45 bg-[#071C09] px-5 sm:px-8">
      <div className="mx-auto flex min-h-17 max-w-[1440px] flex-col gap-4 py-4 lg:grid lg:grid-cols-[220px_1fr_220px] lg:items-center lg:py-0">
        <button
          className="flex w-fit items-center gap-3 text-left"
          onClick={() => onPageChange('home')}
          type="button"
        >
          <span
            className="leading-none text-[#F5F0E8]"
            style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em' }}
          >
            TERMINAL<span style={{ color: '#C8A84B', fontSize: '30px', verticalAlign: '-2px' }}>8</span>
          </span>
        </button>

        <nav className="flex flex-wrap items-center justify-start gap-2 lg:justify-center lg:gap-7">
          {navItems.map((page) => (
            <button
              aria-pressed={activePage === page}
              className={`relative h-17 px-2 text-xs font-semibold uppercase tracking-[0.38em] transition ${
                activePage === page ? 'text-[#C8A84B]' : 'text-[#F5F0E8] hover:text-[#C8A84B]'
              }`}
              key={page}
              onClick={() => onPageChange(page)}
              type="button"
            >
              <span className="inline-flex items-center gap-2">{page}</span>
              {activePage === page ? (
                <span className="absolute inset-x-0 bottom-0 h-px bg-[#C8A84B]" />
              ) : null}
            </button>
          ))}
        </nav>

        <div className="flex justify-start lg:justify-end">
          <div className="relative" ref={accountMenuRef}>
            <button
              aria-expanded={accountMenuOpen}
              className="inline-flex min-w-27 items-center justify-center gap-2 border border-[#C8A84B]/50 bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#F5F0E8] transition hover:border-[#C8A84B] hover:text-[#C8A84B] focus:outline-none focus:ring-2 focus:ring-[#C8A84B]/60"
              disabled={status === 'CONNECTING'}
              onClick={handleWalletClick}
              type="button"
            >
              <span className="relative flex size-2 shrink-0 items-center justify-center">
                {connected ? (
                  <>
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#4ade80] opacity-50" />
                    <span className="relative inline-flex size-2 rounded-full bg-[#4ade80]" />
                  </>
                ) : (
                  <span
                    className={`inline-flex size-2 rounded-full ${status === 'ERROR' ? 'bg-red-400' : 'bg-[#6B7B6B]/40'}`}
                  />
                )}
              </span>
              {status === 'CONNECTING'
                ? 'Connecting...'
                : connected
                  ? truncatePublicKey(publicKey)
                  : 'Connect Wallet'}
            </button>

            {connected && accountMenuOpen ? (
              <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[#C8A84B]/25 bg-[#F5F0E8] shadow-2xl">
                <div className="border-b border-[#6B7B6B]/15 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#6B7B6B]">
                    Connected wallet
                  </p>
                  <p className="mt-2 break-all text-sm font-medium text-[#1A2E1A]">{publicKey}</p>
                </div>
                <div className="border-b border-[#6B7B6B]/15 p-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[#6B7B6B]">
                    Supported wallets
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Freighter', 'xBull', 'LOBSTR', 'Albedo'].map((w) => (
                      <span
                        key={w}
                        className="rounded-md border border-[#6B7B6B]/20 bg-white/60 px-2 py-1 text-center text-xs font-medium text-[#1A2E1A]"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-[#1A2E1A] transition hover:bg-[#C8A84B]/15"
                  onClick={handleDisconnect}
                  type="button"
                >
                  Disconnect
                  <span className="text-[#6B7B6B]">Esc</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Wallet not connected — show available wallets hint */}
      {status === 'DISCONNECTED' ? (
        <div className="border-t border-[#C8A84B]/10 bg-[#071C09] px-0 py-2">
          <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-0">
            <span className="text-xs text-[#6B7B6B]">Supported wallets:</span>
            {['Freighter', 'xBull', 'LOBSTR', 'Albedo'].map((w) => (
              <span
                key={w}
                className="rounded border border-[#C8A84B]/20 bg-[#C8A84B]/5 px-2 py-0.5 text-xs text-[#C8A84B]/80"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Error banner with typed error display */}
      {error && errorType ? (
        <div className="border-t border-red-500/20 bg-[#071C09] px-0 py-0">
          <div
            className={`mx-auto max-w-[1440px] rounded-lg border px-4 py-3 text-sm lg:mt-2 lg:max-w-sm lg:ml-auto ${
              errorType === 'wallet_not_found'
                ? 'border-orange-400/30 bg-orange-50/10 text-orange-200'
                : errorType === 'user_rejected'
                  ? 'border-yellow-400/30 bg-yellow-50/10 text-yellow-200'
                  : errorType === 'insufficient_balance'
                    ? 'border-red-400/30 bg-red-50/10 text-red-200'
                    : 'border-[#C8A84B]/35 bg-[#F5F0E8]/5 text-[#F5F0E8]'
            }`}
          >
            <p className="font-semibold">
              {ERROR_ICONS[errorType]} {ERROR_LABELS[errorType]}
            </p>
            <p className="mt-1 text-xs opacity-80">{error}</p>
          </div>
        </div>
      ) : null}
    </header>
  )
}
