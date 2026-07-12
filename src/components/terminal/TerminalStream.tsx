import { useEffect, useRef } from 'react'
import { getYieldRows, type TerminalLine } from './commandRegistry'

export function TerminalStream({
  className = 'h-64',
  lines,
}: {
  className?: string
  lines: TerminalLine[]
}) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  return (
    <div
      className={`${className} terminal-scroll font-terminal overflow-y-auto rounded-lg border border-white/[0.12] bg-black/40 p-4 text-sm`}
    >
      <div className="space-y-2">
        {lines.map((line) => {
          if (line.kind === 'yield-table') {
            return <YieldTable key={line.id} />
          }

          if (line.kind === 'help') {
            return <HelpBlock key={line.id} />
          }

          const prefix =
            line.kind === 'command'
              ? '>'
              : line.kind === 'success'
                ? '✓'
                : line.kind === 'error'
                  ? '✗'
                  : '·'

          const textColor =
            line.kind === 'success'
              ? 'text-[#16A34A]'
              : line.kind === 'error'
                ? 'text-red-400'
                : line.kind === 'command'
                  ? 'text-[#F2C12E]'
                  : 'text-[#F0F0F0]/80'

          return (
            <div className="flex gap-2.5" key={line.id}>
              <span className={`shrink-0 select-none opacity-60 ${textColor}`}>{prefix}</span>
              <p className={textColor}>{line.text}</p>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>
    </div>
  )
}

function YieldTable() {
  return (
    <div className="overflow-hidden rounded-md border border-white/[0.12]">
      <div className="grid grid-cols-3 bg-white/[0.04] px-3 py-2 text-xs uppercase tracking-[0.12em] text-[#9CA3AF]">
        <span>Protocol</span>
        <span>Asset</span>
        <span>APY</span>
      </div>
      {getYieldRows().map((row) => (
        <div
          className="grid grid-cols-3 border-t border-white/[0.08] px-3 py-2 text-xs"
          key={row.sorobanContract}
        >
          <span className="text-[#F0F0F0]/90">{row.protocol}</span>
          <span className="text-[#F0F0F0]/90">{row.asset}</span>
          <span className="text-[#16A34A]">{row.apy.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

function HelpBlock() {
  const groups = [
    {
      label: 'Positions',
      cmds: [
        { cmd: 'positions', desc: 'List all open positions' },
        { cmd: 'position <n>', desc: 'Show details for position #n' },
        { cmd: 'withdraw <n> [amt]', desc: 'Partial withdrawal from position #n' },
        { cmd: 'withdraw <n> --full', desc: 'Close position #n fully (Freighter tx)' },
      ],
    },
    {
      label: 'DeFi',
      cmds: [
        { cmd: 'pools', desc: 'List pools with APY and trust score' },
        { cmd: 'pool <name>', desc: 'Show pool details — e.g. pool blend' },
        { cmd: 'sweep all', desc: 'Batch swap dust trustlines to USDC' },
        { cmd: 'show yield', desc: 'Show active yield positions table' },
      ],
    },
    {
      label: 'Wallet',
      cmds: [
        { cmd: 'balance', desc: 'Show XLM and USDC balances' },
        { cmd: 'whoami', desc: 'Show connected wallet address' },
        { cmd: 'network', desc: 'Show network and RPC info' },
      ],
    },
    {
      label: 'Terminal',
      cmds: [
        { cmd: 'help', desc: 'Show this help message' },
        { cmd: 'clear', desc: 'Clear terminal output' },
      ],
    },
  ]

  return (
    <div className="space-y-3 rounded-lg border border-[#F2C12E]/25 bg-[#F2C12E]/10 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F2C12E]">
        Command Reference
      </p>
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[#9CA3AF]">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.cmds.map(({ cmd, desc }) => (
              <div className="flex items-baseline gap-3" key={cmd}>
                <code className="w-44 shrink-0 rounded bg-[#12121A] px-2 py-0.5 text-xs text-[#F2C12E]">
                  {cmd}
                </code>
                <span className="text-xs text-[#9CA3AF]">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
