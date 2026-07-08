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
    <section className="rounded-xl border border-[#6B7B6B]/20 bg-white/45 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">Soroban Contract</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#1A2E1A]">
            Counter contract — Testnet
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#6B7B6B]">
            Terminal8 Counter is a Soroban smart contract deployed on Stellar Testnet.
            Call <code className="rounded bg-[#1A2E1A]/8 px-1 py-0.5 font-mono">increment()</code> to
            write to on-chain state, or read the current value with{' '}
            <code className="rounded bg-[#1A2E1A]/8 px-1 py-0.5 font-mono">get()</code>.
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
        <div className="rounded-xl border border-[#6B7B6B]/15 bg-[#F5F0E8]/60 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">Call contract</p>
          <h3 className="mt-2 text-xl font-semibold text-[#1A2E1A]">increment()</h3>
          <p className="mt-2 text-sm text-[#6B7B6B]">
            Increments the on-chain counter by 1, signs with your wallet, and broadcasts to testnet.
          </p>

          {!connected ? (
            <div className="mt-4 rounded-lg border border-[#C8A84B]/30 bg-[#C8A84B]/10 p-3 text-sm text-[#1A2E1A]">
              Connect your wallet to call the contract.
            </div>
          ) : !isTestnet ? (
            <div className="mt-4 rounded-lg border border-[#C8A84B]/30 bg-[#C8A84B]/10 p-3 text-sm text-[#1A2E1A]">
              Switch your wallet to <strong>Testnet</strong> to interact with this contract.
            </div>
          ) : null}

          <button
            className="mt-5 w-full rounded-lg bg-[#1A2E1A] px-4 py-3 text-sm font-semibold text-[#F5F0E8] transition hover:bg-[#0F1F0F] disabled:cursor-not-allowed disabled:opacity-40"
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
      <div className="mt-6 rounded-xl border border-[#6B7B6B]/15 bg-[#F5F0E8]/40 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${isPolling ? 'animate-pulse bg-[#4ade80]' : 'bg-[#6B7B6B]/40'}`}
          />
          <p className="text-xs uppercase tracking-[0.16em] text-[#6B7B6B]">
            Live counter stream — polling every 5 s
          </p>
        </div>
        {snapshots.length === 0 ? (
          <p className="text-sm text-[#6B7B6B]/60">Waiting for on-chain activity…</p>
        ) : (
          <ul className="space-y-1.5">
            {snapshots.map((s, i) => (
              <li
                key={s.timestamp.toISOString()}
                className={`flex items-center justify-between rounded-lg border border-[#6B7B6B]/10 px-3 py-2 font-mono text-xs ${i === 0 ? 'bg-[#4ade80]/10' : 'bg-white/30'}`}
              >
                <span className="text-[#1A2E1A]">
                  counter → <strong>{s.value}</strong>
                </span>
                <span className="text-[#6B7B6B]">
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
          ? 'border-[#4ade80]/35 bg-[#4ade80]/10'
          : isFail
            ? 'border-red-400/30 bg-red-50/70'
            : 'border-[#6B7B6B]/15 bg-white/35'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 size-2 shrink-0 rounded-full ${
            isSuccess ? 'bg-[#4ade80]' : isFail ? 'bg-red-500' : 'animate-pulse bg-[#C8A84B]'
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[#1A2E1A]">
            {isPending ? 'Transaction pending…'
              : isSuccess ? 'Transaction confirmed'
              : 'Transaction failed'}
          </p>

          {isPending ? (
            <p className="mt-1 text-xs text-[#6B7B6B]">
              Signing with your wallet, then broadcasting to Stellar testnet…
            </p>
          ) : null}

          {isSuccess && hash ? (
            <a
              className="mt-2 block truncate rounded-md border border-[#6B7B6B]/15 bg-[#F5F0E8]/70 px-3 py-2 font-mono text-xs text-[#1A2E1A] transition hover:border-[#C8A84B]/70"
              href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
              rel="noreferrer"
              target="_blank"
            >
              {hash}
            </a>
          ) : null}

          {isFail && error ? (
            <p className="mt-1 text-xs text-red-600">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#6B7B6B]/15 bg-[#F5F0E8]/60 p-4">
      <p className="text-xs text-[#6B7B6B]">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold text-[#1A2E1A]">{value}</p>
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
      <p className="mb-1 text-xs uppercase tracking-[0.12em] text-[#6B7B6B]">{label}</p>
      <a
        className="block truncate rounded-lg border border-[#6B7B6B]/15 bg-[#F5F0E8]/70 px-3 py-2 font-mono text-xs text-[#1A2E1A] transition hover:border-[#C8A84B]/70"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {value}
      </a>
    </div>
  )
}
