import { useCallback, useEffect, useState } from 'react'
import { DefiOperations } from './components/dashboard/DefiOperations'
import { Header } from './components/dashboard/Header'
import { WalletOperations } from './components/dashboard/WalletOperations'
import { BottomTerminal, CommandPalette } from './components/terminal/CommandPalette'
import type { TerminalLine } from './components/terminal/commandRegistry'
import { WalletProvider } from './context/WalletContext'

type AppView = 'wallet' | 'defi'
type AppPage = 'home' | 'docs'

const views: { id: AppView; label: string; description: string }[] = [
  {
    id: 'wallet',
    label: 'Wallet',
    description: 'Balances, trustlines, and batch swap flow',
  },
  {
    id: 'defi',
    label: 'DeFi',
    description: 'Soroban positions and staking flow',
  },
]

const initialLines: TerminalLine[] = [
  {
    id: 'boot-1',
    kind: 'log',
    text: 'Soroban RPC ready. Deterministic command registry loaded.',
  },
  {
    id: 'boot-2',
    kind: 'log',
    text: 'Type help, sweep all, or show yield. No AI runtime attached.',
  },
]

function App() {
  const [activePage, setActivePage] = useState<AppPage>('home')
  const [activeView, setActiveView] = useState<AppView>('wallet')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(true)
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(initialLines)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((current) => !current)
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault()
        setTerminalOpen((current) => !current)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const appendLines = useCallback((lines: TerminalLine[]) => {
    setTerminalLines((current) => [...current, ...lines])
    setTerminalOpen(true)
  }, [])

  return (
    <WalletProvider>
      <div className="min-h-screen bg-[#F5F0E8] text-[#1A2E1A]">
        <Header activePage={activePage} onPageChange={setActivePage} />
        <main
          className={`mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 ${
            terminalOpen ? 'pb-88' : 'pb-20'
          }`}
        >
          {activePage === 'home' ? (
            <>
              <div className="mb-6 flex flex-col gap-4 rounded-xl border border-[#6B7B6B]/20 bg-white/35 p-2 sm:flex-row">
                {views.map((view) => (
                  <button
                    aria-pressed={activeView === view.id}
                    className={`flex-1 rounded-lg px-4 py-3 text-left transition ${
                      activeView === view.id
                        ? 'bg-[#1A2E1A] text-[#F5F0E8]'
                        : 'text-[#6B7B6B] hover:bg-white/45 hover:text-[#1A2E1A]'
                    }`}
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    type="button"
                  >
                    <span className="block text-base font-semibold">{view.label}</span>
                    <span
                      className={`mt-1 block text-xs ${
                        activeView === view.id ? 'text-[#F5F0E8]/65' : 'text-[#6B7B6B]'
                      }`}
                    >
                      {view.description}
                    </span>
                  </button>
                ))}
              </div>

              {activeView === 'wallet' ? <WalletOperations /> : <DefiOperations />}
            </>
          ) : (
            <section className="rounded-xl border border-[#6B7B6B]/20 bg-white/45 p-8">
              <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">Docs</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#1A2E1A]">Documentation</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#6B7B6B]">
                This section is reserved for the next hackathon milestone.
              </p>
            </section>
          )}
        </main>
        <CommandPalette
          lines={terminalLines}
          onClose={() => setPaletteOpen(false)}
          onSubmitLines={appendLines}
          open={paletteOpen}
        />
        <BottomTerminal
          lines={terminalLines}
          onClose={() => setTerminalOpen(false)}
          onOpen={() => setTerminalOpen(true)}
          onRunCommand={appendLines}
          open={terminalOpen}
        />
      </div>
    </WalletProvider>
  )
}

export default App
