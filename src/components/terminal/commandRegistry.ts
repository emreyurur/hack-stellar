import { reputationLabel, reputationTotal, stellarPools, yieldPositions } from '../../data/stellarMock'
import { executeMockTestnetWithdraw } from '../../services/mockTestnetWithdraw'
import type { LocalPosition } from '../../types/stellar'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TerminalLine =
  | { id: string; kind: 'log' | 'success' | 'error' | 'command'; text: string }
  | { id: string; kind: 'yield-table' }
  | { id: string; kind: 'help' }

export type CommandContext = {
  networkPassphrase: string | null
  networkUrl: string | null
  positions: LocalPosition[]
  publicKey: string | null
  status: string
  xlmBalance: number
  usdcBalance: number
  onWithdrawn: (id: string, amount: number) => void
}

type Emit = (line: TerminalLine) => void
type Handler = (args: string[], ctx: CommandContext, emit: Emit) => void | Promise<void>

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => `l-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`
const log = (text: string, emit: Emit) => emit({ id: uid(), kind: 'log', text })
const ok  = (text: string, emit: Emit) => emit({ id: uid(), kind: 'success', text })
const err = (text: string, emit: Emit) => emit({ id: uid(), kind: 'error', text })

function pad(s: string, w: number) {
  const str = String(s)
  return str.length >= w ? str.slice(0, w - 1) + '…' : str.padEnd(w)
}

function formatElapsed(ms: number) {
  const m = Math.floor(ms / 60_000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// ─── Commands ─────────────────────────────────────────────────────────────────

const commands: Record<string, Handler> = {

  help: (_, __, emit) => {
    emit({ id: uid(), kind: 'help' })
  },

  positions: (_, ctx, emit) => {
    if (ctx.status !== 'CONNECTED') {
      err('Not connected — click Connect in the header.', emit)
      return
    }
    if (ctx.positions.length === 0) {
      log('No open positions. Supply to a pool from the UI.', emit)
      return
    }
    log(`  ${pad('#', 3)}${pad('Protocol', 20)}${pad('Asset', 6)}${pad('Staked', 10)}${pad('APY', 7)}${pad('Earned', 13)}Age`, emit)
    log(`  ${'─'.repeat(66)}`, emit)
    ctx.positions.forEach((pos, i) => {
      const hours = (Date.now() - pos.openedAt) / 3_600_000
      const earned = pos.amount * (pos.apy / 100) * (hours / 8_760)
      ok(
        `  ${pad(String(i + 1), 3)}${pad(pos.protocol, 20)}${pad(pos.asset, 6)}${pad(pos.amount.toFixed(2), 10)}${pad(pos.apy.toFixed(1) + '%', 7)}${pad('+' + earned.toFixed(4), 13)}${formatElapsed(Date.now() - pos.openedAt)}`,
        emit,
      )
    })
  },

  position: ([n], ctx, emit) => {
    const idx = Number(n) - 1
    if (!n || isNaN(idx) || idx < 0) { err('Usage: position <n>', emit); return }
    const pos = ctx.positions[idx]
    if (!pos) { err(`No position #${n}. Run: positions`, emit); return }
    const hours = (Date.now() - pos.openedAt) / 3_600_000
    const earned = pos.amount * (pos.apy / 100) * (hours / 8_760)
    log(`  Protocol   ${pos.protocol}`, emit)
    log(`  Category   ${pos.category}`, emit)
    log(`  Staked     ${pos.amount.toFixed(2)} ${pos.asset}`, emit)
    log(`  APY        ${pos.apy.toFixed(1)}%`, emit)
    ok(`  Earned     +${earned.toFixed(4)} ${pos.asset} (est.)`, emit)
    log(`  Duration   ${formatElapsed(Date.now() - pos.openedAt)}`, emit)
    log(`  Opened     ${pos.timestamp}`, emit)
    log(`  TX         ${pos.id.startsWith('demo-') ? 'demo position' : pos.hash}`, emit)
  },

  withdraw: async ([n, amt], ctx, emit) => {
    const idx = Number(n) - 1
    if (!n || isNaN(idx) || idx < 0) {
      err('Usage:  withdraw <n> [amount]    partial withdrawal', emit)
      err('        withdraw <n> --full       close position', emit)
      return
    }
    const pos = ctx.positions[idx]
    if (!pos) { err(`No position #${n}. Run: positions`, emit); return }
    if (ctx.status !== 'CONNECTED') { err('Not connected.', emit); return }
    if (!ctx.publicKey || !ctx.networkUrl || !ctx.networkPassphrase) {
      err('Missing wallet context — reconnect Freighter.', emit); return
    }
    if (!ctx.networkPassphrase.toLowerCase().includes('test')) {
      err('Switch Freighter to Testnet for demo withdrawals.', emit); return
    }

    const isFull = !amt || amt === '--full'
    const withdrawAmt = isFull ? pos.amount : Math.min(Number(amt), pos.amount)

    if (!isFull && (isNaN(Number(amt)) || Number(amt) <= 0)) {
      err(`Invalid amount: "${amt}"`, emit); return
    }

    log(`Initiating ${isFull ? 'full' : 'partial'} withdrawal`, emit)
    log(`  ${withdrawAmt.toFixed(2)} ${pos.asset} from ${pos.protocol}`, emit)
    log('Building transaction...', emit)
    log('Requesting Freighter signature — approve in your wallet extension.', emit)

    try {
      const result = await executeMockTestnetWithdraw({
        amount: withdrawAmt,
        asset: pos.asset,
        horizonUrl: ctx.networkUrl,
        networkPassphrase: ctx.networkPassphrase,
        publicKey: ctx.publicKey,
      })
      ok(`Transaction confirmed`, emit)
      ok(`  ${result.hash}`, emit)
      ctx.onWithdrawn(pos.id, withdrawAmt)
      if (isFull || withdrawAmt >= pos.amount) {
        ok(`Position #${n} closed.`, emit)
      } else {
        ok(`Position #${n} updated — ${(pos.amount - withdrawAmt).toFixed(2)} ${pos.asset} remaining.`, emit)
      }
    } catch (e) {
      err(e instanceof Error ? e.message : 'Withdrawal failed.', emit)
    }
  },

  pools: (_, __, emit) => {
    log(`  ${pad('Pool', 30)}${pad('APY', 7)}${pad('TVL', 8)}${pad('Score', 13)}Risk`, emit)
    log(`  ${'─'.repeat(65)}`, emit)
    stellarPools.forEach(pool => {
      const score = reputationTotal(pool.reputation)
      const label = reputationLabel(score)
      const name = pool.secondaryAsset
        ? `${pool.protocol} ${pool.asset}/${pool.secondaryAsset}`
        : `${pool.protocol} ${pool.asset}`
      ok(`  ${pad(name, 30)}${pad(pool.apy.toFixed(1) + '%', 7)}${pad(pool.tvl, 8)}${pad(score + ' ' + label, 13)}${pool.risk}`, emit)
    })
  },

  pool: ([name], _, emit) => {
    if (!name) { err('Usage: pool <name>  — e.g. pool blend', emit); return }
    const match = stellarPools.find(p =>
      p.id.includes(name.toLowerCase()) ||
      p.protocol.toLowerCase().includes(name.toLowerCase()) ||
      p.asset.toLowerCase() === name.toLowerCase(),
    )
    if (!match) { err(`Not found: "${name}". Run: pools`, emit); return }
    const score = reputationTotal(match.reputation)
    log(`  ${match.protocol} — ${match.asset}${match.secondaryAsset ? '/' + match.secondaryAsset : ''}`, emit)
    log(`  Category    ${match.category}`, emit)
    log(`  APY         ${match.apy.toFixed(1)}%`, emit)
    log(`  TVL         ${match.tvl}`, emit)
    if (match.utilization !== undefined) log(`  Utilization ${match.utilization}%`, emit)
    if (match.volume24h) log(`  24h Volume  ${match.volume24h}`, emit)
    log(`  Risk        ${match.risk}`, emit)
    ok(`  Score       ${score}/100 — ${reputationLabel(score)}`, emit)
    log(`  Method      ${match.method}`, emit)
    log(`  Contract    ${match.contractId}`, emit)
  },

  balance: (_, ctx, emit) => {
    if (ctx.status !== 'CONNECTED') { err('Not connected.', emit); return }
    log(`  XLM     ${ctx.xlmBalance.toFixed(7)}`, emit)
    ok(`  USDC    ${ctx.usdcBalance.toFixed(7)}`, emit)
  },

  whoami: (_, ctx, emit) => {
    if (!ctx.publicKey) { err('Not connected — click Connect in the header.', emit); return }
    ok(`  ${ctx.publicKey}`, emit)
    log(`  Network  ${ctx.networkPassphrase?.includes('Test') ? 'TESTNET' : 'PUBLIC'}`, emit)
  },

  network: (_, ctx, emit) => {
    if (ctx.status !== 'CONNECTED') { err('Not connected.', emit); return }
    log(`  Status       CONNECTED`, emit)
    log(`  Network      ${ctx.networkPassphrase?.includes('Test') ? 'TESTNET' : 'PUBLIC'}`, emit)
    log(`  Passphrase   ${ctx.networkPassphrase ?? '—'}`, emit)
    log(`  Horizon      ${ctx.networkUrl ?? '—'}`, emit)
  },

  'sweep all': (_, ctx, emit) => {
    if (ctx.status !== 'CONNECTED') { err('Not connected.', emit); return }
    log('Scanning trustlines via Horizon...', emit)
    log('Building PathPaymentStrictReceive batch with XLM bridge.', emit)
    log('Applying fee bump envelope, requesting Freighter signature.', emit)
    ok('Dust consolidated into USDC.', emit)
  },

  'show yield': (_, __, emit) => {
    emit({ id: uid(), kind: 'yield-table' })
  },
}

// ─── Aliases ──────────────────────────────────────────────────────────────────

const aliases: Record<string, string> = {
  '/help': 'help',
  '/positions': 'positions',
  '/pos': 'positions',
  'ls': 'positions',
  '/position': 'position',
  '/withdraw': 'withdraw',
  'w': 'withdraw',
  '/pools': 'pools',
  '/pool': 'pool',
  '/balance': 'balance',
  '/whoami': 'whoami',
  '/network': 'network',
  '/sweep': 'sweep all',
  '/yield': 'show yield',
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const availableCommands = [
  'positions', 'position <n>', 'withdraw <n> [amt|--full]',
  'pools', 'pool <name>', 'balance', 'whoami', 'network',
  'sweep all', 'show yield', 'help', 'clear',
]

export function getYieldRows() {
  return yieldPositions
}

export async function runCommand(
  raw: string,
  ctx: CommandContext,
  emit: Emit,
): Promise<void> {
  const trimmed = raw.trim()
  const lower = trimmed.toLowerCase()
  const parts = lower.split(/\s+/)

  // 1. Try exact multi-word match ("sweep all", "show yield")
  let handler = commands[lower]
  let handlerArgs: string[] = []

  // 2. Try alias on full string
  if (!handler) {
    const resolved = aliases[lower]
    if (resolved) handler = commands[resolved]
  }

  // 3. Try first-word + args ("withdraw 1 50", "position 2")
  if (!handler) {
    const cmd = parts[0]
    const resolved = aliases[cmd] ?? cmd
    handler = commands[resolved]
    handlerArgs = parts.slice(1)
  }

  if (!handler) {
    emit({ id: uid(), kind: 'error', text: `Unknown command: "${trimmed}". Type help.` })
    return
  }

  await handler(handlerArgs, ctx, emit)
}
