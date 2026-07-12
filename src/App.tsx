import { useCallback, useEffect, useMemo, useState } from 'react'
import { DefiOperations } from './components/dashboard/DefiOperations'
import { Header } from './components/dashboard/Header'
import { RiskQuiz } from './components/dashboard/RiskQuiz'
import { DocsPage } from './components/docs/DocsPage'
import { LandingPage } from './components/landing/LandingPage'
import { BottomTerminal, CommandPalette } from './components/terminal/CommandPalette'
import type { CommandContext, TerminalLine } from './components/terminal/commandRegistry'
import { WalletProvider } from './context/WalletContext'
import { useWallet } from './context/useWallet'
import { useWalletBalances } from './hooks/useWalletBalances'
import { demoPositions } from './data/stellarMock'
import type { LocalPosition, RiskProfile } from './types/stellar'

export type AppPage = 'landing' | 'home' | 'docs'

const initialLines: TerminalLine[] = [
  { id: 'boot-1', kind: 'log', text: 'Soroban RPC ready. Type help for commands.' },
  { id: 'boot-2', kind: 'log', text: 'positions · withdraw <n> --full · pools · balance' },
]

function AppInner() {
  const { networkPassphrase, networkUrl, publicKey, status } = useWallet()
  const { balances } = useWalletBalances()

  const [activePage, setActivePage] = useState<AppPage>('landing')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(initialLines)
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>('Moderate')
  const [showQuiz, setShowQuiz] = useState(false)
  const [localPositions, setLocalPositions] = useState<LocalPosition[]>(demoPositions)

  useEffect(() => {
    let lastCtrlKTime = 0
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        lastCtrlKTime = Date.now()
        setPaletteOpen((v) => !v)
      }
      if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') ||
        (e.key.toLowerCase() === 'j' && Date.now() - lastCtrlKTime < 1500)
      ) {
        e.preventDefault()
        setTerminalOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const appendLines = useCallback((lines: TerminalLine[]) => {
    setTerminalLines((current) => [...current, ...lines])
    setTerminalOpen(true)
  }, [])

  const handleWithdrawn = useCallback((id: string, withdrawnAmount: number) => {
    setLocalPositions((current) => {
      const pos = current.find((p) => p.id === id)
      if (!pos) return current
      if (withdrawnAmount >= pos.amount) return current.filter((p) => p.id !== id)
      return current.map((p) => (p.id === id ? { ...p, amount: p.amount - withdrawnAmount } : p))
    })
  }, [])

  const handlePositionAdded = useCallback((pos: Omit<LocalPosition, 'id'>) => {
    setLocalPositions((current) => [{ ...pos, id: `${pos.hash}-${Date.now()}` }, ...current])
  }, [])

  const xlmBalance = Number(balances.find((b) => b.code === 'XLM')?.balance ?? 0)
  const usdcBalance = Number(balances.find((b) => b.code === 'USDC')?.balance ?? 0)

  const commandContext = useMemo<CommandContext>(
    () => ({
      networkPassphrase,
      networkUrl,
      positions: localPositions,
      publicKey,
      status,
      xlmBalance,
      usdcBalance,
      onWithdrawn: handleWithdrawn,
    }),
    [networkPassphrase, networkUrl, localPositions, publicKey, status, xlmBalance, usdcBalance, handleWithdrawn],
  )

  if (activePage === 'landing') {
    return (
      <LandingPage
        onLaunch={() => setActivePage('home')}
        onOpenDocs={() => setActivePage('docs')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0E] text-[#F0F0F0]">
      <Header
        activePage={activePage}
        onPageChange={setActivePage}
        onToggleTerminal={() => setTerminalOpen(true)}
      />

      <main
        className={`mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 ${
          terminalOpen ? 'pb-88' : 'pb-20'
        }`}
      >
        {activePage === 'home' ? (
          <div className="space-y-6">
            <DefiOperations
              onPositionAdded={handlePositionAdded}
              onRetakeQuiz={() => setShowQuiz(true)}
              onWithdrawn={handleWithdrawn}
              positions={localPositions}
              riskProfile={riskProfile}
              usdcBalance={usdcBalance}
              xlmBalance={xlmBalance}
            />
          </div>
        ) : (
          <DocsPage />
        )}
      </main>

      {showQuiz && (
        <RiskQuiz
          onComplete={(profile) => { setRiskProfile(profile); setShowQuiz(false) }}
          onSkip={() => { setRiskProfile('Moderate'); setShowQuiz(false) }}
        />
      )}

      <CommandPalette
        lines={terminalLines}
        onClose={() => setPaletteOpen(false)}
        onSubmitLines={appendLines}
        open={paletteOpen}
      />
      <BottomTerminal
        commandContext={commandContext}
        lines={terminalLines}
        onClear={() => setTerminalLines([])}
        onClose={() => setTerminalOpen(false)}
        onOpen={() => setTerminalOpen(true)}
        onRunCommand={appendLines}
        open={terminalOpen}
      />
    </div>
  )
}

function App() {
  return (
    <WalletProvider>
      <AppInner />
    </WalletProvider>
  )
}

export default App
