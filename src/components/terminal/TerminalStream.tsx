import { availableCommands, getYieldRows, type TerminalLine } from './commandRegistry'

export function TerminalStream({
  className = 'h-64',
  lines,
}: {
  className?: string
  lines: TerminalLine[]
}) {
  return (
    <div
      className={`${className} overflow-y-auto rounded-lg border border-[#F5F0E8]/10 bg-black/15 p-4 text-sm`}
    >
      <div className="space-y-3">
        {lines.map((line) => {
          if (line.kind === 'yield-table') {
            return <YieldTable key={line.id} />
          }

          if (line.kind === 'help') {
            return <HelpBlock key={line.id} />
          }

          return (
            <p
              className={
                line.kind === 'success'
                  ? 'text-[#4ade80]'
                  : line.kind === 'error'
                    ? 'text-red-300'
                    : line.kind === 'command'
                      ? 'text-[#C8A84B]'
                      : 'text-[#F5F0E8]/80'
              }
              key={line.id}
            >
              {line.kind === 'command' ? '> ' : ''}
              {line.text}
            </p>
          )
        })}
      </div>
    </div>
  )
}

function YieldTable() {
  return (
    <div className="overflow-hidden rounded-md border border-[#F5F0E8]/10">
      <div className="grid grid-cols-3 bg-[#F5F0E8]/5 px-3 py-2 text-xs uppercase tracking-[0.12em] text-[#6B7B6B]">
        <span>Protocol</span>
        <span>Asset</span>
        <span>APY</span>
      </div>
      {getYieldRows().map((row) => (
        <div
          className="grid grid-cols-3 border-t border-[#F5F0E8]/10 px-3 py-2 text-xs"
          key={row.sorobanContract}
        >
          <span>{row.protocol}</span>
          <span>{row.asset}</span>
          <span className="text-[#4ade80]">{row.apy.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

function HelpBlock() {
  return (
    <div className="rounded-md border border-[#C8A84B]/30 bg-[#C8A84B]/10 p-3">
      <p className="mb-2 text-[#C8A84B]">Available deterministic commands</p>
      <div className="flex flex-wrap gap-2">
        {availableCommands.map((command) => (
          <code className="rounded bg-[#0F1F0F] px-2 py-1 text-[#F5F0E8]" key={command}>
            {command}
          </code>
        ))}
      </div>
    </div>
  )
}
