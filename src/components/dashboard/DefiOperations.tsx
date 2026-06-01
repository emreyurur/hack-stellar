import { useMemo, useState } from 'react'
import { yieldPositions } from '../../data/stellarMock'
import { useWallet } from '../../context/useWallet'
import { useWalletBalances } from '../../hooks/useWalletBalances'
import { executeBlendTestnetSupply } from '../../services/blendSupply'
import type { RiskProfile } from '../../types/stellar'

type StakeAsset = 'XLM' | 'USDC'

type StakeRecommendation = {
  id: string
  risk: RiskProfile
  title: string
  protocol: string
  category: 'Lending' | 'AMM LP' | 'AMM Rewards'
  asset: StakeAsset
  apy: number
  allocation: number
  liquidity: string
  method: 'supply()' | 'addLiquidity()'
  rationale: string
}

type LocalPosition = {
  id: string
  amount: number
  asset: StakeAsset
  hash: string
  protocol: string
  status: string
  timestamp: string
  type: string
}

const riskProfiles: {
  id: RiskProfile
  summary: string
  tone: string
  fixed: number
  variable: number
}[] = [
  {
    id: 'Conservative',
    summary: 'Stable USDC lending first, minimal LP volatility.',
    tone: 'Capital protection',
    fixed: 80,
    variable: 20,
  },
  {
    id: 'Moderate',
    summary: 'Balanced split between fixed yield and XLM exposure.',
    tone: 'Balanced growth',
    fixed: 50,
    variable: 50,
  },
  {
    id: 'Aggressive',
    summary: 'Higher LP and vault exposure for stronger APY.',
    tone: 'Maximum yield',
    fixed: 25,
    variable: 75,
  },
]

const recommendations: StakeRecommendation[] = [
  {
    id: 'usdc-fixed-conservative',
    risk: 'Conservative',
    title: 'Blend USDC lending supply',
    protocol: 'Blend lending pool',
    category: 'Lending',
    asset: 'USDC',
    apy: 4.2,
    allocation: 80,
    liquidity: 'Withdraw if pool liquidity allows',
    method: 'supply()',
    rationale: 'Supply idle USDC to a non-custodial Blend lending pool for borrower-paid yield.',
  },
  {
    id: 'xlm-base-conservative',
    risk: 'Conservative',
    title: 'Blend XLM lending reserve',
    protocol: 'Blend lending pool',
    category: 'Lending',
    asset: 'XLM',
    apy: 5.1,
    allocation: 20,
    liquidity: 'Withdraw if pool liquidity allows',
    method: 'supply()',
    rationale: 'Supply a small XLM tranche while preserving nativeBalance for fees and reserves.',
  },
  {
    id: 'usdc-fixed-moderate',
    risk: 'Moderate',
    title: 'Blend USDC lending tranche',
    protocol: 'Blend lending pool',
    category: 'Lending',
    asset: 'USDC',
    apy: 4.2,
    allocation: 50,
    liquidity: 'Withdraw if pool liquidity allows',
    method: 'supply()',
    rationale: 'Anchor the profile with fixed yield before routing the rest into variable exposure.',
  },
  {
    id: 'xlm-lp-moderate',
    risk: 'Moderate',
    title: 'Soroswap XLM / USDC LP',
    protocol: 'Soroswap AMM pair',
    category: 'AMM LP',
    asset: 'XLM',
    apy: 12.5,
    allocation: 50,
    liquidity: 'LP tokens redeemable',
    method: 'addLiquidity()',
    rationale: 'Provide paired liquidity to a Soroban constant-product AMM and earn pool fees.',
  },
  {
    id: 'xlm-aggressive-vault',
    risk: 'Aggressive',
    title: 'Aquarius AQUA / XLM rewards LP',
    protocol: 'Aquarius AMM rewards',
    category: 'AMM Rewards',
    asset: 'XLM',
    apy: 7.8,
    allocation: 35,
    liquidity: 'Pool withdrawal',
    method: 'addLiquidity()',
    rationale: 'Use XLM-side liquidity in an Aquarius AMM rewards market for incentivized LP yield.',
  },
  {
    id: 'xlm-aggressive-lp',
    risk: 'Aggressive',
    title: 'Soroswap AQUA / XLM LP overweight',
    protocol: 'Soroswap AMM pair',
    category: 'AMM LP',
    asset: 'XLM',
    apy: 12.5,
    allocation: 65,
    liquidity: 'LP tokens redeemable',
    method: 'addLiquidity()',
    rationale: 'Higher variable-yield LP route for users comfortable with AMM price exposure.',
  },
]

export function DefiOperations() {
  const { networkPassphrase, networkUrl, publicKey, sorobanRpcUrl, status } = useWallet()
  const { balances, balanceError, balanceStatus } = useWalletBalances()
  const [risk, setRisk] = useState<RiskProfile>('Moderate')
  const riskOptions = useMemo(() => recommendations.filter((item) => item.risk === risk), [risk])
  const [selectedRecommendationId, setSelectedRecommendationId] = useState('usdc-fixed-moderate')
  const selectedRecommendation =
    riskOptions.find((item) => item.id === selectedRecommendationId) ?? riskOptions[0]
  const [stakeAmountByAsset, setStakeAmountByAsset] = useState<Record<StakeAsset, number>>({
    XLM: 0,
    USDC: 0,
  })
  const [localPositions, setLocalPositions] = useState<LocalPosition[]>([])

  const xlmBalance = getAvailableBalance(balances, 'XLM')
  const usdcBalance = getAvailableBalance(balances, 'USDC')
  const selectedAvailable = selectedRecommendation.asset === 'XLM' ? xlmBalance : usdcBalance
  const currentAmount = stakeAmountByAsset[selectedRecommendation.asset]
  const clampedAmount = Math.min(Math.max(currentAmount, 0), selectedAvailable)
  const selectedRisk = riskProfiles.find((profile) => profile.id === risk) ?? riskProfiles[1]

  const updateStakeAmount = (nextAmount: number) => {
    setStakeAmountByAsset((current) => ({
      ...current,
      [selectedRecommendation.asset]: nextAmount,
    }))
  }

  const canExecuteRealSupply =
    status === 'CONNECTED' &&
    selectedRecommendation.category === 'Lending' &&
    Boolean(publicKey) &&
    Boolean(networkUrl) &&
    Boolean(networkPassphrase) &&
    Boolean(sorobanRpcUrl)

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-[#6B7B6B]/20 bg-white/45">
        <div className="border-b border-[#6B7B6B]/15 bg-[#102510] px-6 py-6 text-[#F5F0E8]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#C8A84B]">
                DeFi Operations
              </p>
              <h2 className="mt-2 text-3xl font-semibold">Risk profile and DeFi planner</h2>
              <p className="mt-2 max-w-2xl text-sm text-[#F5F0E8]/65">
                Pick a risk lane first. The ticket updates to real Stellar DeFi primitives:
                Blend lending, Soroswap LP, and Aquarius AMM rewards.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-80">
              <DarkBalance label="XLM available" value={`${formatAmount(xlmBalance)} XLM`} />
              <DarkBalance label="USDC available" value={`${formatAmount(usdcBalance)} USDC`} />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-3 lg:grid-cols-3">
            {riskProfiles.map((profile) => (
              <button
                aria-pressed={risk === profile.id}
                className={`rounded-xl border p-5 text-left transition ${
                  risk === profile.id
                    ? 'border-[#C8A84B]/80 bg-[#C8A84B]/15'
                    : 'border-[#6B7B6B]/15 bg-[#F5F0E8]/55 hover:border-[#C8A84B]/50'
                }`}
                key={profile.id}
                onClick={() => {
                  setRisk(profile.id)
                  setSelectedRecommendationId(
                    recommendations.find((item) => item.risk === profile.id)?.id ?? selectedRecommendationId,
                  )
                }}
                type="button"
              >
                <span className="text-xs uppercase tracking-[0.14em] text-[#6B7B6B]">
                  {profile.tone}
                </span>
                <span className="mt-2 block text-xl font-semibold text-[#1A2E1A]">
                  {profile.id}
                </span>
                <span className="mt-2 block text-sm text-[#6B7B6B]">{profile.summary}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <section className="rounded-xl border border-[#6B7B6B]/15 bg-[#F5F0E8]/60 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">
                      Recommended Strategy
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-[#1A2E1A]">
                      {selectedRecommendation.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm text-[#6B7B6B]">
                      {selectedRecommendation.rationale}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-right">
                    <Metric label="Asset" value={selectedRecommendation.asset} />
                    <Metric label="Type" value={selectedRecommendation.category} />
                    <Metric label="APY" value={`${selectedRecommendation.apy.toFixed(1)}%`} positive />
                  </div>
                </div>

                <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-[#6B7B6B]/15">
                  <div className="bg-[#C8A84B]" style={{ width: `${selectedRisk.fixed}%` }} />
                  <div className="bg-[#4ade80]" style={{ width: `${selectedRisk.variable}%` }} />
                </div>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <Allocation label="Fixed Yield" value={`${selectedRisk.fixed}% USDC Lending`} />
                  <Allocation label="Variable Yield" value={`${selectedRisk.variable}% LP / Vault`} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {riskOptions.map((item) => (
                    <button
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        selectedRecommendation.id === item.id
                          ? 'border-[#C8A84B]/80 bg-[#C8A84B]/15 text-[#1A2E1A]'
                          : 'border-[#6B7B6B]/15 bg-white/35 text-[#6B7B6B] hover:text-[#1A2E1A]'
                      }`}
                      key={item.id}
                      onClick={() => setSelectedRecommendationId(item.id)}
                      type="button"
                    >
                      {item.category} - {item.asset} - {item.apy.toFixed(1)}%
                    </button>
                  ))}
                </div>
              </section>

              <OpenPositions localPositions={localPositions} />
            </div>

            <StakeTicket
              amount={clampedAmount}
              available={selectedAvailable}
              balanceError={balanceError}
              balanceStatus={balanceStatus}
              canExecuteRealSupply={canExecuteRealSupply}
              horizonUrl={networkUrl}
              networkPassphrase={networkPassphrase}
              onSubmitted={(position) =>
                setLocalPositions((current) => [
                  {
                    ...position,
                    id: `${position.hash}-${Date.now()}`,
                  },
                  ...current,
                ])
              }
              onAmountChange={updateStakeAmount}
              publicKey={publicKey}
              recommendation={selectedRecommendation}
              risk={risk}
              sorobanRpcUrl={sorobanRpcUrl}
            />
          </div>

        </div>
      </section>
    </div>
  )
}

function StakeTicket({
  amount,
  available,
  balanceError,
  balanceStatus,
  canExecuteRealSupply,
  horizonUrl,
  networkPassphrase,
  onSubmitted,
  onAmountChange,
  publicKey,
  recommendation,
  risk,
  sorobanRpcUrl,
}: {
  amount: number
  available: number
  balanceError: string | null
  balanceStatus: string
  canExecuteRealSupply: boolean
  horizonUrl: string | null
  networkPassphrase: string | null
  onSubmitted: (position: Omit<LocalPosition, 'id'>) => void
  onAmountChange: (value: number) => void
  publicKey: string | null
  recommendation: StakeRecommendation
  risk: RiskProfile
  sorobanRpcUrl: string | null
}) {
  const [txState, setTxState] = useState<'idle' | 'signing' | 'submitted' | 'error'>('idle')
  const [txMessage, setTxMessage] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const handleExecute = async () => {
    setTxMessage(null)
    setTxHash(null)

    if (recommendation.category !== 'Lending') {
      setTxState('error')
      setTxMessage('LP execution requires paired-asset quote and reserve ratio calculation first.')
      return
    }

    if (!canExecuteRealSupply || !publicKey || !horizonUrl || !networkPassphrase || !sorobanRpcUrl) {
      setTxState('error')
      setTxMessage('Connect a Freighter Testnet wallet before signing.')
      return
    }

    try {
      setTxState('signing')
      const result = await executeBlendTestnetSupply({
        amount,
        asset: recommendation.asset,
        horizonUrl,
        networkPassphrase,
        publicKey,
        sorobanRpcUrl,
      })
      setTxState('submitted')
      setTxHash(result.hash)
      setTxMessage(`Transaction ${result.status.toLowerCase()}`)
      onSubmitted({
        amount,
        asset: recommendation.asset,
        hash: result.hash,
        protocol: recommendation.protocol,
        status: result.status,
        timestamp: new Date().toLocaleTimeString(),
        type: recommendation.category,
      })
    } catch (error) {
      setTxState('error')
      setTxMessage(error instanceof Error ? error.message : 'Blend supply transaction failed.')
    }
  }

  return (
    <aside className="rounded-xl border border-[#6B7B6B]/20 bg-white/55 p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">
        {recommendation.category === 'Lending' ? 'Supply Ticket' : 'LP Ticket'}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-[#1A2E1A]">{recommendation.protocol}</h2>

      <div className="mt-5 rounded-xl bg-[#1A2E1A] p-4 text-[#F5F0E8]">
        <p className="text-sm text-[#F5F0E8]/65">Available {recommendation.asset}</p>
        <p className="mt-1 text-3xl font-semibold">
          {formatAmount(available)} {recommendation.asset}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <TicketMetric label="Target APY" value={`${recommendation.apy.toFixed(1)}%`} />
        <TicketMetric label="Liquidity" value={recommendation.liquidity} />
      </div>

      <label className="mt-5 block text-sm font-medium text-[#1A2E1A]" htmlFor="stake-amount">
        Amount to stake
      </label>
      <input
        className="mt-2 w-full rounded-lg border border-[#6B7B6B]/20 bg-[#F5F0E8]/65 px-3 py-3 text-[#1A2E1A] outline-none focus:border-[#C8A84B]"
        id="stake-amount"
        max={available}
        min={0}
        onChange={(event) => onAmountChange(Number(event.target.value))}
        type="number"
        value={amount}
      />
      <input
        aria-label="Stake amount slider"
        className="mt-4 w-full accent-[#C8A84B]"
        max={available}
        min={0}
        onChange={(event) => onAmountChange(Number(event.target.value))}
        step={recommendation.asset === 'USDC' ? 0.01 : 1}
        type="range"
        value={amount}
      />

      <div className="mt-5 space-y-3 text-sm">
        <PreviewRow label="Asset" value={recommendation.asset} />
        <PreviewRow label="Amount" value={`${formatAmount(amount)} ${recommendation.asset}`} />
        <PreviewRow label="Risk profile" value={risk} />
        <PreviewRow label="Contract method" value={recommendation.method} />
      </div>

      {balanceStatus === 'error' ? (
        <p className="mt-4 rounded-lg border border-[#C8A84B]/30 bg-[#C8A84B]/10 p-3 text-sm text-[#1A2E1A]">
          {balanceError}
        </p>
      ) : null}

      <button
        className="mt-5 w-full rounded-lg bg-[#1A2E1A] px-4 py-3 text-sm font-semibold text-[#F5F0E8] transition hover:bg-[#0F1F0F] disabled:cursor-not-allowed disabled:opacity-45"
        disabled={amount <= 0 || available <= 0 || txState === 'signing'}
        onClick={handleExecute}
        type="button"
      >
        {txState === 'signing'
          ? 'Waiting for Freighter...'
          : recommendation.category === 'Lending'
            ? 'Sign & supply on Testnet'
            : 'Prepare LP transaction'}
      </button>

      <TransactionReceipt hash={txHash} message={txMessage} state={txState} />
    </aside>
  )
}

function TransactionReceipt({
  hash,
  message,
  state,
}: {
  hash: string | null
  message: string | null
  state: 'idle' | 'signing' | 'submitted' | 'error'
}) {
  if (!message) {
    return null
  }

  if (state !== 'submitted') {
    return (
      <p className="mt-4 rounded-lg border border-[#C8A84B]/30 bg-[#C8A84B]/10 p-3 text-sm text-[#1A2E1A]">
        {message}
      </p>
    )
  }

  return (
    <div className="mt-4 rounded-xl border border-[#4ade80]/30 bg-[#4ade80]/10 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex size-6 items-center justify-center rounded-full bg-[#4ade80] text-xs font-bold text-[#071C09]">
          ok
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#1A2E1A]">Transaction confirmed</p>
          <p className="mt-1 text-sm text-[#6B7B6B]">{message}</p>
          {hash ? (
            <a
              className="mt-3 block truncate rounded-lg border border-[#4ade80]/25 bg-white/45 px-3 py-2 text-sm font-medium text-[#1A2E1A] transition hover:border-[#4ade80]"
              href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
              rel="noreferrer"
              target="_blank"
            >
              {hash}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function OpenPositions({ localPositions }: { localPositions: LocalPosition[] }) {
  return (
    <section className="rounded-xl border border-[#6B7B6B]/20 bg-white/55 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">Open Positions</p>
          <h3 className="mt-2 text-2xl font-semibold text-[#1A2E1A]">Active Soroban yield</h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-[#4ade80]/35 bg-[#4ade80]/15 px-3 py-1 text-sm font-semibold text-[#1A2E1A]">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#4ade80] opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[#4ade80]" />
          </span>
          {yieldPositions.length + localPositions.length} live
        </span>
      </div>

      <div className="mt-5 divide-y divide-[#6B7B6B]/15 overflow-hidden rounded-xl border border-[#6B7B6B]/15">
        {localPositions.map((position) => (
          <PositionRow
            amount={`${formatAmount(position.amount)} ${position.asset}`}
            contract={position.hash}
            date={position.timestamp}
            href={`https://stellar.expert/explorer/testnet/tx/${position.hash}`}
            key={position.id}
            label="Newly added"
            protocol={position.protocol}
            status={position.status}
            tone="new"
            type={position.type}
          />
        ))}

        {yieldPositions.map((position) => (
          <PositionRow
            amount={position.staked}
            contract={position.sorobanContract}
            date={position.unlockDate}
            key={position.sorobanContract}
            label="Open position"
            protocol={position.protocol}
            status={`${position.apy.toFixed(1)}% APY`}
            tone="existing"
            type={position.asset}
          />
        ))}
      </div>
    </section>
  )
}

function PositionRow({
  amount,
  contract,
  date,
  href,
  label,
  protocol,
  status,
  tone,
  type,
}: {
  amount: string
  contract: string
  date: string
  href?: string
  label: string
  protocol: string
  status: string
  tone: 'new' | 'existing'
  type: string
}) {
  const isNew = tone === 'new'

  return (
    <div className={isNew ? 'bg-[#4ade80]/10 p-4' : 'bg-[#F5F0E8]/60 p-4'}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_140px_120px_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                isNew
                  ? 'border-[#4ade80]/30 bg-[#4ade80]/15 text-[#1A2E1A]'
                  : 'border-[#6B7B6B]/15 bg-white/45 text-[#6B7B6B]'
              }`}
            >
              {label}
            </span>
            <span className="text-xs text-[#6B7B6B]">{type}</span>
          </div>
          <p className="mt-2 font-semibold text-[#1A2E1A]">{protocol}</p>
          {href ? (
            <a
              className="mt-2 block truncate text-xs font-medium text-[#1A2E1A] underline decoration-[#C8A84B]/50 underline-offset-4"
              href={href}
              rel="noreferrer"
              target="_blank"
            >
              {contract}
            </a>
          ) : (
            <p className="mt-2 truncate text-xs text-[#6B7B6B]">{contract}</p>
          )}
        </div>

        <div>
          <p className="text-xs text-[#6B7B6B]">Amount</p>
          <p className="mt-1 text-sm font-semibold text-[#1A2E1A]">{amount}</p>
        </div>

        <div>
          <p className="text-xs text-[#6B7B6B]">{isNew ? 'Confirmed' : 'Unlock'}</p>
          <p className="mt-1 text-sm font-semibold text-[#1A2E1A]">{date}</p>
        </div>

        <div className="flex items-center gap-2 lg:justify-end">
          <span
            className={`rounded-lg border px-2 py-1 text-xs font-semibold ${
              isNew
                ? 'border-[#4ade80]/30 bg-white/50 text-[#1A2E1A]'
                : 'border-[#4ade80]/20 bg-[#4ade80]/10 text-[#1A2E1A]'
            }`}
          >
            {status}
          </span>
          <button
            className="rounded-lg border border-[#6B7B6B]/20 bg-white/40 px-3 py-2 text-sm font-medium text-[#1A2E1A] transition hover:border-[#C8A84B]/70"
            type="button"
          >
            Manage
          </button>
        </div>
      </div>
    </div>
  )
}

function getAvailableBalance(balances: { code: string; balance: string }[], code: StakeAsset) {
  const balance = balances.find((item) => item.code === code)
  return Number(balance?.balance ?? 0)
}

function formatAmount(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 7 })
}

function Allocation({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6B7B6B]">{label}</p>
      <p className="font-medium text-[#1A2E1A]">{value}</p>
    </div>
  )
}

function DarkBalance({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#F5F0E8]/10 bg-[#F5F0E8]/5 p-4">
      <p className="text-xs text-[#F5F0E8]/55">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold text-[#F5F0E8]">{value}</p>
    </div>
  )
}

function Metric({ label, positive, value }: { label: string; positive?: boolean; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6B7B6B]">{label}</p>
      <p className={positive ? 'mt-1 font-semibold text-[#4ade80]' : 'mt-1 font-semibold text-[#1A2E1A]'}>
        {value}
      </p>
    </div>
  )
}

function TicketMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#6B7B6B]/15 bg-[#F5F0E8]/60 p-3">
      <p className="text-xs text-[#6B7B6B]">{label}</p>
      <p className="mt-1 font-semibold text-[#1A2E1A]">{value}</p>
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#6B7B6B]/10 pb-2">
      <span className="text-[#6B7B6B]">{label}</span>
      <span className="text-right font-medium text-[#1A2E1A]">{value}</span>
    </div>
  )
}
