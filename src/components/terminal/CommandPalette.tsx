import { useEffect, useRef, useState, type FormEvent } from 'react'
import { availableCommands, runDeterministicCommand } from './commandRegistry'
import type { TerminalLine } from './commandRegistry'
import { TerminalStream } from './TerminalStream'

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
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!input.trim()) {
      return
    }

    onSubmitLines([
      {
        id: `command-${Date.now()}`,
        kind: 'command',
        text: input,
      },
      ...runDeterministicCommand(input),
    ])
    setInput('')
  }

  if (!open) {
    return null
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1F0F]/45 px-4 backdrop-blur-md"
      role="dialog"
    >
      <button
        aria-label="Close command palette"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <section className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-[#F5F0E8]/15 bg-[#0F1F0F]/95 text-[#F5F0E8] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F5F0E8]/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#C8A84B]">
              Deterministic Command Palette
            </p>
            <h2 className="mt-1 text-xl font-semibold">Stellar operations</h2>
          </div>
          <button
            aria-label="Close command palette"
            className="rounded-md border border-[#F5F0E8]/10 px-2 py-1 text-sm transition hover:border-[#C8A84B]/70 hover:text-[#C8A84B]"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>
        <form className="border-b border-[#F5F0E8]/10 p-5" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="command-input">
            Deterministic terminal command
          </label>
          <input
            ref={inputRef}
            autoComplete="off"
            className="w-full bg-transparent text-xl text-[#F5F0E8] outline-none placeholder:text-[#6B7B6B]"
            id="command-input"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type help, sweep all, or show yield"
            value={input}
          />
        </form>
        <div className="grid gap-4 p-5">
          <TerminalStream className="max-h-72 min-h-56" lines={lines} />
          <p className="text-xs uppercase tracking-[0.18em] text-[#C8A84B]">Hardcoded commands</p>
          <div className="flex flex-wrap gap-2">
            {availableCommands.map((command) => (
              <button
                className="rounded-md border border-[#F5F0E8]/10 px-3 py-2 text-sm text-[#F5F0E8] transition hover:border-[#C8A84B]/70 hover:text-[#C8A84B]"
                key={command}
                onClick={() => setInput(command)}
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

export function BottomTerminal({
  lines,
  onClose,
  onOpen,
  onRunCommand,
  open,
}: {
  lines: TerminalLine[]
  onClose: () => void
  onOpen: () => void
  onRunCommand: (lines: TerminalLine[]) => void
  open: boolean
}) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!input.trim()) {
      return
    }

    onRunCommand([
      {
        id: `command-${Date.now()}`,
        kind: 'command',
        text: input,
      },
      ...runDeterministicCommand(input),
    ])
    setInput('')
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
        <span className="text-xs text-[#6B7B6B]">Open</span>
      </button>
    )
  }

  return (
    <section className="fixed inset-x-0 bottom-0 z-40 border-t border-[#6B7B6B]/25 bg-[#0F1F0F] text-[#F5F0E8] shadow-2xl">
      <div className="flex h-10 items-center justify-between border-b border-[#F5F0E8]/10 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="h-10 border-t-2 border-[#C8A84B] px-1 pt-2 text-sm font-medium">
            Terminal
          </span>
          <span className="hidden text-xs text-[#6B7B6B] sm:inline">
            Deterministic command stream
          </span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="rounded border border-[#F5F0E8]/10 px-2 py-1 text-xs text-[#6B7B6B]">
            Cmd J
          </kbd>
          <button
            aria-label="Close terminal panel"
            className="rounded-md border border-[#F5F0E8]/10 px-2 py-1 text-sm text-[#F5F0E8] transition hover:border-[#C8A84B]/70 hover:text-[#C8A84B]"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>
      </div>
      <div className="mx-auto grid max-w-[1440px] gap-3 px-4 py-3 sm:px-6">
        <TerminalStream className="h-52 sm:h-60" lines={lines} />
        <form
          className="flex h-10 items-center gap-2 rounded-lg border border-[#F5F0E8]/10 bg-black/15 px-3"
          onSubmit={handleSubmit}
        >
          <span className="text-[#4ade80]">$</span>
          <input
            ref={inputRef}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#6B7B6B]"
            onChange={(event) => setInput(event.target.value)}
            placeholder="/sweep"
            value={input}
          />
        </form>
      </div>
    </section>
  )
}
