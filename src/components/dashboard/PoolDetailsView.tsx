import { useState, useMemo, useRef } from 'react'
import xlmLogo from '../../assets/xlm.svg'
import usdcLogo from '../../assets/usdc.svg'
import aquaLogo from '../../assets/aquaris.svg'
import { useWallet } from '../../context/useWallet'
import { usePoolRisk } from '../../hooks/usePoolRisk'
import { executeMockTestnetSupply } from '../../services/mockTestnetSupply'
import { executeMockTestnetWithdraw } from '../../services/mockTestnetWithdraw'
import { estimateSecondaryAmount, executeSoroswapAddLiquidity } from '../../services/soroswapLiquidity'
import type { DeFiPool, LocalPosition } from '../../types/stellar'

function getNowTimestamp(): number {
  return Date.now()
}

// ─── Token Avatars ────────────────────────────────────────────────────────────

const TOKEN_COLORS: Record<string, string> = {
  XLM: '#3b82f6',
  USDC: '#10b981',
  AQUA: '#06b6d4',
  BTC: '#f59e0b',
  ETH: '#8b5cf6',
  EURC: '#6366f1',
}

function tokenBg(code: string): string {
  if (TOKEN_COLORS[code]) return TOKEN_COLORS[code]
  const palette = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']
  let h = 0
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) & 0xfff
  return palette[h % palette.length]
}

function TokenAvatar({ code, size = 'md' }: { code: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'size-9 ring-2' : size === 'sm' ? 'size-5 ring-1' : 'size-7 ring-2'
  const upper = code.toUpperCase()
  if (upper === 'XLM' || upper === 'YXLM') {
    return (
      <img
        alt={code}
        className={`shrink-0 rounded-full bg-[#12121A] p-0.5 ring-[#0D0D12] ${dims}`}
        src={xlmLogo}
      />
    )
  }
  if (upper === 'USDC') {
    return (
      <img
        alt={code}
        className={`shrink-0 rounded-full bg-[#12121A] p-0.5 ring-[#0D0D12] ${dims}`}
        src={usdcLogo}
      />
    )
  }
  if (upper === 'AQUA') {
    return (
      <img
        alt={code}
        className={`shrink-0 rounded-full bg-[#12121A] p-0.5 ring-[#0D0D12] ${dims}`}
        src={aquaLogo}
      />
    )
  }

  const textDims = size === 'lg' ? 'size-9 text-xs ring-2' : size === 'sm' ? 'size-5 text-[9px] ring-1' : 'size-7 text-[10px] ring-2'
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-[#111827] ${textDims}`}
      style={{ backgroundColor: tokenBg(code) }}
    >
      {code.slice(0, 3)}
    </div>
  )
}

// ─── Chart Data Generator ─────────────────────────────────────────────────────

function generateMockChartData(baseApy: number, baseTvlRaw: number, days = 30) {
  const data = []
  const now = new Date()
  let currentApy = baseApy * 0.82
  let currentTvl = baseTvlRaw * 0.91

  for (let i = days; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)

    currentApy += (Math.random() - 0.48) * 0.4 + (baseApy - currentApy) * 0.12
    currentTvl += (Math.random() - 0.48) * (baseTvlRaw * 0.04) + (baseTvlRaw - currentTvl) * 0.1

    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      apy: Math.max(0.1, currentApy),
      tvl: Math.max(0, currentTvl),
    })
  }

  data[data.length - 1].apy = baseApy
  data[data.length - 1].tvl = baseTvlRaw

  return data
}

// ─── Custom Pure SVG Interactive Area Chart (Zero External Dependencies) ───────

function PerformanceAreaChart({
  data,
  metric,
}: {
  data: Array<{ date: string; apy: number; tvl: number }>
  metric: 'apy' | 'tvl'
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const values = data.map((d) => (metric === 'apy' ? d.apy : d.tvl))
  const minVal = Math.min(...values) * 0.94
  const maxVal = Math.max(...values) * 1.05
  const range = Math.max(0.001, maxVal - minVal)

  const width = 640
  const height = 220
  const padX = 16
  const padTop = 16
  const padBottom = 28
  const chartW = width - padX * 2
  const chartH = height - padTop - padBottom

  const pts = data.map((d, i) => {
    const val = metric === 'apy' ? d.apy : d.tvl
    const x = padX + (i / Math.max(1, data.length - 1)) * chartW
    const y = padTop + chartH - ((val - minVal) / range) * chartH
    return { x, y, val, date: d.date }
  })

  // Build SVG path
  const linePath = pts
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(' ')

  const areaPath = pts.length
    ? `${linePath} L ${pts[pts.length - 1].x},${padTop + chartH} L ${pts[0].x},${padTop + chartH} Z`
    : ''

  const color = metric === 'apy' ? '#3B82F6' : '#16A34A'
  const activePt = hoverIdx !== null ? pts[hoverIdx] : pts[pts.length - 1]

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !data.length) return
    const rect = svgRef.current.getBoundingClientRect()
    const relX = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const ratio = relX / rect.width
    const idx = Math.round(ratio * (data.length - 1))
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)))
  }

  return (
    <div className="relative w-full select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={`areaGrad-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((f, idx) => {
          const gy = padTop + chartH * f
          return (
            <line
              key={idx}
              x1={padX}
              y1={gy}
              x2={width - padX}
              y2={gy}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
            />
          )
        })}

        {/* Filled Area */}
        <path d={areaPath} fill={`url(#areaGrad-${metric})`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover vertical guide line */}
        {activePt && (
          <line
            x1={activePt.x}
            y1={padTop}
            x2={activePt.x}
            y2={padTop + chartH}
            stroke={color}
            strokeDasharray="3 3"
            strokeOpacity="0.5"
          />
        )}

        {/* Active glowing dot */}
        {activePt && (
          <circle
            cx={activePt.x}
            cy={activePt.y}
            r="5"
            fill="#0D0D12"
            stroke={color}
            strokeWidth="3"
          />
        )}

        {/* Bottom X-axis Date Labels */}
        <g className="text-[10px] fill-[#6B7280]">
          {pts
            .filter((_, idx) => idx === 0 || idx === Math.floor(pts.length / 2) || idx === pts.length - 1)
            .map((p, idx) => (
              <text
                key={idx}
                x={p.x}
                y={height - 6}
                textAnchor={idx === 0 ? 'start' : idx === 2 ? 'end' : 'middle'}
              >
                {p.date}
              </text>
            ))}
        </g>
      </svg>

      {/* Interactive Tooltip Badge */}
      {activePt && (
        <div className="absolute top-0 right-2 flex items-center gap-3 rounded-xl border border-white/[0.12] bg-[#0D0D14]/90 px-3.5 py-1.5 text-xs shadow-xl backdrop-blur-md">
          <span className="text-[#9CA3AF]">{activePt.date}</span>
          <span className="font-mono font-bold text-white">
            {metric === 'apy'
              ? `${activePt.val.toFixed(2)}% APY`
              : `$${(activePt.val / 1_000_000).toFixed(2)}M`}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Main Kamino-Style Pool Details View ──────────────────────────────────────

export function PoolDetailsView({
  available,
  initialTab = 'overview',
  onBack,
  onPositionAdded,
  pool,
  userPositions = [],
}: {
  available: number
  initialTab?: 'overview' | 'position'
  onBack: () => void
  onPositionAdded: (pos: Omit<LocalPosition, 'id'>) => void
  pool: DeFiPool
  userPositions?: LocalPosition[]
}) {
  const { connect, networkPassphrase, networkUrl, publicKey, sorobanRpcUrl, status } = useWallet()
  const riskState = usePoolRisk(pool.id)

  // Page Navigation Tabs: 'overview' | 'position'
  const [activePageTab, setActivePageTab] = useState<'overview' | 'position'>(initialTab)

  // Chart Metric & Timeframe
  const [chartMetric, setChartMetric] = useState<'apy' | 'tvl'>('apy')
  const [timeframe, setTimeframe] = useState<7 | 30 | 90>(30)

  // Deposit Form State
  const [amount, setAmount] = useState<number>(0)
  const [txState, setTxState] = useState<'idle' | 'signing' | 'submitted' | 'error'>('idle')
  const [txMessage, setTxMessage] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  // Withdraw State (for My Position tab)
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0)
  const [withdrawTxState, setWithdrawTxState] = useState<'idle' | 'signing' | 'submitted' | 'error'>('idle')
  const [withdrawTxHash, setWithdrawTxHash] = useState<string | null>(null)
  const [actionTab, setActionTab] = useState<'deposit' | 'withdraw'>('deposit')

  const isTestnet = networkPassphrase?.toLowerCase().includes('test') ?? false
  const isConnected = status === 'CONNECTED' && Boolean(publicKey) && Boolean(networkUrl) && Boolean(networkPassphrase)
  const canSign = isConnected && isTestnet

  const isLP = pool.category === 'AMM LP' || pool.category === 'AMM Rewards'
  const secondaryAsset = pool.secondaryAsset as 'XLM' | 'USDC' | undefined
  const secondaryAmount = isLP && secondaryAsset && (secondaryAsset === 'XLM' || secondaryAsset === 'USDC')
    ? estimateSecondaryAmount(pool.asset, amount)
    : 0

  // Approximate USD value for deposit
  const poolAsset = pool.asset as string
  const tokenUsdPrice = poolAsset === 'USDC' || poolAsset === 'EURC' ? 1 : poolAsset === 'XLM' ? 0.12 : 1
  const usdValue = amount * tokenUsdPrice

  const myPosition = userPositions.find((p) => p.poolId === pool.id || p.asset === pool.asset)
  const suppliedAmount = myPosition ? myPosition.amount : 0
  const suppliedUsdValue = suppliedAmount * tokenUsdPrice
  const withdrawUsdValue = withdrawAmount * tokenUsdPrice

  // Calculated stats matching Kamino top strip
  const totalSuppliedUsd = pool.tvl
  const totalBorrowedUsd = pool.utilization ? `$${((pool.tvlRaw * (pool.utilization / 100)) / 1_000_000).toFixed(2)}M` : `$${(pool.tvlRaw * 0.88 / 1_000_000).toFixed(2)}M`
  const utilizationPct = pool.utilization ?? 89.4
  const supplyApy = pool.apy
  const avgApy90d = (pool.apy * 0.84)

  // Chart data
  const chartData = useMemo(() => generateMockChartData(pool.apy, pool.tvlRaw, timeframe), [pool.apy, pool.tvlRaw, timeframe])

  const handleDeposit = async () => {
    setTxMessage(null)
    setTxHash(null)

    if (!isConnected || !publicKey || !networkUrl || !networkPassphrase) {
      setTxState('error')
      setTxMessage('Connect your Freighter wallet first.')
      return
    }

    if (!isTestnet) {
      setTxState('error')
      setTxMessage('Switch Freighter to Testnet to run demo transactions.')
      return
    }

    try {
      setTxState('signing')
      let result: { hash: string; status: string }

      if (isLP && secondaryAsset && (secondaryAsset === 'XLM' || secondaryAsset === 'USDC') && sorobanRpcUrl) {
        result = await executeSoroswapAddLiquidity({
          amountA: amount,
          amountB: secondaryAmount,
          horizonUrl: networkUrl,
          networkPassphrase,
          publicKey,
          sorobanRpcUrl,
          tokenA: pool.asset,
          tokenB: secondaryAsset,
        })
      } else {
        result = await executeMockTestnetSupply({
          amount,
          asset: pool.asset,
          horizonUrl: networkUrl,
          networkPassphrase,
          protocol: pool.protocol,
          publicKey,
        })
      }

      setTxState('submitted')
      setTxHash(result.hash)
      onPositionAdded({
        amount,
        asset: pool.asset,
        hash: result.hash,
        protocol: pool.protocol,
        status: result.status,
        timestamp: new Date().toLocaleTimeString(),
        openedAt: getNowTimestamp(),
        apy: pool.apy,
        category: pool.category,
        poolId: pool.id,
      })
    } catch (error) {
      setTxState('error')
      setTxMessage(error instanceof Error ? error.message : 'Transaction failed.')
    }
  }

  const handleWithdraw = async (pos: LocalPosition) => {
    if (!isConnected || !publicKey || !networkUrl || !networkPassphrase || !isTestnet) return
    try {
      setWithdrawTxState('signing')
      const result = await executeMockTestnetWithdraw({
        amount: withdrawAmount || pos.amount,
        asset: pos.asset,
        horizonUrl: networkUrl,
        networkPassphrase,
        publicKey,
      })
      setWithdrawTxState('submitted')
      setWithdrawTxHash(result.hash)
    } catch {
      setWithdrawTxState('error')
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* ── Breadcrumb & Navigation Bar ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.10] bg-[#12121A] text-[#9CA3AF] transition hover:border-white/[0.22] hover:text-white"
            title="Back to Vaults"
            type="button"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex shrink-0">
              <TokenAvatar code={pool.asset} size="lg" />
              {pool.secondaryAsset && (
                <div className="-ml-3">
                  <TokenAvatar code={pool.secondaryAsset} size="lg" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white sm:text-2xl">
                  {pool.protocol} {pool.asset} Prime
                </h1>
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-xs font-semibold text-[#F2C12E]">
                  {pool.risk === 'Moderate' ? 'Balanced' : pool.risk}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Header Metadata (matching Kamino) */}
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#9CA3AF]">Vault Token</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <TokenAvatar code={pool.asset} size="sm" />
              <span>{pool.asset}</span>
            </div>
          </div>
          <div className="h-4 w-px bg-white/[0.08]" />
          <div className="flex items-center gap-2">
            <span className="text-[#9CA3AF]">Risk Manager</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span className="flex size-4 items-center justify-center rounded-full bg-[#3B82F6] text-[9px] text-white">S</span>
              <span>Sentora</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs (Vault Overview | My Position) ── */}
      <div className="mb-6 flex gap-8 border-b border-white/[0.08]">
        <button
          onClick={() => setActivePageTab('overview')}
          className={`relative pb-3 text-sm font-semibold transition ${activePageTab === 'overview'
              ? 'text-white'
              : 'text-[#9CA3AF] hover:text-white'
            }`}
          type="button"
        >
          Vault Overview
          {activePageTab === 'overview' && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#3B82F6]" />
          )}
        </button>

        <button
          onClick={() => setActivePageTab('position')}
          className={`relative pb-3 text-sm font-semibold transition ${activePageTab === 'position'
              ? 'text-white'
              : 'text-[#9CA3AF] hover:text-white'
            }`}
          type="button"
        >
          My Position
          {userPositions.length > 0 && (
            <span className="ml-2 rounded-full bg-[#16A34A]/20 px-2 py-0.5 text-xs font-bold text-[#16A34A]">
              {userPositions.length}
            </span>
          )}
          {activePageTab === 'position' && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#3B82F6]" />
          )}
        </button>
      </div>

      {/* ── Stat Cards Strip (Vault Overview vs My Position) ── */}
      {activePageTab === 'overview' ? (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111119] p-5">
            <p className="font-mono text-xl font-extrabold text-white sm:text-2xl">{totalSuppliedUsd}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Total Supplied</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#111119] p-5">
            <p className="font-mono text-xl font-extrabold text-white sm:text-2xl">{totalBorrowedUsd}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Total Borrowed</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#111119] p-5">
            <p className="font-mono text-xl font-extrabold text-white sm:text-2xl">{utilizationPct.toFixed(2)}%</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Utilization</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#111119] p-5">
            <p className="font-mono text-xl font-extrabold text-[#16A34A] sm:text-2xl">{supplyApy.toFixed(2)}%</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Supply APY</p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/[0.08] bg-[#111119] p-5">
            <p className="font-mono text-xl font-extrabold text-[#16A34A] sm:text-2xl">{avgApy90d.toFixed(2)}%</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Supply APY (90D Avg)</p>
          </div>
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111119] p-5">
            <p className="font-mono text-xl font-extrabold text-white sm:text-2xl">${suppliedUsdValue.toFixed(2)}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Total Supplied</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#111119] p-5">
            <p className="font-mono text-xl font-extrabold text-[#16A34A] sm:text-2xl">${(suppliedUsdValue * 0.0015).toFixed(6)}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Interest Earned</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#111119] p-5">
            <p className="font-mono text-xl font-extrabold text-[#16A34A] sm:text-2xl">${(suppliedUsdValue * (pool.apy / 100) / 365).toFixed(4)}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Daily Interest</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#111119] p-5">
            <p className="font-mono text-xl font-extrabold text-[#16A34A] sm:text-2xl">{pool.apy.toFixed(2)}%</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Supply APY</p>
          </div>
        </div>
      )}

      {/* ── Unified 2-Column Content (Left: Overview/Position, Right: Deposit/Withdraw) ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
        {/* Left Column */}
        <div className="space-y-6">
          {activePageTab === 'overview' ? (
            <>
              {/* Strategy Overview Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#111119] p-6">
                <h2 className="text-base font-bold text-white">Strategy Overview</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">
                  {pool.protocol} {pool.asset} Prime is a conservative lending strategy designed to enable superior risk-adjusted yields via automated allocation into highly liquid Soroban money markets.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#181824] px-3 py-1 text-xs font-medium text-white">
                    <span>⚖</span> Balanced
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#181824] px-3 py-1 text-xs font-medium text-white">
                    <TokenAvatar code={pool.asset} size="sm" />
                    <span>{pool.asset}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#181824] px-3 py-1 text-xs font-medium text-[#9CA3AF]">
                    {pool.protocol} Protocol
                  </span>
                </div>
              </div>

              {/* Performance History / APY Chart Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#111119] p-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setChartMetric('apy')}
                      className={`pb-1 text-sm font-semibold transition ${chartMetric === 'apy' ? 'border-b-2 border-[#3B82F6] text-white' : 'text-[#9CA3AF] hover:text-white'
                        }`}
                      type="button"
                    >
                      Supply APY
                    </button>
                    <button
                      onClick={() => setChartMetric('tvl')}
                      className={`pb-1 text-sm font-semibold transition ${chartMetric === 'tvl' ? 'border-b-2 border-[#3B82F6] text-white' : 'text-[#9CA3AF] hover:text-white'
                        }`}
                      type="button"
                    >
                      Total Supply
                    </button>
                  </div>

                  <div className="flex items-center rounded-xl bg-white/[0.04] p-1 text-xs font-semibold">
                    {([7, 30, 90] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`rounded-lg px-3 py-1 transition ${timeframe === t ? 'bg-[#3B82F6] text-white' : 'text-[#9CA3AF] hover:text-white'
                          }`}
                        type="button"
                      >
                        {t === 90 ? '3M' : `${t}D`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Area Chart */}
                <div className="h-64 w-full">
                  <PerformanceAreaChart data={chartData} metric={chartMetric} />
                </div>
              </div>

              {/* Sentora Risk Telemetry Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#111119] p-6">
                {riskState.status === 'loading' || riskState.status === 'idle' ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 w-1/3 rounded-full bg-white/[0.08]" />
                    <div className="h-4 w-2/3 rounded-full bg-white/[0.08]" />
                  </div>
                ) : riskState.status === 'error' ? (
                  <p className="text-sm text-[#9CA3AF]">Could not load live risk telemetry.</p>
                ) : (
                  <div>
                    <div className="mb-6 flex items-center justify-between">
                      <span className="text-sm text-[#9CA3AF]">Sentora Composite Health Score</span>
                      <span className="font-mono text-xl font-bold text-[#16A34A]">{riskState.data.compositeScore} / 100</span>
                    </div>
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                      {[
                        { label: 'Audit Security', score: riskState.data.trustScore },
                        { label: 'Liquidity Depth', score: riskState.data.tvlScore },
                        { label: 'Vol Stability', score: riskState.data.volatilityScore },
                        { label: 'APY Health', score: riskState.data.apyScore },
                      ].map((metric) => (
                        <div key={metric.label}>
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="text-[#9CA3AF]">{metric.label}</span>
                            <span className="font-semibold text-white">{metric.score}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${metric.score}%`,
                                backgroundColor: metric.score > 70 ? '#16A34A' : metric.score > 40 ? '#F2C12E' : '#ef4444'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Left Column: My Position View (Matching Screenshot 2) */
            <div className="space-y-6">
              {suppliedAmount === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-[#111119] p-12 text-center">
                  <p className="text-base font-semibold text-white">No active position in this vault</p>
                  <p className="mt-1 text-sm text-[#9CA3AF]">Use the deposit panel on the right to start earning {pool.apy.toFixed(2)}% APY.</p>
                  <button
                    onClick={() => setActionTab('deposit')}
                    className="mt-6 rounded-xl bg-[#F2C12E] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#0D0D12] transition hover:bg-[#e0b429]"
                    type="button"
                  >
                    Deposit Now →
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.08] bg-[#111119] p-6">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-6">
                      <span className="border-b-2 border-[#3B82F6] pb-2 text-sm font-bold text-white">Position Value</span>
                      <span className="pb-2 text-sm font-medium text-[#9CA3AF]">Interest Earned</span>
                      <span className="pb-2 text-sm font-medium text-[#9CA3AF]">Avg APY</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-[#3B82F6] px-2.5 py-1 text-xs font-bold text-white">USD</span>
                      <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-[#9CA3AF]">SOL</span>
                      <span className="rounded-lg bg-[#3B82F6] px-2.5 py-1 text-xs font-bold text-white">7D</span>
                      <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-[#9CA3AF]">30D</span>
                      <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-[#9CA3AF]">3M</span>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <svg className="size-full overflow-visible" viewBox="0 0 500 180">
                      <defs>
                        <linearGradient id={`pos-gradient-${pool.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M 0,160 L 0,140 L 500,40 L 500,160 Z" fill={`url(#pos-gradient-${pool.id})`} />
                      <path d="M 0,140 L 500,40" fill="none" stroke="#3B82F6" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Unified Deposit & Withdraw Widget Box (Matching Screenshot 1) */}
        <div className="sticky top-24 rounded-2xl border border-white/[0.10] bg-[#111119] p-6 shadow-2xl">
          {/* Action Tabs: Deposit | Withdraw */}
          <div className="mb-5 flex border-b border-white/[0.08]">
            <button
              type="button"
              onClick={() => setActionTab('deposit')}
              className={`flex-1 pb-3 text-center text-sm font-bold transition ${actionTab === 'deposit'
                  ? 'border-b-2 border-[#3B82F6] text-white'
                  : 'text-[#9CA3AF] hover:text-white'
                }`}
            >
              Deposit
            </button>
            <button
              type="button"
              onClick={() => setActionTab('withdraw')}
              className={`flex-1 pb-3 text-center text-sm font-bold transition ${actionTab === 'withdraw'
                  ? 'border-b-2 border-[#3B82F6] text-white'
                  : 'text-[#9CA3AF] hover:text-white'
                }`}
            >
              Withdraw
            </button>
          </div>

          {actionTab === 'deposit' ? (
            <>
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="font-medium text-[#9CA3AF]">You Deposit</span>
                <span className="font-mono text-[#9CA3AF]">~${usdValue.toFixed(2)}</span>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#161622] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <TokenAvatar code={pool.asset} size="md" />
                    <span className="font-bold text-white">{pool.asset}</span>
                  </div>
                  <input
                    className="w-40 bg-transparent text-right font-mono text-2xl font-bold text-white placeholder-white/30 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    max={available}
                    min={0}
                    onChange={(e) => setAmount(Math.min(Number(e.target.value), available))}
                    placeholder="0"
                    type="number"
                    value={amount || ''}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
                  <span className="text-[#9CA3AF]">
                    Available: <span className="font-mono text-white">{available.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span> {pool.asset}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setAmount(Number((available * 0.5).toFixed(4)))}
                      className="rounded-lg bg-white/[0.08] px-2.5 py-1 font-semibold text-white transition hover:bg-white/[0.15]"
                      type="button"
                    >
                      Half
                    </button>
                    <button
                      onClick={() => setAmount(available)}
                      className="rounded-lg bg-white/[0.08] px-2.5 py-1 font-semibold text-white transition hover:bg-white/[0.15]"
                      type="button"
                    >
                      Max
                    </button>
                  </div>
                </div>
              </div>

              {/* Slider */}
              <input
                aria-label="Deposit slider"
                className="mt-4 w-full accent-[#3B82F6]"
                max={available}
                min={0}
                onChange={(e) => setAmount(Number(e.target.value))}
                step={pool.asset === 'USDC' ? 0.01 : 1}
                type="range"
                value={amount}
              />

              {isLP && secondaryAsset && (
                <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-xs text-[#9CA3AF]">
                  <span>+ Required secondary pair: </span>
                  <strong className="text-white">
                    ~{secondaryAmount.toFixed(2)} {secondaryAsset}
                  </strong>
                </div>
              )}

              {!isTestnet && isConnected && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#F2C12E]/25 bg-[#F2C12E]/10 p-3 text-xs text-[#F2C12E]">
                  <span>⚠</span>
                  <span>Switch Freighter to <strong>Testnet</strong> to run transactions.</span>
                </div>
              )}

              <button
                onClick={!isConnected ? connect : handleDeposit}
                disabled={isConnected && (amount <= 0 || available <= 0 || txState === 'signing' || !canSign)}
                className={`mt-5 w-full rounded-xl py-4 text-sm font-bold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${!isConnected
                    ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                    : 'bg-[#F2C12E] text-[#0D0D12] hover:bg-[#e0b429] shadow-[0_0_20px_rgba(242,193,46,0.25)]'
                  }`}
                type="button"
              >
                {!isConnected
                  ? 'Connect Wallet'
                  : txState === 'signing'
                    ? 'Waiting for Freighter…'
                    : `Deposit ${amount > 0 ? amount : ''} ${pool.asset}`}
              </button>

              <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-[#9CA3AF]">
                <span>Transaction Settings</span>
                <span className="cursor-pointer hover:text-white">⚙</span>
              </div>

              {txMessage && txState === 'error' && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  {txMessage}
                </div>
              )}

              {txState === 'submitted' && txHash && (
                <div className="mt-4 rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 p-4">
                  <div className="flex items-start gap-3">
                    <svg className="size-5 shrink-0 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#16A34A]">Deposit Confirmed</p>
                      <p className="mt-0.5 text-xs text-[#9CA3AF]">Position added to your portfolio.</p>
                      <a
                        className="mt-2.5 block truncate rounded-lg border border-[#16A34A]/20 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-white hover:border-[#16A34A]/40"
                        href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {txHash}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Withdraw Tab Form */
            <>
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="font-medium text-[#9CA3AF]">You Withdraw</span>
                <span className="font-mono text-[#9CA3AF]">~${withdrawUsdValue.toFixed(2)}</span>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#161622] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <TokenAvatar code={pool.asset} size="md" />
                    <span className="font-bold text-white">{pool.asset}</span>
                  </div>
                  <input
                    className="w-40 bg-transparent text-right font-mono text-2xl font-bold text-white placeholder-white/30 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    max={suppliedAmount}
                    min={0}
                    onChange={(e) => setWithdrawAmount(Math.min(Number(e.target.value), suppliedAmount))}
                    placeholder="0"
                    type="number"
                    value={withdrawAmount || ''}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
                  <span className="text-[#9CA3AF]">
                    Supplied: <span className="font-mono text-white">{suppliedAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span> {pool.asset}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setWithdrawAmount(Number((suppliedAmount * 0.5).toFixed(4)))}
                      className="rounded-lg bg-white/[0.08] px-2.5 py-1 font-semibold text-white transition hover:bg-white/[0.15]"
                      type="button"
                    >
                      Half
                    </button>
                    <button
                      onClick={() => setWithdrawAmount(suppliedAmount)}
                      className="rounded-lg bg-white/[0.08] px-2.5 py-1 font-semibold text-white transition hover:bg-white/[0.15]"
                      type="button"
                    >
                      Max
                    </button>
                  </div>
                </div>
              </div>

              {/* Slider */}
              <input
                aria-label="Withdraw slider"
                className="mt-4 w-full accent-[#3B82F6]"
                max={suppliedAmount}
                min={0}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                step={pool.asset === 'USDC' ? 0.01 : 1}
                type="range"
                value={withdrawAmount}
              />

              {!isTestnet && isConnected && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#F2C12E]/25 bg-[#F2C12E]/10 p-3 text-xs text-[#F2C12E]">
                  <span>⚠</span>
                  <span>Switch Freighter to <strong>Testnet</strong> to run transactions.</span>
                </div>
              )}

              <button
                onClick={() => myPosition && handleWithdraw(myPosition)}
                disabled={!isConnected || withdrawAmount <= 0 || suppliedAmount <= 0 || withdrawTxState === 'signing' || !canSign}
                className={`mt-5 w-full rounded-xl py-4 text-sm font-bold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${!isConnected
                    ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                    : 'bg-[#F2C12E] text-[#0D0D12] hover:bg-[#e0b429] shadow-[0_0_20px_rgba(242,193,46,0.25)]'
                  }`}
                type="button"
              >
                {!isConnected
                  ? 'Connect Wallet'
                  : withdrawTxState === 'signing'
                    ? 'Waiting for Freighter…'
                    : `Withdraw ${withdrawAmount > 0 ? withdrawAmount : ''} ${pool.asset}`}
              </button>

              <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-[#9CA3AF]">
                <span>Transaction Settings</span>
                <span className="cursor-pointer hover:text-white">⚙</span>
              </div>

              {withdrawTxState === 'submitted' && withdrawTxHash && (
                <div className="mt-4 rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 p-4">
                  <div className="flex items-start gap-3">
                    <svg className="size-5 shrink-0 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#16A34A]">Withdrawal Confirmed</p>
                      <p className="mt-0.5 text-xs text-[#9CA3AF]">Asset withdrawn to wallet.</p>
                      <a
                        className="mt-2.5 block truncate rounded-lg border border-[#16A34A]/20 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-white hover:border-[#16A34A]/40"
                        href={`https://stellar.expert/explorer/testnet/tx/${withdrawTxHash}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {withdrawTxHash}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
