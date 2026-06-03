import { useState, type ReactNode } from 'react'
import { reputationLabel, reputationTotal, stellarPools } from '../../data/stellarMock'
import { useWallet } from '../../context/useWallet'
import { executeMockTestnetSupply } from '../../services/mockTestnetSupply'
import { executeMockTestnetWithdraw } from '../../services/mockTestnetWithdraw'
import { estimateSecondaryAmount, executeSoroswapAddLiquidity } from '../../services/soroswapLiquidity'
import type { DeFiPool, LocalPosition, RiskProfile } from '../../types/stellar'

// ─── Bundle definitions ───────────────────────────────────────────────────────

type BundleAlloc = {
  poolId: string
  label: string
  pct: number
  category: 'Lending' | 'AMM LP' | 'AMM Rewards'
  asset: 'XLM' | 'USDC'
}

type YieldBundle = {
  id: string
  name: string
  tagline: string
  risk: RiskProfile
  estApy: number
  dotColor: string
  borderActive: string
  bgActive: string
  textColor: string
  allocations: BundleAlloc[]
}

const BUNDLES: YieldBundle[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    tagline: 'Capital protection first',
    risk: 'Conservative',
    estApy: 4.6,
    dotColor: 'bg-[#4ade80]',
    borderActive: 'border-[#4ade80]/40',
    bgActive: 'bg-[#4ade80]/8',
    textColor: 'text-[#4ade80]',
    allocations: [
      { poolId: 'blend-usdc-lending', label: 'Blend USDC Lending', pct: 80, category: 'Lending', asset: 'USDC' },
      { poolId: 'blend-xlm-lending',  label: 'Blend XLM Lending',  pct: 20, category: 'Lending', asset: 'XLM' },
    ],
  },
  {
    id: 'balanced',
    name: 'Balanced',
    tagline: 'Lending + LP exposure',
    risk: 'Moderate',
    estApy: 7.8,
    dotColor: 'bg-[#C8A84B]',
    borderActive: 'border-[#C8A84B]/40',
    bgActive: 'bg-[#C8A84B]/8',
    textColor: 'text-[#C8A84B]',
    allocations: [
      { poolId: 'blend-usdc-lending', label: 'Blend USDC Lending',   pct: 50, category: 'Lending', asset: 'USDC' },
      { poolId: 'soroswap-xlm-usdc',  label: 'Soroswap XLM/USDC LP', pct: 50, category: 'AMM LP', asset: 'XLM' },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'Maximum yield exposure',
    risk: 'Aggressive',
    estApy: 12.4,
    dotColor: 'bg-orange-400',
    borderActive: 'border-orange-400/35',
    bgActive: 'bg-orange-400/6',
    textColor: 'text-orange-400',
    allocations: [
      { poolId: 'blend-usdc-lending', label: 'Blend USDC Lending',   pct: 25, category: 'Lending', asset: 'USDC' },
      { poolId: 'soroswap-xlm-usdc',  label: 'Soroswap XLM/USDC LP', pct: 40, category: 'AMM LP', asset: 'XLM' },
      { poolId: 'aquarius-aqua-xlm',  label: 'Aquarius AQUA/XLM',    pct: 35, category: 'AMM Rewards', asset: 'XLM' },
    ],
  },
]

export function DefiOperations({
  onPositionAdded,
  onRetakeQuiz,
  onWithdrawn,
  positions,
  riskProfile,
  usdcBalance,
  xlmBalance,
}: {
  onPositionAdded: (pos: Omit<LocalPosition, 'id'>) => void
  onRetakeQuiz: () => void
  onWithdrawn: (id: string, amount: number) => void
  positions: LocalPosition[]
  riskProfile: RiskProfile | null
  usdcBalance: number
  xlmBalance: number
}) {
  const { status } = useWallet()
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null)
  const [expandedReputation, setExpandedReputation] = useState<string | null>(null)
  const [managingPosition, setManagingPosition] = useState<LocalPosition | null>(null)
  const [executingBundle, setExecutingBundle] = useState<YieldBundle | null>(null)

  const recommended = riskProfile ? stellarPools.filter((p) => p.risk === riskProfile) : []
  const others = riskProfile ? stellarPools.filter((p) => p.risk !== riskProfile) : stellarPools
  const selectedPool = stellarPools.find((p) => p.id === selectedPoolId) ?? null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">Stellar DeFi</p>
          <h1 className="mt-1 text-3xl font-semibold text-[#1A2E1A]">DeFi Opportunities</h1>
        </div>

        {status === 'CONNECTED' && (
          <PortfolioWidget
            onRetakeQuiz={onRetakeQuiz}
            riskProfile={riskProfile}
            usdcBalance={usdcBalance}
            xlmBalance={xlmBalance}
          />
        )}
      </div>

      <div className={selectedPool ? 'grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]' : ''}>
        <div className="space-y-8">
          {positions.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-3">
                <SectionLabel>Open positions</SectionLabel>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#4ade80]/30 bg-[#4ade80]/10 px-2.5 py-0.5 text-xs font-semibold text-[#1A2E1A]">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#4ade80] opacity-60" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-[#4ade80]" />
                  </span>
                  {positions.length} live
                </span>
              </div>
              <div className="space-y-3">
                {positions.map((pos) => (
                  <PositionCard
                    key={pos.id}
                    onManage={() => setManagingPosition(pos)}
                    position={pos}
                  />
                ))}
              </div>
            </div>
          )}

          {positions.length > 1 && (
            <PortfolioAllocation positions={positions} riskProfile={riskProfile} />
          )}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel>Yield Bundles</SectionLabel>
              <span className="text-[10px] text-[#6B7B6B]">One-click multi-protocol allocation</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {BUNDLES.map((bundle) => (
                <BundleCard
                  bundle={bundle}
                  isRecommended={bundle.risk === riskProfile}
                  key={bundle.id}
                  onExecute={() => setExecutingBundle(bundle)}
                />
              ))}
            </div>
          </div>

          {riskProfile && recommended.length > 0 && (
            <div>
              <SectionLabel>Recommended · {riskProfile}</SectionLabel>
              <div className="mt-3 space-y-3">
                {recommended.map((pool) => (
                  <PoolCard
                    expanded={expandedReputation === pool.id}
                    key={pool.id}
                    onSelect={() => setSelectedPoolId(selectedPoolId === pool.id ? null : pool.id)}
                    onToggleReputation={() =>
                      setExpandedReputation(expandedReputation === pool.id ? null : pool.id)
                    }
                    pool={pool}
                    selected={selectedPoolId === pool.id}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <SectionLabel>{riskProfile ? 'All opportunities' : 'Stellar DeFi pools'}</SectionLabel>
            <div className="mt-3 space-y-3">
              {others.map((pool) => (
                <PoolCard
                  expanded={expandedReputation === pool.id}
                  key={pool.id}
                  onSelect={() => setSelectedPoolId(selectedPoolId === pool.id ? null : pool.id)}
                  onToggleReputation={() =>
                    setExpandedReputation(expandedReputation === pool.id ? null : pool.id)
                  }
                  pool={pool}
                  selected={selectedPoolId === pool.id}
                />
              ))}
            </div>
          </div>
        </div>

        {selectedPool && (
          <aside>
            <StakeTicket
              available={selectedPool.asset === 'XLM' ? xlmBalance : usdcBalance}
              onPositionAdded={onPositionAdded}
              pool={selectedPool}
            />
          </aside>
        )}
      </div>

      {managingPosition && (
        <PositionManageModal
          onClose={() => setManagingPosition(null)}
          onWithdrawn={onWithdrawn}
          position={managingPosition}
        />
      )}

      {executingBundle && (
        <BundleExecuteModal
          bundle={executingBundle}
          onClose={() => setExecutingBundle(null)}
          onPositionAdded={onPositionAdded}
          usdcBalance={usdcBalance}
        />
      )}
    </div>
  )
}

// ─── Position Card ────────────────────────────────────────────────────────────

function PositionCard({
  onManage,
  position,
}: {
  onManage: () => void
  position: LocalPosition
}) {
  const elapsed = Date.now() - position.openedAt
  const hours = elapsed / 3_600_000
  const earned = position.amount * (position.apy / 100) * (hours / 8760)
  const isDemo = position.id.startsWith('demo-')

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#6B7B6B]/15 bg-white/65 transition-all duration-200 hover:border-[#4ade80]/30 hover:shadow-sm">
      {/* Left accent strip */}
      <div className="absolute inset-y-0 left-0 w-[3px] bg-[#4ade80]/50" />

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#6B7B6B]/10 py-3 pl-7 pr-5">
        <span className="rounded-md bg-[#1A2E1A] px-2.5 py-0.5 text-xs font-semibold text-[#F5F0E8]">
          {position.protocol}
        </span>
        <span className="rounded-md border border-[#6B7B6B]/20 px-2.5 py-0.5 text-xs text-[#6B7B6B]">
          {position.category}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#4ade80] opacity-50" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[#4ade80]" />
          </span>
          <span className="text-xs font-semibold text-[#4ade80]">Active</span>
        </div>
      </div>

      <div className="py-5 pl-7 pr-5">
        {/* Main figures */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B7B6B]">Staked</p>
            <p className="mt-1.5 text-3xl font-bold tabular-nums leading-none text-[#1A2E1A]">
              {position.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              <span className="ml-1.5 text-base font-normal text-[#6B7B6B]">{position.asset}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B7B6B]">Est. earned</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums leading-none text-[#4ade80]">
              +{earned < 0.01 ? earned.toFixed(4) : earned.toFixed(2)}
              <span className="ml-1 text-sm font-normal text-[#4ade80]/60">{position.asset}</span>
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#6B7B6B]/10 pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#6B7B6B]">APY</p>
            <p className="mt-1 text-sm font-semibold text-[#C8A84B]">{position.apy.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#6B7B6B]">Duration</p>
            <p className="mt-1 text-sm font-semibold text-[#1A2E1A]">{formatElapsed(elapsed)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#6B7B6B]">Opened</p>
            <p className="mt-1 text-sm font-semibold text-[#1A2E1A]">{position.timestamp}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between gap-4">
          {isDemo ? (
            <span className="text-xs text-[#6B7B6B]/50">Demo position</span>
          ) : (
            <a
              className="font-terminal text-xs text-[#6B7B6B] underline underline-offset-4 transition hover:text-[#1A2E1A]"
              href={`https://stellar.expert/explorer/testnet/tx/${position.hash}`}
              rel="noreferrer"
              target="_blank"
            >
              {position.hash.slice(0, 14)}…
            </a>
          )}
          <button
            className="rounded-xl bg-[#1A2E1A] px-5 py-2.5 text-sm font-semibold text-[#F5F0E8] transition-all duration-150 hover:bg-[#0F1F0F]"
            onClick={onManage}
            type="button"
          >
            Manage →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Position Manage Modal ────────────────────────────────────────────────────

function PositionManageModal({
  onClose,
  onWithdrawn,
  position,
}: {
  onClose: () => void
  onWithdrawn: (id: string, amount: number) => void
  position: LocalPosition
}) {
  const { networkPassphrase, networkUrl, publicKey, status } = useWallet()
  const [withdrawAmount, setWithdrawAmount] = useState(position.amount)
  const [txState, setTxState] = useState<'idle' | 'signing' | 'submitted' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txMessage, setTxMessage] = useState<string | null>(null)

  const elapsed = Date.now() - position.openedAt
  const hours = elapsed / 3_600_000
  const earned = position.amount * (position.apy / 100) * (hours / 8760)
  const isPartial = withdrawAmount < position.amount && withdrawAmount > 0

  const isTestnet = networkPassphrase?.toLowerCase().includes('test') ?? false
  const canSign =
    status === 'CONNECTED' && Boolean(publicKey) && Boolean(networkUrl) && Boolean(networkPassphrase) && isTestnet

  const handleWithdraw = async () => {
    setTxMessage(null)
    setTxHash(null)

    if (!publicKey || !networkUrl || !networkPassphrase) {
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
      const result = await executeMockTestnetWithdraw({
        amount: withdrawAmount,
        asset: position.asset,
        horizonUrl: networkUrl,
        networkPassphrase,
        publicKey,
      })
      setTxState('submitted')
      setTxHash(result.hash)
    } catch (error) {
      setTxState('error')
      setTxMessage(error instanceof Error ? error.message : 'Transaction failed.')
    }
  }

  const handleConfirmClose = () => {
    if (txState === 'submitted') {
      onWithdrawn(position.id, withdrawAmount)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F1F0F]/70 backdrop-blur-sm sm:items-center sm:px-4">
      <button
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={handleConfirmClose}
        type="button"
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-t-3xl border border-[#6B7B6B]/20 bg-[#F5F0E8] shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#6B7B6B]/15 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">Manage position</p>
            <h2 className="mt-0.5 text-lg font-semibold text-[#1A2E1A]">{position.protocol}</h2>
          </div>
          <button
            className="flex size-8 items-center justify-center rounded-full border border-[#6B7B6B]/20 text-[#6B7B6B] transition hover:border-[#1A2E1A]/30 hover:text-[#1A2E1A]"
            onClick={handleConfirmClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Position stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatBox
              label="Staked"
              value={`${position.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${position.asset}`}
            />
            <StatBox label="APY" value={`${position.apy.toFixed(1)}%`} highlight />
            <StatBox
              label="Est. earned"
              value={`+${earned < 0.01 ? earned.toFixed(4) : earned.toFixed(2)} ${position.asset}`}
              positive
            />
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl border border-[#6B7B6B]/12 bg-white/50 px-4 py-3 text-sm">
            <span className="text-[#6B7B6B]">Opened {formatElapsed(elapsed)} ago</span>
            {position.id.startsWith('demo-') ? (
              <span className="rounded-md bg-[#6B7B6B]/10 px-2 py-0.5 text-xs text-[#6B7B6B]">
                Demo position
              </span>
            ) : (
              <a
                className="font-terminal text-xs text-[#6B7B6B] underline underline-offset-4 hover:text-[#1A2E1A]"
                href={`https://stellar.expert/explorer/testnet/tx/${position.hash}`}
                rel="noreferrer"
                target="_blank"
              >
                {position.hash.slice(0, 10)}…
              </a>
            )}
          </div>

          {/* Withdraw section */}
          {txState !== 'submitted' && (
            <>
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1A2E1A]" htmlFor="withdraw-amount">
                    Withdraw amount
                  </label>
                  <span className="text-xs text-[#6B7B6B]">
                    {isPartial ? 'Partial' : 'Full'} withdrawal
                  </span>
                </div>
                <div className="relative mt-1.5">
                  <input
                    className="w-full rounded-xl border border-[#6B7B6B]/20 bg-white/65 px-3 py-3 pr-20 text-[#1A2E1A] outline-none transition focus:border-[#C8A84B]"
                    id="withdraw-amount"
                    max={position.amount}
                    min={0}
                    onChange={(e) =>
                      setWithdrawAmount(Math.min(Number(e.target.value), position.amount))
                    }
                    step={position.asset === 'USDC' ? 0.01 : 1}
                    type="number"
                    value={withdrawAmount}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3">
                    <span className="text-sm font-medium text-[#6B7B6B]">{position.asset}</span>
                    <button
                      className="rounded-md bg-[#C8A84B]/15 px-1.5 py-0.5 text-xs font-semibold text-[#C8A84B] transition hover:bg-[#C8A84B]/25"
                      onClick={() => setWithdrawAmount(position.amount)}
                      type="button"
                    >
                      Max
                    </button>
                  </div>
                </div>
                <input
                  aria-label="Withdraw amount slider"
                  className="mt-3 w-full accent-[#C8A84B]"
                  max={position.amount}
                  min={0}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  step={position.asset === 'USDC' ? 0.01 : 1}
                  type="range"
                  value={withdrawAmount}
                />
                <div className="mt-1 flex justify-between text-xs text-[#6B7B6B]">
                  <span>0</span>
                  <span>
                    {position.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                    {position.asset}
                  </span>
                </div>
              </div>

              {!isTestnet && status === 'CONNECTED' && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#C8A84B]/25 bg-[#C8A84B]/8 p-3 text-sm text-[#1A2E1A]">
                  <span className="mt-0.5 shrink-0 text-[#C8A84B]">⚠</span>
                  <p>
                    Switch Freighter to <strong>Testnet</strong> to run demo transactions.
                  </p>
                </div>
              )}

              {txMessage && txState === 'error' && (
                <p className="mt-3 rounded-xl border border-red-300/30 bg-red-50/70 px-4 py-3 text-sm text-red-700">
                  {txMessage}
                </p>
              )}

              <button
                className="mt-5 w-full rounded-xl bg-[#1A2E1A] py-3.5 text-sm font-semibold text-[#F5F0E8] transition duration-150 hover:bg-[#0F1F0F] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={withdrawAmount <= 0 || txState === 'signing' || !canSign}
                onClick={handleWithdraw}
                type="button"
              >
                {txState === 'signing'
                  ? 'Waiting for Freighter…'
                  : !canSign
                    ? status !== 'CONNECTED'
                      ? 'Connect wallet'
                      : 'Switch to Testnet'
                    : isPartial
                      ? `Sign partial withdrawal · ${withdrawAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${position.asset}`
                      : `Sign full withdrawal · ${position.amount} ${position.asset}`}
              </button>
              <p className="mt-2 text-center text-xs text-[#6B7B6B]">
                Demo sends 0.001 XLM to self · real Freighter approval
              </p>
            </>
          )}

          {/* Success state */}
          {txState === 'submitted' && txHash && (
            <div className="mt-4 rounded-2xl border border-[#4ade80]/30 bg-[#4ade80]/10 p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#4ade80] text-sm font-bold text-[#071C09]">
                  ✓
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1A2E1A]">Withdrawal confirmed</p>
                  <p className="mt-0.5 text-sm text-[#6B7B6B]">
                    {isPartial
                      ? `${withdrawAmount} ${position.asset} withdrawn · remaining position updated`
                      : `Full position closed · ${position.amount} ${position.asset} returned`}
                  </p>
                  <a
                    className="mt-3 block truncate rounded-lg border border-[#4ade80]/20 bg-white/60 px-3 py-2 font-terminal text-xs text-[#1A2E1A] transition hover:border-[#4ade80]/50"
                    href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {txHash}
                  </a>
                </div>
              </div>
              <button
                className="mt-4 w-full rounded-xl bg-[#1A2E1A] py-3 text-sm font-semibold text-[#F5F0E8] transition duration-150 hover:bg-[#0F1F0F]"
                onClick={handleConfirmClose}
                type="button"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Pool Card ────────────────────────────────────────────────────────────────

function PoolCard({
  expanded,
  onSelect,
  onToggleReputation,
  pool,
  selected,
}: {
  expanded: boolean
  onSelect: () => void
  onToggleReputation: () => void
  pool: DeFiPool
  selected: boolean
}) {
  const score = reputationTotal(pool.reputation)
  const label = reputationLabel(score)
  const pairLabel = pool.secondaryAsset ? `${pool.asset} / ${pool.secondaryAsset}` : pool.asset

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
        selected
          ? 'border-[#1A2E1A]/40 bg-white/80 shadow-sm'
          : 'border-[#6B7B6B]/15 bg-white/45 hover:border-[#6B7B6B]/30'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#1A2E1A] px-2 py-0.5 text-xs font-semibold text-[#F5F0E8]">
                {pool.protocol}
              </span>
              <span className="rounded-md border border-[#6B7B6B]/20 px-2 py-0.5 text-xs text-[#6B7B6B]">
                {pool.category}
              </span>
            </div>
            <p className="mt-2 text-base font-semibold text-[#1A2E1A]">{pairLabel}</p>
            <p className="mt-0.5 text-sm text-[#6B7B6B]">{pool.rationale}</p>
          </div>

          <button
            className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
              label === 'Trusted'
                ? 'border-[#4ade80]/30 bg-[#4ade80]/10 text-[#1A2E1A] hover:bg-[#4ade80]/20'
                : label === 'Moderate'
                  ? 'border-[#C8A84B]/30 bg-[#C8A84B]/10 text-[#1A2E1A] hover:bg-[#C8A84B]/20'
                  : 'border-red-400/25 bg-red-400/8 text-[#1A2E1A] hover:bg-red-400/15'
            }`}
            onClick={onToggleReputation}
            title="View trust score breakdown"
            type="button"
          >
            <span
              className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${
                label === 'Trusted'
                  ? 'bg-[#4ade80]'
                  : label === 'Moderate'
                    ? 'bg-[#C8A84B]'
                    : 'bg-red-400'
              }`}
            />
            {score} · {label}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Metric label="APY" value={`${pool.apy.toFixed(1)}%`} highlight />
          <Metric label="TVL" value={pool.tvl} />
          {pool.utilization !== undefined ? (
            <Metric label="Utilization" value={`${pool.utilization}%`} />
          ) : (
            <Metric label="24h Vol" value={pool.volume24h ?? '—'} />
          )}
        </div>

        {pool.utilization !== undefined && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-[#6B7B6B]/15">
              <div
                className="h-full rounded-full bg-[#C8A84B] transition-all duration-300"
                style={{ width: `${pool.utilization}%` }}
              />
            </div>
          </div>
        )}

        {expanded && <ReputationBreakdown reputation={pool.reputation} score={score} />}

        <div className="mt-4">
          <button
            className={`w-full rounded-xl border py-2.5 text-sm font-semibold transition-all duration-150 ${
              selected
                ? 'border-[#1A2E1A] bg-[#1A2E1A] text-[#F5F0E8]'
                : 'border-[#6B7B6B]/20 bg-[#F5F0E8]/60 text-[#1A2E1A] hover:border-[#1A2E1A]/30 hover:bg-white/60'
            }`}
            onClick={onSelect}
            type="button"
          >
            {selected ? 'Selected ✓' : 'Select pool →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Reputation Breakdown ─────────────────────────────────────────────────────

function ReputationBreakdown({
  reputation,
  score,
}: {
  reputation: DeFiPool['reputation']
  score: number
}) {
  const rows = [
    { label: 'Liquidity', value: reputation.liquidity, max: 40 },
    { label: 'Protocol Age', value: reputation.age, max: 20 },
    { label: 'Audit Status', value: reputation.audit, max: 20 },
    { label: 'Activity', value: reputation.activity, max: 20 },
  ]

  return (
    <div className="mt-4 rounded-xl border border-[#6B7B6B]/15 bg-[#F5F0E8]/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.14em] text-[#6B7B6B]">Trust Score</p>
        <p className="text-sm font-bold text-[#1A2E1A]">{score}/100</p>
      </div>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-[#6B7B6B]">{row.label}</span>
              <span className="font-medium text-[#1A2E1A]">
                {row.value}/{row.max}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#6B7B6B]/15">
              <div
                className="h-full rounded-full bg-[#1A2E1A] transition-all duration-300"
                style={{ width: `${(row.value / row.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Stake Ticket ─────────────────────────────────────────────────────────────

function StakeTicket({
  available,
  onPositionAdded,
  pool,
}: {
  available: number
  onPositionAdded: (pos: Omit<LocalPosition, 'id'>) => void
  pool: DeFiPool
}) {
  const { networkPassphrase, networkUrl, publicKey, sorobanRpcUrl, status } = useWallet()
  const [amount, setAmount] = useState(0)
  const [txState, setTxState] = useState<'idle' | 'signing' | 'submitted' | 'error'>('idle')
  const [txMessage, setTxMessage] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const isLP = pool.category === 'AMM LP' || pool.category === 'AMM Rewards'
  const secondaryAsset = pool.secondaryAsset as 'XLM' | 'USDC' | undefined
  const secondaryAmount = isLP && secondaryAsset && (secondaryAsset === 'XLM' || secondaryAsset === 'USDC')
    ? estimateSecondaryAmount(pool.asset, amount)
    : 0

  const isTestnet = networkPassphrase?.toLowerCase().includes('test') ?? false
  const isConnected =
    status === 'CONNECTED' && Boolean(publicKey) && Boolean(networkUrl) && Boolean(networkPassphrase)
  const canSign = isConnected && isTestnet

  const handleExecute = async () => {
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
        // Real Soroswap addLiquidity call
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
        // Lending pools or unsupported pairs → mock supply tx
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
        openedAt: Date.now(),
        apy: pool.apy,
        category: pool.category,
        poolId: pool.id,
      })
    } catch (error) {
      setTxState('error')
      setTxMessage(error instanceof Error ? error.message : 'Transaction failed.')
    }
  }

  const buttonLabel = () => {
    if (txState === 'signing') return 'Waiting for Freighter…'
    if (!isConnected) return 'Connect wallet'
    if (!isTestnet) return 'Switch to Testnet'
    if (isLP) return `Add liquidity · ${amount} ${pool.asset}`
    return `Sign & supply · ${amount} ${pool.asset}`
  }

  return (
    <div className="sticky top-4 rounded-2xl border border-[#6B7B6B]/20 bg-white/60 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">
            {pool.category === 'Lending' ? 'Supply' : 'Add Liquidity'}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#1A2E1A]">{pool.protocol}</h2>
        </div>
        <span className="rounded-lg border border-[#6B7B6B]/15 bg-[#F5F0E8]/60 px-2.5 py-1 text-xs font-medium text-[#6B7B6B]">
          Testnet demo
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-[#1A2E1A] p-4 text-[#F5F0E8]">
        <p className="text-xs text-[#F5F0E8]/50">Available {pool.asset}</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">
          {available.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </p>
        <p className="mt-1 text-xs text-[#F5F0E8]/40">{pool.asset} · Freighter balance</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <TicketStat label="Target APY" value={`${pool.apy.toFixed(1)}%`} />
        <TicketStat label="Method" value={pool.method} mono />
      </div>

      <label className="mt-5 block text-sm font-medium text-[#1A2E1A]" htmlFor="stake-amount">
        Amount to supply
      </label>
      <div className="relative mt-1.5">
        <input
          className="w-full rounded-xl border border-[#6B7B6B]/20 bg-[#F5F0E8]/65 px-3 py-3 pr-20 text-[#1A2E1A] outline-none transition focus:border-[#C8A84B]"
          id="stake-amount"
          max={available}
          min={0}
          onChange={(e) => setAmount(Math.min(Number(e.target.value), available))}
          type="number"
          value={amount}
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3">
          <span className="text-sm font-medium text-[#6B7B6B]">{pool.asset}</span>
          <button
            className="rounded-md bg-[#C8A84B]/15 px-1.5 py-0.5 text-xs font-semibold text-[#C8A84B] transition hover:bg-[#C8A84B]/25"
            onClick={() => setAmount(available)}
            type="button"
          >
            Max
          </button>
        </div>
      </div>
      <input
        aria-label="Stake amount slider"
        className="mt-3 w-full accent-[#C8A84B]"
        max={available}
        min={0}
        onChange={(e) => setAmount(Number(e.target.value))}
        step={pool.asset === 'USDC' ? 0.01 : 1}
        type="range"
        value={amount}
      />

      {isLP && secondaryAsset && amount > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-[#6B7B6B]/15 bg-[#F5F0E8]/60 px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#6B7B6B]">Paired amount</p>
            <p className="mt-0.5 text-sm font-semibold text-[#1A2E1A]">
              {secondaryAmount.toFixed(4)}{' '}
              <span className="font-normal text-[#6B7B6B]">{secondaryAsset}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#6B7B6B]">Est. ratio</p>
            <p className="mt-0.5 font-terminal text-xs text-[#6B7B6B]">
              1 {pool.asset} ≈ {(secondaryAmount / amount).toFixed(4)} {secondaryAsset}
            </p>
          </div>
        </div>
      )}

      {!isTestnet && isConnected && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#C8A84B]/25 bg-[#C8A84B]/8 p-3 text-sm text-[#1A2E1A]">
          <span className="mt-0.5 shrink-0 text-[#C8A84B]">⚠</span>
          <p>
            Switch Freighter to <strong>Testnet</strong> to run demo transactions.
          </p>
        </div>
      )}

      <button
        className="mt-5 w-full rounded-xl bg-[#1A2E1A] py-3.5 text-sm font-semibold text-[#F5F0E8] transition duration-150 hover:bg-[#0F1F0F] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={amount <= 0 || available <= 0 || txState === 'signing' || !canSign}
        onClick={handleExecute}
        type="button"
      >
        {buttonLabel()}
      </button>

      <p className="mt-2.5 text-center text-xs text-[#6B7B6B]">
        Demo sends 0.001 XLM to self · real Freighter approval
      </p>

      {txMessage && txState === 'error' && (
        <p className="mt-3 rounded-xl border border-red-300/30 bg-red-50/70 px-4 py-3 text-sm text-red-700">
          {txMessage}
        </p>
      )}

      {txState === 'submitted' && txHash && (
        <div className="mt-4 rounded-xl border border-[#4ade80]/30 bg-[#4ade80]/10 p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#4ade80] text-xs font-bold text-[#071C09]">
              ✓
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-[#1A2E1A]">Supply confirmed</p>
              <p className="mt-0.5 text-xs text-[#6B7B6B]">Position added to your open positions</p>
              <a
                className="mt-2 block truncate rounded-lg border border-[#4ade80]/20 bg-white/50 px-3 py-2 font-terminal text-xs text-[#1A2E1A] transition hover:border-[#4ade80]/50"
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
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────


function formatElapsed(ms: number) {
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7B6B]">{children}</p>
  )
}

function PortfolioWidget({
  onRetakeQuiz,
  riskProfile,
  usdcBalance,
  xlmBalance,
}: {
  onRetakeQuiz: () => void
  riskProfile: RiskProfile | null
  usdcBalance: number
  xlmBalance: number
}) {
  const totalEst = xlmBalance * 0.12 + usdcBalance
  const riskDot =
    riskProfile === 'Conservative'
      ? 'bg-[#4ade80]'
      : riskProfile === 'Moderate'
        ? 'bg-[#C8A84B]'
        : 'bg-orange-400'

  return (
    <div className="rounded-2xl border border-[#6B7B6B]/15 bg-white/65 px-5 py-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="border-r border-[#6B7B6B]/15 pr-6">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#6B7B6B]">Portfolio</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#1A2E1A]">${totalEst.toFixed(2)}</p>
          <p className="mt-0.5 text-[10px] text-[#6B7B6B]/60">~estimate · Testnet</p>
        </div>

        <div className="flex items-center gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#6B7B6B]">XLM</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-[#1A2E1A]">{xlmBalance.toFixed(2)}</p>
          </div>
          <div className="h-6 w-px bg-[#6B7B6B]/15" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#6B7B6B]">USDC</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-[#1A2E1A]">{usdcBalance.toFixed(2)}</p>
          </div>
        </div>

        {riskProfile && (
          <div className="flex items-center gap-2 rounded-xl border border-[#6B7B6B]/15 bg-[#F5F0E8]/70 px-3 py-2">
            <span className={`size-2 rounded-full ${riskDot}`} />
            <span className="text-sm font-medium text-[#1A2E1A]">{riskProfile}</span>
            <span className="text-[#6B7B6B]/40">·</span>
            <button
              className="text-xs text-[#6B7B6B] underline underline-offset-4 transition hover:text-[#1A2E1A]"
              onClick={onRetakeQuiz}
              type="button"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({
  highlight,
  label,
  value,
}: {
  highlight?: boolean
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-xs text-[#6B7B6B]">{label}</p>
      <p
        className={`mt-0.5 text-base font-semibold ${highlight ? 'text-[#4ade80]' : 'text-[#1A2E1A]'}`}
      >
        {value}
      </p>
    </div>
  )
}


function StatBox({
  highlight,
  label,
  positive,
  value,
}: {
  highlight?: boolean
  label: string
  positive?: boolean
  value: string
}) {
  return (
    <div className="rounded-xl border border-[#6B7B6B]/15 bg-white/60 p-3">
      <p className="text-xs text-[#6B7B6B]">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold ${
          positive ? 'text-[#4ade80]' : highlight ? 'text-[#C8A84B]' : 'text-[#1A2E1A]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function TicketStat({ label, mono, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="rounded-xl border border-[#6B7B6B]/15 bg-[#F5F0E8]/60 p-3">
      <p className="text-xs text-[#6B7B6B]">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold text-[#1A2E1A] ${mono ? 'font-terminal' : ''}`}>
        {value}
      </p>
    </div>
  )
}

// ─── Bundle Card ──────────────────────────────────────────────────────────────

function BundleCard({
  bundle,
  isRecommended,
  onExecute,
}: {
  bundle: YieldBundle
  isRecommended: boolean
  onExecute: () => void
}) {
  const barColors = ['bg-[#1A2E1A]', 'bg-[#C8A84B]', 'bg-[#4ade80]']

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${
        isRecommended
          ? `${bundle.borderActive} ${bundle.bgActive} shadow-sm`
          : 'border-[#6B7B6B]/15 bg-white/50 hover:border-[#6B7B6B]/30'
      }`}
    >
      {isRecommended && (
        <div className={`absolute right-0 top-0 rounded-bl-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${bundle.bgActive} ${bundle.textColor} border-b border-l ${bundle.borderActive}`}>
          Recommended
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${bundle.dotColor}`} />
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B7B6B]">
                {bundle.risk}
              </p>
            </div>
            <h3 className="mt-1.5 text-lg font-bold text-[#1A2E1A]">{bundle.name}</h3>
            <p className="text-sm text-[#6B7B6B]">{bundle.tagline}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#6B7B6B]">Est. APY</p>
            <p className={`mt-0.5 text-xl font-bold ${bundle.textColor}`}>
              {bundle.estApy.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {bundle.allocations.map((alloc, i) => (
            <div key={alloc.poolId}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-[#6B7B6B]">{alloc.label}</span>
                <span className="font-semibold text-[#1A2E1A]">{alloc.pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#6B7B6B]/12">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColors[i % barColors.length]}`}
                  style={{ width: `${alloc.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          className={`mt-5 w-full rounded-xl py-2.5 text-sm font-semibold transition-all duration-150 ${
            isRecommended
              ? 'bg-[#1A2E1A] text-[#F5F0E8] hover:bg-[#0F1F0F]'
              : 'border border-[#6B7B6B]/20 bg-white/60 text-[#1A2E1A] hover:border-[#1A2E1A]/30 hover:bg-white/80'
          }`}
          onClick={onExecute}
          type="button"
        >
          Execute bundle →
        </button>
      </div>
    </div>
  )
}

// ─── Bundle Execute Modal ─────────────────────────────────────────────────────

type StepStatus = 'pending' | 'running' | 'done' | 'error'

type ExecStep = {
  label: string
  status: StepStatus
  hash?: string
  error?: string
}

function BundleExecuteModal({
  bundle,
  onClose,
  onPositionAdded,
  usdcBalance,
}: {
  bundle: YieldBundle
  onClose: () => void
  onPositionAdded: (pos: Omit<LocalPosition, 'id'>) => void
  usdcBalance: number
}) {
  const { networkPassphrase, networkUrl, publicKey, sorobanRpcUrl, status } = useWallet()
  const [amount, setAmount] = useState(0)
  const [steps, setSteps] = useState<ExecStep[]>([])
  const [executing, setExecuting] = useState(false)
  const [done, setDone] = useState(false)

  const isConnected = status === 'CONNECTED' && Boolean(publicKey) && Boolean(networkUrl) && Boolean(networkPassphrase)
  const isTestnet = networkPassphrase?.toLowerCase().includes('test') ?? false
  const canExecute = isConnected && isTestnet && amount > 0

  const maxAmount = usdcBalance

  const preview = bundle.allocations.map((alloc) => ({
    ...alloc,
    amount: (amount * alloc.pct) / 100,
  }))

  const updateStep = (index: number, patch: Partial<ExecStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const handleExecute = async () => {
    if (!canExecute || !publicKey || !networkUrl || !networkPassphrase) return

    const initialSteps: ExecStep[] = bundle.allocations.map((alloc) => ({
      label: `${alloc.label} — ${((amount * alloc.pct) / 100).toFixed(2)} ${alloc.asset}`,
      status: 'pending',
    }))
    setSteps(initialSteps)
    setExecuting(true)

    for (let i = 0; i < bundle.allocations.length; i++) {
      const alloc = bundle.allocations[i]
      const allocAmount = (amount * alloc.pct) / 100

      updateStep(i, { status: 'running' })

      try {
        let result: { hash: string; status: string }

        if (alloc.category === 'AMM LP' && sorobanRpcUrl) {
          const secondaryAmt = estimateSecondaryAmount(alloc.asset, allocAmount)
          const tokenB = alloc.asset === 'XLM' ? 'USDC' : 'XLM'
          result = await executeSoroswapAddLiquidity({
            amountA: allocAmount,
            amountB: secondaryAmt,
            horizonUrl: networkUrl,
            networkPassphrase,
            publicKey,
            sorobanRpcUrl,
            tokenA: alloc.asset,
            tokenB,
          })
        } else {
          result = await executeMockTestnetSupply({
            amount: allocAmount,
            asset: alloc.asset,
            horizonUrl: networkUrl,
            networkPassphrase,
            protocol: bundle.name,
            publicKey,
          })
        }

        updateStep(i, { status: 'done', hash: result.hash })

        onPositionAdded({
          amount: allocAmount,
          asset: alloc.asset,
          hash: result.hash,
          protocol: alloc.label,
          status: result.status,
          timestamp: new Date().toLocaleTimeString(),
          openedAt: Date.now(),
          apy: stellarPools.find((p) => p.id === alloc.poolId)?.apy ?? 4,
          category: alloc.category,
          poolId: alloc.poolId,
        })
      } catch (e) {
        updateStep(i, {
          status: 'error',
          error: e instanceof Error ? e.message : 'Transaction failed.',
        })
        break
      }
    }

    setExecuting(false)
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F1F0F]/70 backdrop-blur-sm sm:items-center sm:px-4">
      <button className="absolute inset-0 cursor-default" onClick={onClose} type="button" />

      <div className="relative w-full max-w-lg overflow-hidden rounded-t-3xl border border-[#6B7B6B]/20 bg-[#F5F0E8] shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#6B7B6B]/15 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${bundle.dotColor}`} />
              <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">{bundle.risk}</p>
            </div>
            <h2 className="mt-0.5 text-lg font-semibold text-[#1A2E1A]">{bundle.name} Bundle</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xl font-bold ${bundle.textColor}`}>{bundle.estApy.toFixed(1)}% est.</span>
            <button
              className="flex size-8 items-center justify-center rounded-full border border-[#6B7B6B]/20 text-[#6B7B6B] transition hover:border-[#1A2E1A]/30 hover:text-[#1A2E1A]"
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {!executing && !done && (
            <>
              <label className="block text-sm font-medium text-[#1A2E1A]" htmlFor="bundle-amount">
                Total amount to invest
              </label>
              <div className="relative mt-1.5">
                <input
                  className="w-full rounded-xl border border-[#6B7B6B]/20 bg-white/65 px-3 py-3 pr-24 text-[#1A2E1A] outline-none transition focus:border-[#C8A84B]"
                  id="bundle-amount"
                  max={maxAmount}
                  min={0}
                  onChange={(e) => setAmount(Math.min(Number(e.target.value), maxAmount))}
                  type="number"
                  value={amount}
                />
                <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3">
                  <span className="text-sm font-medium text-[#6B7B6B]">USDC</span>
                  <button
                    className="rounded-md bg-[#C8A84B]/15 px-1.5 py-0.5 text-xs font-semibold text-[#C8A84B] hover:bg-[#C8A84B]/25"
                    onClick={() => setAmount(maxAmount)}
                    type="button"
                  >
                    Max
                  </button>
                </div>
              </div>

              {amount > 0 && (
                <div className="mt-4 space-y-2 rounded-xl border border-[#6B7B6B]/15 bg-white/50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7B6B]">
                    Allocation preview
                  </p>
                  {preview.map((alloc, i) => {
                    const barColors = ['bg-[#1A2E1A]', 'bg-[#C8A84B]', 'bg-[#4ade80]']
                    return (
                      <div className="flex items-center justify-between gap-4" key={alloc.poolId}>
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${barColors[i % barColors.length]}`} />
                          <span className="text-sm text-[#6B7B6B]">{alloc.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-[#1A2E1A]">
                          {alloc.amount.toFixed(2)} {alloc.asset}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {!isTestnet && isConnected && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#C8A84B]/25 bg-[#C8A84B]/8 p-3 text-sm text-[#1A2E1A]">
                  <span className="shrink-0 text-[#C8A84B]">⚠</span>
                  <p>Switch Freighter to <strong>Testnet</strong> to execute bundles.</p>
                </div>
              )}

              <button
                className="mt-5 w-full rounded-xl bg-[#1A2E1A] py-3.5 text-sm font-semibold text-[#F5F0E8] transition hover:bg-[#0F1F0F] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canExecute}
                onClick={handleExecute}
                type="button"
              >
                {!isConnected ? 'Connect wallet' : !isTestnet ? 'Switch to Testnet' : `Execute ${bundle.allocations.length} transactions →`}
              </button>
              <p className="mt-2 text-center text-xs text-[#6B7B6B]">
                Each allocation is a separate Freighter signature
              </p>
            </>
          )}

          {(executing || done) && steps.length > 0 && (
            <div>
              <p className="mb-4 text-sm font-medium text-[#1A2E1A]">
                {done ? 'Execution complete' : 'Executing bundle…'}
              </p>
              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div
                    className={`flex items-start gap-3 rounded-xl border p-4 transition-all duration-300 ${
                      step.status === 'done'
                        ? 'border-[#4ade80]/25 bg-[#4ade80]/8'
                        : step.status === 'running'
                          ? 'border-[#C8A84B]/25 bg-[#C8A84B]/8'
                          : step.status === 'error'
                            ? 'border-red-300/30 bg-red-50/60'
                            : 'border-[#6B7B6B]/15 bg-white/40'
                    }`}
                    key={i}
                  >
                    <span
                      className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        step.status === 'done'
                          ? 'bg-[#4ade80] text-[#071C09]'
                          : step.status === 'running'
                            ? 'bg-[#C8A84B] text-[#1A2E1A]'
                            : step.status === 'error'
                              ? 'bg-red-400 text-white'
                              : 'border border-[#6B7B6B]/20 bg-transparent text-[#6B7B6B]'
                      }`}
                    >
                      {step.status === 'done' ? '✓' : step.status === 'running' ? '…' : step.status === 'error' ? '✗' : String(i + 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1A2E1A]">{step.label}</p>
                      {step.hash && (
                        <a
                          className="mt-1 block truncate font-terminal text-xs text-[#6B7B6B] underline underline-offset-4 hover:text-[#1A2E1A]"
                          href={`https://stellar.expert/explorer/testnet/tx/${step.hash}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {step.hash.slice(0, 20)}…
                        </a>
                      )}
                      {step.error && (
                        <p className="mt-1 text-xs text-red-600">{step.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {done && (
                <button
                  className="mt-5 w-full rounded-xl bg-[#1A2E1A] py-3 text-sm font-semibold text-[#F5F0E8] transition hover:bg-[#0F1F0F]"
                  onClick={onClose}
                  type="button"
                >
                  Done — view positions
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Portfolio Allocation ─────────────────────────────────────────────────────

function PortfolioAllocation({
  positions,
  riskProfile,
}: {
  positions: LocalPosition[]
  riskProfile: RiskProfile | null
}) {
  const totalValue = positions.reduce(
    (s, p) => s + p.amount * (p.asset === 'USDC' ? 1 : 0.12),
    0,
  )

  const categories: { id: string; label: string; color: string; bg: string; target?: number }[] = [
    { id: 'Lending', label: 'Lending', color: 'bg-[#1A2E1A]', bg: 'bg-[#1A2E1A]/10',
      target: riskProfile === 'Conservative' ? 100 : riskProfile === 'Moderate' ? 50 : 25 },
    { id: 'AMM LP', label: 'AMM LP', color: 'bg-[#C8A84B]', bg: 'bg-[#C8A84B]/10',
      target: riskProfile === 'Conservative' ? 0 : riskProfile === 'Moderate' ? 50 : 40 },
    { id: 'AMM Rewards', label: 'Rewards', color: 'bg-[#4ade80]', bg: 'bg-[#4ade80]/10',
      target: riskProfile === 'Conservative' ? 0 : riskProfile === 'Moderate' ? 0 : 35 },
  ]

  const stats = categories.map((cat) => {
    const value = positions
      .filter((p) => p.category === cat.id)
      .reduce((s, p) => s + p.amount * (p.asset === 'USDC' ? 1 : 0.12), 0)
    const pct = totalValue > 0 ? (value / totalValue) * 100 : 0
    return { ...cat, value, pct }
  }).filter((c) => c.value > 0 || (c.target ?? 0) > 0)

  return (
    <div className="rounded-2xl border border-[#6B7B6B]/15 bg-white/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <SectionLabel>Portfolio Allocation</SectionLabel>
        <span className="font-terminal text-xs text-[#6B7B6B]">
          ~${totalValue.toFixed(0)} total
        </span>
      </div>

      <div className="space-y-3">
        {stats.map((cat) => (
          <div key={cat.id}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${cat.color}`} />
                <span className="font-medium text-[#1A2E1A]">{cat.label}</span>
              </div>
              <div className="flex items-center gap-3">
                {cat.target !== undefined && (
                  <span className="text-[#6B7B6B]">target {cat.target}%</span>
                )}
                <span className="font-semibold text-[#1A2E1A]">{cat.pct.toFixed(0)}%</span>
              </div>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-[#6B7B6B]/12">
              {cat.target !== undefined && cat.target > 0 && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full border-r-2 border-[#6B7B6B]/30 bg-transparent"
                  style={{ width: `${cat.target}%` }}
                />
              )}
              <div
                className={`h-full rounded-full transition-all duration-700 ${cat.color}`}
                style={{ width: `${Math.min(cat.pct, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {riskProfile && (
        <p className="mt-3 text-[10px] text-[#6B7B6B]">
          Dashed lines show target allocation for <strong>{riskProfile}</strong> profile
        </p>
      )}
    </div>
  )
}
