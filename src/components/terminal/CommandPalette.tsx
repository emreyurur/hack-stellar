import { useEffect, useRef, useState } from 'react'
import { availableCommands, runCommand, type CommandContext, type TerminalLine } from './commandRegistry'
import { TerminalStream } from './TerminalStream'

// ─── Command Palette (Cmd+K modal) ───────────────────────────────────────────

type CommandPaletteProps = {
  lines: TerminalLine[]
  open: boolean
  onClose: () => void
  onSubmitLines: (lines: TerminalLine[]) => void
}

export function CommandPalette({ lines, open, onClose, onSubmitLines }: CommandPaletteProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, open])

  const handleSubmit = (event: { preventDefault(): void }) => {
    event.preventDefault()
    if (!input.trim()) return
    onSubmitLines([{ id: `cmd-${Date.now()}`, kind: 'command', text: input }])
    setInput('')
    onClose()
  }

  if (!open) return null

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1F0F]/45 px-4 backdrop-blur-md"
      role="dialog"
    >
      <button aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} type="button" />
      <section className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-[#F5F0E8]/15 bg-[#0F1F0F]/95 text-[#F5F0E8] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F5F0E8]/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#C8A84B]">Command Palette</p>
            <h2 className="mt-1 text-xl font-semibold">Stellar operations</h2>
          </div>
          <button
            aria-label="Close"
            className="rounded-md border border-[#F5F0E8]/10 px-2.5 py-1 text-sm transition duration-150 hover:border-[#C8A84B]/70 hover:text-[#C8A84B]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <form className="border-b border-[#F5F0E8]/10 p-5" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            autoComplete="off"
            className="w-full bg-transparent font-terminal text-xl text-[#F5F0E8] outline-none placeholder:text-[#6B7B6B]"
            onChange={(e) => setInput(e.target.value)}
            placeholder="positions · withdraw 1 --full · pools · help"
            value={input}
          />
        </form>
        <div className="grid gap-4 p-5">
          <TerminalStream className="max-h-72 min-h-56" lines={lines} />
          <div className="flex flex-wrap gap-2">
            {availableCommands.slice(0, 8).map((command) => (
              <button
                className="rounded-md border border-[#F5F0E8]/10 px-3 py-1.5 font-terminal text-xs text-[#F5F0E8]/70 transition hover:border-[#C8A84B]/70 hover:text-[#C8A84B]"
                key={command}
                onClick={() => setInput(command.split(' ')[0] + (command.includes('<') ? ' ' : ''))}
                type="button"
              >
                {command}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Bottom Terminal ──────────────────────────────────────────────────────────

export function BottomTerminal({
  commandContext,
  lines,
  onClear,
  onClose,
  onOpen,
  onRunCommand,
  open,
}: {
  commandContext: CommandContext | null
  lines: TerminalLine[]
  onClear: () => void
  onClose: () => void
  onOpen: () => void
  onRunCommand: (lines: TerminalLine[]) => void
  open: boolean
}) {
  const [input, setInput] = useState('')
  const [executing, setExecuting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  const handleSubmit = async (event: { preventDefault(): void }) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || executing) return

    setInput('')

    // Handle clear locally
    if (trimmed.toLowerCase() === 'clear') {
      onClear()
      return
    }

    // Echo the command
    onRunCommand([{ id: `cmd-${Date.now()}`, kind: 'command', text: trimmed }])

    if (!commandContext) {
      onRunCommand([{ id: `err-${Date.now()}`, kind: 'error', text: 'Terminal context not available.' }])
      return
    }

    setExecuting(true)
    try {
      await runCommand(
        trimmed,
        commandContext,
        (line) => onRunCommand([line]),
      )
    } finally {
      setExecuting(false)
    }
  }

  if (!open) {
    return (
      <button
        className="fixed inset-x-0 bottom-0 z-40 flex h-10 items-center justify-between border-t border-[#6B7B6B]/20 bg-[#0F1F0F] px-5 text-left text-sm text-[#F5F0E8] transition hover:bg-[#1A2E1A] sm:px-8"
        onClick={onOpen}
        type="button"
      >
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#4ade80]" />
          Terminal
        </span>
        <span className="font-terminal text-xs text-[#6B7B6B]">Open</span>
      </button>
    )
  }

  return (
    <section className="fixed inset-x-0 bottom-0 z-40 border-t border-[#6B7B6B]/25 bg-[#0F1F0F] text-[#F5F0E8] shadow-2xl">
      {/* Tab bar */}
      <div className="flex h-10 items-center justify-between border-b border-[#F5F0E8]/10 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <span className="border-t-2 border-[#C8A84B] px-1 pt-2 font-terminal text-xs font-semibold text-[#F5F0E8]">
            Terminal
          </span>
          {executing && (
            <span className="flex items-center gap-1.5 text-xs text-[#C8A84B]">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-[#C8A84B]" />
              executing…
            </span>
          )}
          {!executing && (
            <span className="hidden font-terminal text-xs text-[#6B7B6B] sm:inline">
              {commandContext?.status === 'CONNECTED'
                ? `${commandContext.positions.length} position${commandContext.positions.length !== 1 ? 's' : ''} open`
                : 'wallet not connected'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <kbd className="rounded border border-[#F5F0E8]/10 px-2 py-1 font-terminal text-xs text-[#6B7B6B]">
            Cmd J
          </kbd>
          <button
            aria-label="Close terminal"
            className="rounded-md border border-[#F5F0E8]/10 px-2.5 py-1 text-sm transition duration-150 hover:border-[#C8A84B]/70 hover:text-[#C8A84B]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
      </div>

      {/* Stream + input */}
      <div className="mx-auto grid max-w-[1440px] gap-3 px-4 py-3 sm:px-6">
        <TerminalStream className="h-52 sm:h-60" lines={lines} />
        <form
          className={`flex h-10 items-center gap-2 rounded-lg border bg-black/15 px-3 transition-colors duration-150 ${
            executing
              ? 'border-[#C8A84B]/25'
              : 'border-[#F5F0E8]/10 focus-within:border-[#C8A84B]/35'
          }`}
          onSubmit={handleSubmit}
        >
          <span className={`font-terminal text-sm ${executing ? 'text-[#C8A84B]' : 'text-[#4ade80]'}`}>
            {executing ? '⟳' : '$'}
          </span>
          <input
            ref={inputRef}
            className="min-w-0 flex-1 bg-transparent font-terminal text-sm outline-none placeholder:text-[#6B7B6B]"
            disabled={executing}
            onChange={(e) => setInput(e.target.value)}
            placeholder={executing ? '' : 'positions · withdraw 1 --full · pools · help'}
            value={input}
          />
          {input && !executing && (
            <kbd className="shrink-0 rounded border border-[#F5F0E8]/10 px-1.5 py-0.5 font-terminal text-[10px] text-[#6B7B6B]">
              ↵
            </kbd>
          )}
        </form>
      </div>
    </section>
  )
}
