import { useMemo, useState } from 'react'
import { useWallet } from '../../context/useWallet'
import { useWalletBalances } from '../../hooks/useWalletBalances'
import { executeMainnetBatchSwap, type BatchSwapResult } from '../../services/mainnetBatchSwap'

type SwapStatus = 'idle' | 'planning' | 'signing' | 'confirmed' | 'error'
const PUBLIC_NETWORK_PASSPHRASE = 'Public Global Stellar Network ; September 2015'

export function WalletOperations() {
  const { network, networkPassphrase, networkUrl, publicKey, status } = useWallet()
  const { balanceError, balanceStatus, balances } = useWalletBalances()
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [targetAsset, setTargetAsset] = useState<'USDC' | 'XLM'>('USDC')
  const [swapStatus, setSwapStatus] = useState<SwapStatus>('idle')
  const [swapMessage, setSwapMessage] = useState('Select assets to find live Horizon paths.')
  const [swapResult, setSwapResult] = useState<BatchSwapResult | null>(null)

  const selectedRows = useMemo(
    () => balances.filter((asset) => selectedAssets.includes(asset.id)),
    [balances, selectedAssets],
  )
  const operationCount = Math.max(selectedRows.length, 1)
  const dormantRows = balances.filter((asset) => !asset.isNative)
  const missedOpportunity = calculateMissedOpportunity(dormantRows)
  const isMainnet = networkPassphrase === PUBLIC_NETWORK_PASSPHRASE

  const toggleAsset = (id: string) => {
    setSelectedAssets((current) =>
      current.includes(id) ? current.filter((asset) => asset !== id) : [...current, id],
    )
  }

  const runBatchSwap = async () => {
    setSwapResult(null)
    setSwapStatus('planning')
    setSwapMessage('Finding strict-send paths on Stellar Mainnet...')

    try {
      window.setTimeout(() => {
        setSwapStatus((current) => (current === 'planning' ? 'signing' : current))
        setSwapMessage('Freighter signature requested for Mainnet. Review the real asset movement carefully.')
      }, 450)

      const result = await executeMainnetBatchSwap({
        balances,
        networkPassphrase,
        networkUrl,
        publicKey,
        selectedRows,
        targetAsset,
      })

      setSwapResult(result)
      setSwapStatus('confirmed')
      setSwapMessage(
        `${result.operationCount} path payment${result.operationCount > 1 ? 's' : ''} confirmed into ${result.targetAsset}.`,
      )
      setSelectedAssets([])
    } catch (error) {
      setSwapStatus('error')
      setSwapMessage(getReadableError(error))
    }
  }

  return (
    <section className="rounded-xl border border-[#6B7B6B]/20 bg-white/45 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">
            Wallet Operations
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[#1A2E1A]">Batch swap console</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#6B7B6B]">
            Connect Freighter, load live Horizon balances, select tokens one by one, then prepare a
            batch swap into a clean base asset.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-72">
          <Summary label="Network" value={network ?? 'Not connected'} />
          <Summary label="Operations" value={`${operationCount} batch`} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-xl border border-[#6B7B6B]/15">
          <div className="grid grid-cols-[44px_1fr_1fr_1.2fr] bg-[#1A2E1A] px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#F5F0E8]">
            <span />
            <span>Token</span>
            <span>Amount</span>
            <span>Issuer</span>
          </div>

          {status !== 'CONNECTED' ? (
            <EmptyState message="Connect Freighter to load real wallet token amounts." />
          ) : null}

          {status === 'CONNECTED' && balanceStatus === 'loading' ? (
            <EmptyState message="Loading real balances from Horizon..." />
          ) : null}

          {status === 'CONNECTED' && balanceStatus === 'error' ? (
            <EmptyState message={balanceError ?? 'Could not load wallet balances.'} />
          ) : null}

          {status === 'CONNECTED' && balanceStatus === 'success' && balances.length === 0 ? (
            <EmptyState message="No token balances were found for this Stellar account." />
          ) : null}

          {balances.map((asset) => {
            const selected = selectedAssets.includes(asset.id)

            return (
              <button
                className={`grid w-full grid-cols-[44px_1fr_1fr_1.2fr] items-center px-4 py-4 text-left text-sm transition-colors duration-150 ${
                  selected ? 'bg-[#C8A84B]/12' : 'bg-[#F5F0E8]/45 hover:bg-white/55'
                } border-t border-[#6B7B6B]/15`}
                key={asset.id}
                onClick={() => toggleAsset(asset.id)}
                type="button"
              >
                <span
                  className={`flex size-5 items-center justify-center rounded border text-xs font-bold transition-all duration-150 ${
                    selected
                      ? 'border-[#C8A84B] bg-[#C8A84B] text-[#1A2E1A]'
                      : 'border-[#6B7B6B]/30 bg-white/35'
                  }`}
                >
                  {selected ? '✓' : ''}
                </span>
                <span>
                  <span className="rounded-md bg-[#C8A84B]/15 px-2 py-1 font-medium text-[#1A2E1A]">
                    {asset.code}
                  </span>
                  <span className="ml-2 text-xs text-[#6B7B6B]">
                    {asset.isNative ? 'nativeBalance' : asset.assetType}
                  </span>
                </span>
                <span>{`${formatAmount(asset.balance)} ${asset.code}`}</span>
                <span className="truncate text-[#6B7B6B]">{asset.issuer}</span>
              </button>
            )
          })}
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-[#C8A84B]/30 bg-[#1A2E1A] p-5 text-[#F5F0E8]">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#C8A84B]">
                Dust Time-Machine
              </p>
              <span className="rounded-md border border-[#C8A84B]/30 bg-[#C8A84B]/10 px-2 py-1 text-xs text-[#C8A84B]">
                6 mo
              </span>
            </div>
            <p className="mt-4 text-4xl font-semibold text-[#F5F0E8]">
              +${missedOpportunity.toFixed(2)}
            </p>
            <p className="mt-3 text-sm text-[#F5F0E8]/65">
              If these idle trustlines had been swept into USDC and staked 6 months ago, this wallet
              could have captured this estimated extra yield.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <TimeMachineMetric label="Idle assets" value={`${dormantRows.length}`} />
              <TimeMachineMetric label="Assumed APY" value="12.5%" />
            </div>
          </section>

          <section className="rounded-xl border border-[#6B7B6B]/15 bg-[#F5F0E8]/60 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">Batch preview</p>
            <h3 className="mt-2 text-xl font-semibold text-[#1A2E1A]">Swap target</h3>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(['USDC', 'XLM'] as const).map((asset) => (
                <button
                  aria-pressed={targetAsset === asset}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    targetAsset === asset
                      ? 'border-[#C8A84B]/80 bg-[#C8A84B]/15 text-[#1A2E1A]'
                      : 'border-[#6B7B6B]/15 bg-white/35 text-[#6B7B6B] hover:text-[#1A2E1A]'
                  }`}
                  key={asset}
                  onClick={() => setTargetAsset(asset)}
                  type="button"
                >
                  {asset}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <PreviewRow label="Selected tokens" value={`${selectedRows.length}`} />
              <PreviewRow label="Selected amount" value={formatSelectedAmount(selectedRows)} />
              <PreviewRow label="Target asset" value={targetAsset} />
              <PreviewRow label="Execution" value="Horizon strict-send" />
              <PreviewRow label="Network mode" value={isMainnet ? 'Mainnet' : 'Switch required'} />
            </div>

            <div className="mt-4 rounded-lg border border-[#C8A84B]/30 bg-[#C8A84B]/10 p-3 text-xs leading-5 text-[#1A2E1A]">
              Mainnet mode moves real assets. The app keeps a 3 XLM reserve buffer for native XLM
              and uses a 1% minimum-receive slippage buffer before Freighter signs.
            </div>

            <button
              className="mt-5 w-full rounded-lg bg-[#1A2E1A] px-4 py-3 text-sm font-semibold text-[#F5F0E8] transition hover:bg-[#0F1F0F] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={
                selectedRows.length === 0 ||
                swapStatus === 'planning' ||
                swapStatus === 'signing' ||
                !isMainnet
              }
              onClick={runBatchSwap}
              type="button"
            >
              {swapStatus === 'planning'
                ? 'Finding Mainnet paths...'
                : swapStatus === 'signing'
                  ? 'Waiting for Freighter...'
                  : isMainnet
                    ? 'Sign batch swap on Mainnet'
                    : 'Switch Freighter to Mainnet'}
            </button>

            <SwapExecutionPanel
              message={swapMessage}
              result={swapResult}
              skippedAssets={swapResult?.skippedAssets ?? []}
              status={swapStatus}
            />
          </section>
        </aside>
      </div>
    </section>
  )
}

function calculateMissedOpportunity(rows: { balance: string; code: string }[]) {
  const estimatedUsd = rows.reduce((total, row) => {
    const amount = Number(row.balance)
    const price = row.code === 'USDC' ? 1 : row.code === 'XLM' ? 0.12 : row.code === 'AQUA' ? 0.02 : 0.08

    return total + amount * price
  }, 0)

  return estimatedUsd * 0.125 * 0.5
}

function formatAmount(value: string) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 7 })
}

function formatSelectedAmount(rows: { balance: string; code: string }[]) {
  if (rows.length === 0) {
    return 'None'
  }

  if (rows.length === 1) {
    const [row] = rows
    return `${formatAmount(row.balance)} ${row.code}`
  }

  return `${rows.length} assets`
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#6B7B6B]/15 bg-[#F5F0E8]/60 p-4">
      <p className="text-xs text-[#6B7B6B]">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold text-[#1A2E1A]">{value}</p>
    </div>
  )
}

function TimeMachineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#F5F0E8]/10 bg-[#F5F0E8]/5 p-3">
      <p className="text-xs text-[#F5F0E8]/55">{label}</p>
      <p className="mt-1 font-semibold text-[#F5F0E8]">{value}</p>
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

function SwapExecutionPanel({
  message,
  result,
  skippedAssets,
  status,
}: {
  message: string
  result: BatchSwapResult | null
  skippedAssets: string[]
  status: SwapStatus
}) {
  const isConfirmed = status === 'confirmed'
  const isError = status === 'error'
  const scannerUrl = result
    ? `https://stellar.expert/explorer/${result.explorerNetwork}/tx/${result.hash}`
    : undefined

  return (
    <div
      className={`mt-4 rounded-lg border p-4 text-sm ${
        isConfirmed
          ? 'border-[#4ade80]/35 bg-[#4ade80]/10'
          : isError
            ? 'border-red-400/30 bg-red-50/70'
            : 'border-[#6B7B6B]/15 bg-white/35'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 size-2 rounded-full ${
            isConfirmed ? 'bg-[#4ade80]' : isError ? 'bg-red-500' : 'bg-[#C8A84B]'
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[#1A2E1A]">
            {isConfirmed ? 'Transaction confirmed' : isError ? 'Execution halted' : 'Execution console'}
          </p>
          <p className="mt-1 text-[#6B7B6B]">{message}</p>

          {scannerUrl ? (
            <a
              className="mt-3 block truncate rounded-md border border-[#6B7B6B]/15 bg-[#F5F0E8]/70 px-3 py-2 font-mono text-xs text-[#1A2E1A] transition hover:border-[#C8A84B]/70"
              href={scannerUrl}
              rel="noreferrer"
              target="_blank"
              title={result?.hash}
            >
              {result?.hash}
            </a>
          ) : null}

          {skippedAssets.length > 0 ? (
            <div className="mt-3 space-y-1 text-xs text-[#6B7B6B]">
              {skippedAssets.map((asset) => (
                <p key={asset}>{asset}</p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border-t border-[#6B7B6B]/15 bg-[#F5F0E8]/45 px-4 py-10 text-center text-sm text-[#6B7B6B]">
      {message}
    </div>
  )
}

function getReadableError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Batch swap could not be submitted on Mainnet.'
}
