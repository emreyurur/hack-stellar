import { useState } from 'react'
import type { PoolsState } from '../../hooks/usePools'
import type { DeFiPool, RiskProfile } from '../../types/stellar'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'apy' | 'tvl' | 'fee'
type SortDir = 'asc' | 'desc'
type FilterTab = 'all' | 'xlm' | 'stables'

const STABLE_CODES = new Set(['USDC', 'EURC', 'MZAR', 'USDT', 'TUSD', 'DAI', 'USDW'])

// ─── Token Avatar ─────────────────────────────────────────────────────────────

const TOKEN_COLORS: Record<string, string> = {
  XLM:  '#3b82f6',
  USDC: '#10b981',
  AQUA: '#06b6d4',
  BTC:  '#f59e0b',
  ETH:  '#8b5cf6',
  EURC: '#6366f1',
  USDW: '#10b981',
  AST1: '#ec4899',
  AST2: '#8b5cf6',
}

function tokenBg(code: string): string {
  if (TOKEN_COLORS[code]) return TOKEN_COLORS[code]
  const palette = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']
  let h = 0
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) & 0xfff
  return palette[h % palette.length]
}

function TokenAvatar({ code }: { code: string }) {
  return (
    <div
      className="flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-[#111827]"
      style={{ backgroundColor: tokenBg(code) }}
    >
      {code.slice(0, 4)}
    </div>
  )
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 text-[10px] transition-colors ${active ? 'text-[#4ade80]' : 'text-[#374151]'}`}>
      {active ? (dir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  )
}

// ─── Risk Profile Badge ───────────────────────────────────────────────────────

function RiskProfileBadge({ risk }: { risk: RiskProfile }) {
  const cfg = {
    Conservative: {
      dot: 'bg-[#4ade80]',
      text: 'text-[#4ade80]',
      label: 'Conservative',
    },
    Moderate: {
      dot: 'bg-[#C8A84B]',
      text: 'text-[#C8A84B]',
      label: 'Balanced',
    },
    Aggressive: {
      dot: 'bg-red-400',
      text: 'text-red-400',
      label: 'Aggressive',
    },
  }[risk]

  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-1.5 shrink-0 rounded-full ${cfg.dot}`} />
      <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
    </span>
  )
}

// ─── Pool Row ─────────────────────────────────────────────────────────────────

// Pool sütunu daha dengeli; sütun arası boşluk Kamino gibi geniş (gap-x-8 = 32px)
const COL = 'grid items-center gap-x-8 grid-cols-[minmax(0,2.2fr)_80px_120px_140px_70px_130px]'

function PoolRow({
  isRecommended,
  isSelected,
  onSelect,
  pool,
}: {
  isRecommended: boolean
  isSelected: boolean
  onSelect: () => void
  pool: DeFiPool
}) {
  return (
    <>
      {/* Main row */}
      <div
        className={`${COL} border-b border-white/[0.04] px-6 py-3.5 transition-colors duration-150 ${
          isSelected ? 'bg-[#4ade80]/[0.06]' : 'hover:bg-white/[0.03]'
        }`}
      >
        {/* Pool info */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Stacked token avatars */}
          <div className="flex shrink-0">
            <TokenAvatar code={pool.asset} />
            {pool.secondaryAsset && (
              <div className="-ml-3">
                <TokenAvatar code={pool.secondaryAsset} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-white">
                {pool.asset}{pool.secondaryAsset ? ` / ${pool.secondaryAsset}` : ''}
              </span>
              {isRecommended && (
                <span className="shrink-0 rounded-full bg-[#4ade80]/15 px-1.5 py-px text-[10px] font-bold text-[#4ade80]">
                  ★ For you
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-[11px] text-[#4B5563]">{pool.protocol}</p>
          </div>
        </div>

        {/* APY */}
        <span className="text-sm font-bold text-[#4ade80]">
          {pool.apy.toFixed(2)}%
        </span>

        {/* TVL / Deposits */}
        <span className="text-sm font-medium text-white">{pool.tvl}</span>

        {/* Risk Profile */}
        <RiskProfileBadge risk={pool.risk} />

        {/* Fee */}
        <span className="text-xs tabular-nums text-[#6B7280]">
          {pool.feeBp != null ? `${(pool.feeBp / 100).toFixed(2)}%` : '—'}
        </span>

        {/* Actions */}
        <div className="flex items-center justify-end">
          <button
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150 ${
              isSelected
                ? 'bg-[#4ade80] text-[#0D1117] shadow-[0_0_16px_#4ade8040]'
                : 'bg-white/[0.10] text-white hover:bg-white/[0.18]'
            }`}
            onClick={onSelect}
            type="button"
          >
            {isSelected ? '✓ Selected' : 'Add Liquidity'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main Pool Table ──────────────────────────────────────────────────────────

export function PoolTable({
  onSelectPool,
  poolsState,
  riskProfile,
  selectedPoolId,
}: {
  onSelectPool: (id: string | null) => void
  poolsState: PoolsState
  riskProfile: RiskProfile | null
  selectedPoolId: string | null
}) {
  const [filter, setFilter]   = useState<FilterTab>('all')
  const [search, setSearch]   = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('tvl')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const allPools: DeFiPool[] = poolsState.status === 'success' ? poolsState.pools : []

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = allPools.filter((pool) => {
    const pairStr = `${pool.asset} ${pool.secondaryAsset ?? ''}`.toLowerCase()
    if (search && !pairStr.includes(search.toLowerCase())) return false
    if (filter === 'xlm')
      return pool.asset === 'XLM' || pool.secondaryAsset === 'XLM'
    if (filter === 'stables')
      return (
        STABLE_CODES.has(pool.asset.toUpperCase()) ||
        STABLE_CODES.has((pool.secondaryAsset ?? '').toUpperCase())
      )
    return true
  })

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    let va = 0, vb = 0
    if (sortKey === 'apy') { va = a.apy; vb = b.apy }
    else if (sortKey === 'tvl') { va = a.tvlRaw; vb = b.tvlRaw }
    else if (sortKey === 'fee') { va = a.feeBp ?? 0; vb = b.feeBp ?? 0 }
    return sortDir === 'desc' ? vb - va : va - vb
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all',     label: 'All Pools' },
    { key: 'xlm',     label: '✦ XLM'     },
    { key: 'stables', label: '◈ Stables'  },
  ]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827]">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                filter === tab.key
                  ? 'bg-white/[0.12] text-white'
                  : 'text-[#4B5563] hover:text-[#9CA3AF]'
              }`}
              onClick={() => setFilter(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right side: count + search */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#374151]">
            Showing {sorted.length} of {allPools.length} pools
          </span>
          <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 transition focus-within:border-white/[0.16]">
            <svg className="size-3.5 shrink-0 text-[#4B5563]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx={11} cy={11} r={8} />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              className="w-36 bg-transparent text-xs text-white placeholder-[#4B5563] outline-none"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets…"
              type="text"
              value={search}
            />
          </label>
        </div>
      </div>

      {/* ── Table header ── */}
      <div className={`${COL} border-b border-white/[0.05] px-6 py-3`}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#374151]">
          Pool
        </span>

        <button
          className="flex items-center text-[11px] font-semibold uppercase tracking-wider text-[#374151] hover:text-[#6B7280] transition-colors"
          onClick={() => handleSort('apy')}
          type="button"
        >
          APY <SortIcon active={sortKey === 'apy'} dir={sortDir} />
        </button>

        <button
          className="flex items-center text-[11px] font-semibold uppercase tracking-wider text-[#374151] hover:text-[#6B7280] transition-colors"
          onClick={() => handleSort('tvl')}
          type="button"
        >
          Deposits <SortIcon active={sortKey === 'tvl'} dir={sortDir} />
        </button>

        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#374151]">
          Risk Profile
        </span>

        <button
          className="flex items-center text-[11px] font-semibold uppercase tracking-wider text-[#374151] hover:text-[#6B7280] transition-colors"
          onClick={() => handleSort('fee')}
          type="button"
        >
          Fee <SortIcon active={sortKey === 'fee'} dir={sortDir} />
        </button>

        <span />
      </div>

      {/* ── Loading skeleton ── */}
      {poolsState.status === 'loading' && (
        <div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`${COL} animate-pulse border-b border-white/[0.04] px-6 py-4`}>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-white/[0.08]" />
                <div className="-ml-3 size-8 rounded-full bg-white/[0.08]" />
                <div className="h-4 w-28 rounded-lg bg-white/[0.08]" />
              </div>
              <div className="h-4 w-12 rounded-lg bg-white/[0.08]" />
              <div className="h-4 w-16 rounded-lg bg-white/[0.08]" />
              <div className="h-4 w-20 rounded-lg bg-white/[0.08]" />
              <div className="h-4 w-10 rounded-lg bg-white/[0.08]" />
              <div className="ml-auto h-8 w-28 rounded-xl bg-white/[0.08]" />
            </div>
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {poolsState.status === 'error' && (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-semibold text-red-400">Could not load pools</p>
          <p className="mt-1 text-xs text-[#374151]">{poolsState.message}</p>
          <p className="mt-1 text-xs text-[#374151]">Make sure the backend API is reachable</p>
        </div>
      )}

      {/* ── Pool rows ── */}
      {poolsState.status === 'success' && (
        <div>
          {sorted.map((pool) => (
            <PoolRow
              isRecommended={riskProfile ? pool.risk === riskProfile : false}
              isSelected={selectedPoolId === pool.id}
              key={pool.id}
              onSelect={() => onSelectPool(selectedPoolId === pool.id ? null : pool.id)}
              pool={pool}
            />
          ))}

          {sorted.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-[#374151]">
              No pools match your filter
            </div>
          )}
        </div>
      )}
    </div>
  )
}
