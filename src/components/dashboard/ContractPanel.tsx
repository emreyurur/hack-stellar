import { useEffect, useState } from 'react'
import { useWallet } from '../../context/useWallet'
import {
  COUNTER_CONTRACT_ID,
  COUNTER_CONTRACT_DEPLOY_TX,
  callCounterIncrement,
  callCounterGet,
} from '../../services/counterContract'
import { useCounterEvents } from '../../hooks/useCounterEvents'

type TxStatus = 'idle' | 'pending' | 'success' | 'fail'

const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015'
const EXPLORER_BASE = 'https://stellar.expert/explorer/testnet'

export function ContractPanel() {
  const { publicKey, networkPassphrase, status } = useWallet()
  const [txStatus, setTxStatus] = useState<TxStatus>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null)
  const [counterValue, setCounterValue] = useState<number | null>(null)
  const { snapshots, isPolling } = useCounterEvents()

  const isTestnet = networkPassphrase === TESTNET_PASSPHRASE
  const connected = status === 'CONNECTED' && publicKey

  useEffect(() => {
    callCounterGet().then(setCounterValue).catch(() => setCounterValue(null))
  }, [txStatus])

  const handleIncrement = async () => {
    if (!publicKey) return
    setTxStatus('pending')
    setTxHash(null)
    setTxError(null)

    try {
      const result = await callCounterIncrement(publicKey)
      setTxHash(result.hash)
      setCounterValue(result.newValue)
      setTxStatus('success')
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Transaction failed.')
      setTxStatus('fail')
    }
  }

  return (
    <section className="rounded-xl border border-white/[0.08] bg-[#12121A] p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#9CA3AF]">Soroban Contract</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#F0F0F0]">
            Counter contract — Testnet
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#9CA3AF]">
            Terminal8 Counter is a Soroban smart contract deployed on Stellar Testnet.
            Call <code className="rounded bg-white/[0.08] px-1 py-0.5 font-mono text-[#F2C12E]">increment()</code> to
            write to on-chain state, or read the current value with{' '}
            <code className="rounded bg-white/[0.08] px-1 py-0.5 font-mono text-[#F2C12E]">get()</code>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-72">
          <InfoCard label="Network" value="Testnet" />
          <InfoCard label="Counter" value={counterValue !== null ? String(counterValue) : '…'} />
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Contract info */}
        <div className="space-y-3">
          <FieldRow
            label="Contract ID"
            value={COUNTER_CONTRACT_ID}
            href={`${EXPLORER_BASE}/contract/${COUNTER_CONTRACT_ID}`}
          />
          <FieldRow
            label="Deploy TX"
            value={COUNTER_CONTRACT_DEPLOY_TX}
            href={`${EXPLORER_BASE}/tx/${COUNTER_CONTRACT_DEPLOY_TX}`}
          />
          {txHash ? (
            <FieldRow
              label="Last call TX"
              value={txHash}
              href={`${EXPLORER_BASE}/tx/${txHash}`}
            />
          ) : null}
        </div>

        {/* Action panel */}
        <div className="rounded-xl border border-white/[0.08] bg-[#161622] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[#9CA3AF]">Call contract</p>
          <h3 className="mt-2 text-xl font-semibold text-[#F0F0F0]">increment()</h3>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            Increments the on-chain counter by 1, signs with your wallet, and broadcasts to testnet.
          </p>

          {!connected ? (
            <div className="mt-4 rounded-lg border border-[#F2C12E]/30 bg-[#F2C12E]/10 p-3 text-sm text-[#F0F0F0]">
              Connect your wallet to call the contract.
            </div>
          ) : !isTestnet ? (
            <div className="mt-4 rounded-lg border border-[#F2C12E]/30 bg-[#F2C12E]/10 p-3 text-sm text-[#F0F0F0]">
              Switch your wallet to <strong>Testnet</strong> to interact with this contract.
            </div>
          ) : null}

          <button
            className="mt-5 w-full rounded-lg bg-[#F2C12E] px-4 py-3 text-sm font-semibold text-[#0D0D12] transition hover:bg-[#F2C12E]/90 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!connected || !isTestnet || txStatus === 'pending'}
            onClick={handleIncrement}
            type="button"
          >
            {txStatus === 'pending'
              ? 'Waiting for wallet signature…'
              : 'Sign & call increment()'}
          </button>

          {/* Transaction status panel */}
          <TxStatusPanel hash={txHash} error={txError} status={txStatus} />
        </div>
      </div>

      {/* Live event feed */}
      <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#14141E] p-4">
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${isPolling ? 'animate-pulse bg-[#16A34A]' : 'bg-[#9CA3AF]/40'}`}
          />
          <p className="text-xs uppercase tracking-[0.16em] text-[#9CA3AF]">
            Live counter stream — polling every 5 s
          </p>
        </div>
        {snapshots.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]/60">Waiting for on-chain activity…</p>
        ) : (
          <ul className="space-y-1.5">
            {snapshots.map((s, i) => (
              <li
                key={s.timestamp.toISOString()}
                className={`flex items-center justify-between rounded-lg border border-white/[0.08] px-3 py-2 font-mono text-xs ${i === 0 ? 'bg-[#16A34A]/10' : 'bg-white/[0.03]'}`}
              >
                <span className="text-[#F0F0F0]">
                  counter → <strong>{s.value}</strong>
                </span>
                <span className="text-[#9CA3AF]">
                  {s.timestamp.toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function TxStatusPanel({
  error,
  hash,
  status,
}: {
  error: string | null
  hash: string | null
  status: TxStatus
}) {
  if (status === 'idle') return null

  const isPending = status === 'pending'
  const isSuccess = status === 'success'
  const isFail = status === 'fail'

  return (
    <div
      className={`mt-4 rounded-lg border p-4 text-sm ${
        isSuccess
          ? 'border-[#16A34A]/35 bg-[#16A34A]/10'
          : isFail
            ? 'border-red-500/30 bg-red-500/10'
            : 'border-white/[0.08] bg-white/[0.04]'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 size-2 shrink-0 rounded-full ${
            isSuccess ? 'bg-[#16A34A]' : isFail ? 'bg-red-500' : 'animate-pulse bg-[#F2C12E]'
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[#F0F0F0]">
            {isPending ? 'Transaction pending…'
              : isSuccess ? 'Transaction confirmed'
              : 'Transaction failed'}
          </p>

          {isPending ? (
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Signing with your wallet, then broadcasting to Stellar testnet…
            </p>
          ) : null}

          {isSuccess && hash ? (
            <a
              className="mt-2 block truncate rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 font-mono text-xs text-[#F0F0F0] transition hover:border-[#F2C12E]/50"
              href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
              rel="noreferrer"
              target="_blank"
            >
              {hash}
            </a>
          ) : null}

          {isFail && error ? (
            <p className="mt-1 text-xs text-red-400">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
      <p className="text-xs text-[#9CA3AF]">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold text-[#F0F0F0]">{value}</p>
    </div>
  )
}

function FieldRow({
  href,
  label,
  value,
}: {
  href: string
  label: string
  value: string
}) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-[0.12em] text-[#9CA3AF]">{label}</p>
      <a
        className="block truncate rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 font-mono text-xs text-[#F0F0F0] transition hover:border-[#F2C12E]/50"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {value}
      </a>
    </div>
  )
}
