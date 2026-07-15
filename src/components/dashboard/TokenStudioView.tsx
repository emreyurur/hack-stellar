import { useState } from 'react'
import { useWallet } from '../../context/useWallet'
import { signTransaction } from '@stellar/freighter-api'
import { Horizon, TransactionBuilder } from '@stellar/stellar-sdk'

type StudioTab = 'pool' | 'mint'


function extractXdrFromData(data: unknown): string | null {
  if (typeof data === 'string' && data.length > 20 && !data.includes(' ')) {
    return data
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.xdr === 'string') return obj.xdr
    if (typeof obj.unsignedXdr === 'string') return obj.unsignedXdr
    if (typeof obj.transactionXdr === 'string') return obj.transactionXdr
    if (typeof obj.tx === 'string') return obj.tx
    if (typeof obj.trustlineXdr === 'string') return obj.trustlineXdr
    if (typeof obj.envelope === 'string') return obj.envelope
  }
  return null
}

interface FriendlyError {
  title: string
  message: string
  tip?: string
}

interface ErrorDetail {
  message?: string
  error?: string
  detail?: string
  extras?: {
    result_codes?: {
      transaction?: string
      operations?: string[]
    }
  }
}

function formatFriendlyError(err: unknown, status?: number, data?: unknown): FriendlyError {
  let rawStr = ''
  if (typeof err === 'string') rawStr = err
  else if (err instanceof Error) rawStr = err.message
  else if (err && typeof err === 'object') rawStr = JSON.stringify(err)

  if (data && typeof data === 'object') {
    const d = data as ErrorDetail
    if (d.message) rawStr += ` ${d.message}`
    if (d.error) rawStr += ` ${d.error}`
    if (d.detail) rawStr += ` ${d.detail}`
    if (d.extras?.result_codes) {
      rawStr += ` [Tx: ${d.extras.result_codes.transaction || ''} | Op: ${
        Array.isArray(d.extras.result_codes.operations) ? d.extras.result_codes.operations.join(', ') : ''
      }]`
    }
  }

  const lower = rawStr.toLowerCase()

  if (lower.includes('low_reserve') || lower.includes('op_low_reserve')) {
    return {
      title: 'Insufficient XLM Reserve',
      message: 'Your wallet does not have the required minimum XLM base reserve to create a new transaction, trustline, or liquidity pool.',
      tip: 'Solution: Transfer at least 1.5 - 2 XLM to your wallet from the Testnet faucet or another account and try again.',
    }
  }

  if (lower.includes('user declined') || lower.includes('user cancelled') || lower.includes('rejected') || lower.includes('declined')) {
    return {
      title: 'Transaction Cancelled',
      message: 'You declined or cancelled the transaction signature popup in your Freighter wallet extension.',
      tip: 'Solution: Click the action button again and press "Sign" inside the Freighter popup window when prompted.',
    }
  }

  if (lower.includes('tx_bad_seq')) {
    return {
      title: 'Outdated Sequence Number',
      message: 'The transaction sequence number does not match your wallet\'s current on-chain state.',
      tip: 'Solution: Please click the action button again to generate a fresh transaction.',
    }
  }

  if (lower.includes('tx_bad_auth_extra') || lower.includes('op_bad_auth_extra')) {
    return {
      title: 'Redundant Signature Warning',
      message: 'This transaction is already fully signed with complete authority by our backend system.',
      tip: 'Solution: The transaction has been submitted automatically or will resolve on retry.',
    }
  }

  if (lower.includes('tx_bad_auth') || lower.includes('op_bad_auth')) {
    return {
      title: 'Wallet Authorization / Network Error',
      message: 'The signature could not be verified or your wallet network setting does not match the transaction.',
      tip: 'Solution: Open your Freighter wallet extension, verify the network setting in the top right is set to "Testnet", and make sure the correct wallet is connected.',
    }
  }

  if (lower.includes('network') || lower.includes('failed to fetch') || status === 500) {
    return {
      title: 'Network / Server Connection Error',
      message: 'Could not connect to the Stellar network or the transaction server.',
      tip: 'Solution: Check your internet connection and try again in a few seconds.',
    }
  }

  if (status && status >= 400) {
    return {
      title: `Transaction Failed (Error Code: ${status})`,
      message: rawStr ? `Server response: ${rawStr}` : 'The transaction could not be created with the provided parameters.',
      tip: 'Solution: Verify your token codes, destination address, and amounts, then try again.',
    }
  }

  return {
    title: 'Transaction Could Not Be Executed',
    message: rawStr || 'An unexpected error occurred during execution.',
    tip: 'Solution: Please refresh the page and verify your inputs before retrying.',
  }
}

export function TokenStudioView() {
  const { networkPassphrase, networkUrl, publicKey, status } = useWallet()
  const [activeTab, setActiveTab] = useState<StudioTab>('pool')
  const [loading, setLoading] = useState(false)
  const [stepMessage, setStepMessage] = useState<string | null>(null)
  const [userError, setUserError] = useState<FriendlyError | null>(null)

  // On-chain / Auto-sign states
  const [signingState, setSigningState] = useState<'idle' | 'signing' | 'submitting' | 'success' | 'error'>('idle')
  const [onChainTxHash, setOnChainTxHash] = useState<string | null>(null)
  const [autoSign, setAutoSign] = useState(true)

  // ── 1. Pool Creation States (/build-lp-tx) ──
  const [poolTokenB, setPoolTokenB] = useState('YRK')
  const [poolAmountA, setPoolAmountA] = useState('1000')
  const [poolAmountB, setPoolAmountB] = useState('1000')
  const [poolMintAmountB, setPoolMintAmountB] = useState('5000')
  const [poolUserPublicKey, setPoolUserPublicKey] = useState(publicKey || '')

  // ── 2. Trust & Mint Token States (/build-trust-mint-tx) ──
  const [mintTokenCode, setMintTokenCode] = useState('YRK')
  const [mintAmount, setMintAmount] = useState('50000')
  const [mintDestination, setMintDestination] = useState(publicKey || '')

  // Auto-fill connected wallet
  const useConnectedWallet = () => {
    if (!publicKey) return
    if (activeTab === 'pool') setPoolUserPublicKey(publicKey)
    if (activeTab === 'mint') setMintDestination(publicKey)
  }

  // Horizon submitter with Smart Signature Check to prevent tx_bad_auth_extra
  const handleSignAndSubmitToHorizon = async (xdr: string) => {
    if (!networkPassphrase || !publicKey) {
      setUserError(formatFriendlyError('Freighter wallet must be connected and set to Stellar Testnet.'))
      setSigningState('error')
      return
    }

    try {
      setSigningState('signing')
      setUserError(null)
      setOnChainTxHash(null)
      let signedXdr = xdr

      try {
        const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase) as unknown as {
          source?: string
          feeSource?: string
          operations?: { source?: string }[]
          signatures?: unknown[]
        }
        const mainSource = tx.source || tx.feeSource || ''
        const opSources = tx.operations ? (tx.operations.map((o) => o.source).filter(Boolean) as string[]) : []
        const requiredSigners = new Set([mainSource, ...opSources])
        if (requiredSigners.has(publicKey) || !tx.signatures || tx.signatures.length === 0) {
          setStepMessage('Please approve the transaction inside your Freighter wallet popup...')
          const signRes = await signTransaction(xdr, { networkPassphrase, address: publicKey } as Parameters<typeof signTransaction>[1])
          if (typeof signRes === 'object' && 'error' in signRes && signRes.error) {
            throw new Error(signRes.error)
          }
          signedXdr = typeof signRes === 'string' ? signRes : signRes.signedTxXdr
          if (!signedXdr) {
            throw new Error('No signed transaction returned from Freighter.')
          }
        } else {
          setStepMessage('Transaction already has required signatures. Broadcasting to network...')
        }
      } catch {
        const signRes = await signTransaction(xdr, { networkPassphrase, address: publicKey } as Parameters<typeof signTransaction>[1])
        signedXdr = typeof signRes === 'string' ? signRes : signRes.signedTxXdr
      }

      setSigningState('submitting')
      setStepMessage('Broadcasting signed transaction to Stellar Horizon Testnet...')
      const horizonUrl = networkUrl || 'https://horizon-testnet.stellar.org'
      const horizon = new Horizon.Server(horizonUrl)
      const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
      const submitRes = await horizon.submitTransaction(signedTx)

      setOnChainTxHash(submitRes.hash)
      setSigningState('success')
      setStepMessage(null)
    } catch (err: unknown) {
      setSigningState('error')
      setStepMessage(null)
      let respData: unknown = null
      let respStatus: number | undefined = undefined
      if (err && typeof err === 'object' && 'response' in err) {
        const r = (err as Record<string, { data?: unknown; status?: number }>).response
        if (r) {
          respData = r.data
          respStatus = r.status
        }
      }
      setUserError(formatFriendlyError(err, respStatus, respData))
    }
  }

  // Execute build-lp-tx or build-trust-mint-tx
  const handleExecute = async () => {
    setLoading(true)
    setUserError(null)
    setSigningState('idle')
    setOnChainTxHash(null)
    setStepMessage('Sending transaction request to secure server...')

    let url = ''
    let payload: Record<string, unknown> = {}

    if (activeTab === 'pool') {
      url = 'https://batuhantekin.icu/stellar/api/v1/pools/testnet/build-lp-tx'
      payload = {
        userPublicKey: poolUserPublicKey.trim() || publicKey || '',
        tokenA: 'XLM',
        tokenB: poolTokenB.trim(),
        amountA: poolAmountA.trim(),
        amountB: poolAmountB.trim(),
        ...(poolMintAmountB.trim() ? { mintAmountB: poolMintAmountB.trim() } : {}),
      }
    } else if (activeTab === 'mint') {
      url = 'https://batuhantekin.icu/stellar/api/v1/pools/testnet/build-trust-mint-tx'
      payload = {
        userPublicKey: mintDestination.trim() || publicKey || '',
        tokenCode: mintTokenCode.trim(),
        amount: mintAmount.trim(),
      }
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { accept: '*/*', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const contentType = res.headers.get('content-type') || ''
      let data: unknown
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        const text = await res.text()
        try {
          data = JSON.parse(text)
        } catch {
          data = { message: text }
        }
      }

      if (!res.ok) {
        setSigningState('error')
        setUserError(formatFriendlyError(null, res.status, data))
        setStepMessage(null)
        return
      }

      setStepMessage('Transaction package built successfully. Initiating wallet approval...')

      if (res.ok && autoSign) {
        const detectedXdr = extractXdrFromData(data)
        if (detectedXdr) {
          void handleSignAndSubmitToHorizon(detectedXdr)
        } else {
          setSigningState('error')
          setUserError(formatFriendlyError('No valid transaction payload returned from server.', res.status, data))
          setStepMessage(null)
        }
      }
    } catch (err: unknown) {
      setSigningState('error')
      setUserError(formatFriendlyError(err))
      setStepMessage(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── Concise Workflow Guide Banner ── */}
      <div className="rounded-3xl border border-[#F2C12E]/30 bg-gradient-to-r from-[#F2C12E]/10 via-[#181824] to-[#12121A] p-6 shadow-[0_0_30px_rgba(242,193,46,0.15)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F2C12E] text-lg font-black text-[#0D0D12] shadow-[0_0_15px_rgba(242,193,46,0.4)]">
              💡
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#F2C12E]">
                2-Step Automated DeFi Workflow Guide
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#D1D5DB]">
                We use exactly two specialized endpoints for a zero-hassle, atomic experience:
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-xl border border-[#3B82F6]/40 bg-[#3B82F6]/10 px-3 py-1.5 font-mono text-[11px] font-bold text-[#60A5FA]">
              Step 1: Create Pool
            </span>
            <span className="text-white/[0.3]">➔</span>
            <span className="rounded-xl border border-[#F2C12E]/40 bg-[#F2C12E]/10 px-3 py-1.5 font-mono text-[11px] font-bold text-[#FDE047]">
              Step 2: Trust &amp; Mint
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-white/[0.08] pt-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.08] bg-[#12121A]/80 p-4">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#3B82F6]">
              <span>1️⃣ Step 1: Create Liquidity Pool (`/build-lp-tx`)</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-normal text-[#9CA3AF]">
              Select <strong className="text-white">XLM</strong> as Token A and pick/type any name for <strong className="text-white">Token B</strong>. The backend automatically handles sorting, trustlines, and reserve creation. Sign once in Freighter to publish on Horizon!
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#12121A]/80 p-4">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#F2C12E]">
              <span>2️⃣ Step 2: Trust &amp; Mint (`/build-trust-mint-tx`)</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-normal text-[#9CA3AF]">
              Once your pool exists, switch to Step 2 (`Trust &amp; Mint`) to establish a trustline (`ChangeTrust`) and receive tokens (`Payment`) atomically in 1 transaction. Approve once to get your tokens immediately!
            </p>
          </div>
        </div>
      </div>

      {/* ── Studio Banner ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#12121A] via-[#181824] to-[#12121A] p-8 shadow-2xl">
        <div className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-[#F2C12E]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 size-64 rounded-full bg-[#3B82F6]/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-[#F2C12E]/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#F2C12E] border border-[#F2C12E]/30">
                ⚡ Terminal 8 Token Studio
              </span>
              <span className="inline-flex items-center rounded-full bg-[#16A34A]/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#16A34A] border border-[#16A34A]/30">
                Stellar Testnet
              </span>
            </div>
            <h1 className="mt-3 font-mono text-2xl font-black tracking-tight text-white sm:text-3xl">
              1-Click Liquidity Pool &amp; Token Minting
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#9CA3AF]">
              Effortlessly generate testnet liquidity pools and receive custom tokens. The system builds your atomic XDR, triggers Freighter signature confirmation, and submits directly to Horizon.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {status !== 'CONNECTED' ? (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-semibold text-yellow-300">
                Connect Freighter wallet to sign
              </div>
            ) : (
              <button
                onClick={useConnectedWallet}
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.06] px-4 py-2.5 text-xs font-bold text-white transition hover:border-[#F2C12E] hover:bg-white/[0.10] hover:text-[#F2C12E]"
              >
                <span>⚡ Auto-fill Connected Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.08] pb-4">
        <button
          onClick={() => { setActiveTab('pool'); setUserError(null); setSigningState('idle'); setOnChainTxHash(null); setStepMessage(null) }}
          type="button"
          className={`flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-xs font-black uppercase tracking-wider transition ${
            activeTab === 'pool'
              ? 'bg-[#3B82F6] text-white shadow-[0_0_20px_rgba(59,130,246,0.35)]'
              : 'border border-white/[0.08] bg-[#12121A] text-[#9CA3AF] hover:bg-white/[0.06] hover:text-white'
          }`}
        >
          <span>🌊 Step 1: Create Liquidity Pool (`/build-lp-tx`)</span>
        </button>

        <button
          onClick={() => { setActiveTab('mint'); setUserError(null); setSigningState('idle'); setOnChainTxHash(null); setStepMessage(null) }}
          type="button"
          className={`flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-xs font-black uppercase tracking-wider transition ${
            activeTab === 'mint'
              ? 'bg-[#F2C12E] text-[#0D0D12] shadow-[0_0_20px_rgba(242,193,46,0.35)]'
              : 'border border-white/[0.08] bg-[#12121A] text-[#9CA3AF] hover:bg-white/[0.06] hover:text-white'
          }`}
        >
          <span>👆 Step 2: 1-Click Trust &amp; Mint (`/build-trust-mint-tx`)</span>
        </button>
      </div>

      {/* ── Studio Main Grid ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Interactive Form */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-white/[0.08] bg-[#111119] p-6 sm:p-8">
            <div className="mb-6 border-b border-white/[0.08] pb-4">
              <h3 className="flex items-center gap-2 font-mono text-lg font-bold text-white">
                {activeTab === 'pool' && '🌊 Step 1: Stellar Liquidity Pool Generation'}
                {activeTab === 'mint' && '👆 Step 2: 1-Click Trustline & Token Minting'}
              </h3>
              <p className="mt-1 font-mono text-xs text-[#9CA3AF]">
                {activeTab === 'pool' && 'POST /build-lp-tx ➔ Freighter Sign ➔ Submit to Horizon'}
                {activeTab === 'mint' && 'POST /build-trust-mint-tx ➔ Freighter Sign ➔ Submit to Horizon'}
              </p>
            </div>

            {/* TAB 1: LIQUIDITY POOL CREATION */}
            {activeTab === 'pool' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                        Token A (Native Asset)
                      </label>
                      <span className="rounded-full bg-[#F2C12E]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F2C12E]">
                        🔒 Fixed to XLM
                      </span>
                    </div>
                    <input
                      type="text"
                      value="XLM"
                      readOnly
                      disabled
                      className="mt-2 w-full cursor-not-allowed rounded-xl border border-white/[0.08] bg-[#14141E] px-4 py-3 font-mono text-sm font-bold text-[#9CA3AF] opacity-80 focus:outline-none"
                    />
                    <p className="mt-1.5 font-mono text-[11px] text-[#6B7280]">
                      Base liquidity reserve token is fixed as XLM.
                    </p>
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                      Token B (Custom Asset Name)
                    </label>
                    <input
                      type="text"
                      value={poolTokenB}
                      onChange={(e) => setPoolTokenB(e.target.value)}
                      placeholder="Enter desired Token B name (e.g. YRK, VIBE)"
                      className="mt-2 w-full rounded-xl border border-white/[0.12] bg-[#181824] px-4 py-3 font-mono text-sm font-bold text-white focus:border-[#3B82F6] focus:outline-none"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {['YRK', 'terminal', 'USDC', 'VIBE'].map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setPoolTokenB(code)}
                          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-[#9CA3AF] transition hover:border-[#3B82F6] hover:text-white"
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-mono text-xs font-bold text-[#9CA3AF]">Deposit Amount A</label>
                    <input
                      type="text"
                      value={poolAmountA}
                      onChange={(e) => setPoolAmountA(e.target.value)}
                      placeholder="1000"
                      className="mt-1 w-full rounded-xl border border-white/[0.12] bg-[#181824] px-3.5 py-2.5 font-mono text-xs text-white focus:border-[#3B82F6] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold text-[#9CA3AF]">Deposit Amount B</label>
                    <input
                      type="text"
                      value={poolAmountB}
                      onChange={(e) => setPoolAmountB(e.target.value)}
                      placeholder="1000"
                      className="mt-1 w-full rounded-xl border border-white/[0.12] bg-[#181824] px-3.5 py-2.5 font-mono text-xs text-white focus:border-[#3B82F6] focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block font-mono text-xs font-bold text-[#9CA3AF]">Mint Amount A (XLM)</label>
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#9CA3AF]">
                        🔒 Native Asset
                      </span>
                    </div>
                    <input
                      type="text"
                      value="Cannot mint native XLM"
                      readOnly
                      disabled
                      className="mt-1 w-full cursor-not-allowed rounded-xl border border-white/[0.08] bg-[#14141E] px-3.5 py-2.5 font-mono text-xs text-[#6B7280] opacity-70 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold text-[#9CA3AF]">Mint Amount B (Optional)</label>
                    <input
                      type="text"
                      value={poolMintAmountB}
                      onChange={(e) => setPoolMintAmountB(e.target.value)}
                      placeholder="5000"
                      className="mt-1 w-full rounded-xl border border-white/[0.12] bg-[#181824] px-3.5 py-2.5 font-mono text-xs text-white focus:border-[#3B82F6] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                      User Public Key (G...)
                    </label>
                    {publicKey && (
                      <button
                        type="button"
                        onClick={() => setPoolUserPublicKey(publicKey)}
                        className="font-mono text-xs font-bold text-[#3B82F6] hover:underline"
                      >
                        Use My Wallet
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={poolUserPublicKey}
                    onChange={(e) => setPoolUserPublicKey(e.target.value)}
                    placeholder="G..."
                    className="mt-2 w-full rounded-xl border border-white/[0.12] bg-[#181824] px-4 py-3 font-mono text-xs text-white focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: 1-CLICK TRUST & MINT TOKEN */}
            {activeTab === 'mint' && (
              <div className="space-y-5">
                <div>
                  <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                    Token Code (`tokenCode`)
                  </label>
                  <input
                    type="text"
                    value={mintTokenCode}
                    onChange={(e) => setMintTokenCode(e.target.value)}
                    placeholder="e.g. terminal, YRK, USDC"
                    className="mt-2 w-full rounded-xl border border-white/[0.12] bg-[#181824] px-4 py-3.5 font-mono text-sm font-bold text-white focus:border-[#F2C12E] focus:outline-none"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['YRK', 'terminal', 'USDC', 'VIBE'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setMintTokenCode(code)}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1 font-mono text-xs text-[#9CA3AF] transition hover:border-[#F2C12E] hover:text-white"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                    Amount to Mint (`amount`)
                  </label>
                  <input
                    type="text"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    placeholder="50000"
                    className="mt-2 w-full rounded-xl border border-white/[0.12] bg-[#181824] px-4 py-3.5 font-mono text-sm font-bold text-white focus:border-[#F2C12E] focus:outline-none"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['1000', '10000', '50000', '100000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setMintAmount(amt)}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1 font-mono text-xs text-[#9CA3AF] transition hover:border-[#F2C12E] hover:text-white"
                      >
                        +{Number(amt).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                      User Public Key (`userPublicKey`)
                    </label>
                    {publicKey && (
                      <button
                        type="button"
                        onClick={() => setMintDestination(publicKey)}
                        className="font-mono text-xs font-bold text-[#F2C12E] hover:underline"
                      >
                        Use My Wallet
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={mintDestination}
                    onChange={(e) => setMintDestination(e.target.value)}
                    placeholder="G..."
                    className="mt-2 w-full rounded-xl border border-white/[0.12] bg-[#181824] px-4 py-3 font-mono text-xs text-white focus:border-[#F2C12E] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Auto Sign Toggle */}
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 p-4">
              <input
                type="checkbox"
                id="autoSignCheck"
                checked={autoSign}
                onChange={(e) => setAutoSign(e.target.checked)}
                className="size-4 rounded border-white/[0.20] bg-transparent text-[#10B981] focus:ring-0 focus:ring-offset-0"
              />
              <label htmlFor="autoSignCheck" className="cursor-pointer font-mono text-xs text-white">
                <span className="font-bold text-[#10B981]">⚡ Auto-Sign with Freighter:</span> Automatically open wallet popup to sign &amp; submit XDR to Horizon when build returns.
              </label>
            </div>

            {/* Execute CTA */}
            <div className="mt-6 pt-6 border-t border-white/[0.08]">
              <button
                onClick={handleExecute}
                disabled={loading}
                type="button"
                className={`inline-flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-black uppercase tracking-wider shadow-lg transition disabled:opacity-50 ${
                  activeTab === 'pool'
                    ? 'bg-[#3B82F6] text-white shadow-[0_0_28px_rgba(59,130,246,0.4)] hover:bg-[#2563EB]'
                    : 'bg-[#F2C12E] text-[#0D0D12] shadow-[0_0_28px_rgba(242,193,46,0.4)] hover:bg-[#FDE047]'
                }`}
              >
                {loading ? (
                  <>
                    <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Executing Request...</span>
                  </>
                ) : (
                  <>
                    <span>{activeTab === 'pool' ? '🌊 Step 1: Build Pool XDR & Execute' : '👆 Step 2: Build Trust & Mint XDR & Execute'}</span>
                    <svg className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: End-User Assistant & Status Panel */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-white/[0.08] bg-[#111119] p-6 shadow-xl sm:p-8">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-xl bg-[#F2C12E]/10 text-sm font-bold text-[#F2C12E]">
                  ⚡
                </span>
                <span className="font-mono text-xs font-black uppercase tracking-wider text-white">
                  Execution Status &amp; Assistant
                </span>
              </div>
              {signingState !== 'idle' && (
                <span
                  className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
                    signingState === 'success'
                      ? 'bg-[#16A34A]/20 text-[#16A34A] border border-[#16A34A]/30'
                      : signingState === 'error'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-[#F2C12E]/20 text-[#F2C12E] border border-[#F2C12E]/30 animate-pulse'
                  }`}
                >
                  {signingState === 'success' && 'Success'}
                  {signingState === 'error' && 'Error Occurred'}
                  {(signingState === 'signing' || signingState === 'submitting') && 'Processing...'}
                </span>
              )}
            </div>

            <div className="mt-6">
              {/* 1. IDLE STATE */}
              {!loading && signingState === 'idle' && !onChainTxHash && !userError && (
                <div className="rounded-2xl border border-white/[0.06] bg-[#14141E]/80 p-6 text-center space-y-4">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/[0.04] text-xl text-[#F2C12E]">
                    🛡️
                  </div>
                  <div>
                    <h4 className="font-mono text-sm font-bold text-white">Ready to Execute</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#9CA3AF]">
                      Select an operation from the form on the left and click the button when ready. Our system will securely structure the transaction, prompt your Freighter wallet for 1-click signature, and verify confirmation on the Stellar Testnet.
                    </p>
                  </div>
                </div>
              )}

              {/* 2. LOADING / SIGNING / SUBMITTING STATE */}
              {(loading || signingState === 'signing' || signingState === 'submitting') && (
                <div className="rounded-2xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 p-6 space-y-5">
                  <div className="flex items-center gap-3.5">
                    <span className="size-6 animate-spin rounded-full border-2 border-[#60A5FA] border-t-transparent shrink-0" />
                    <div>
                      <h4 className="font-mono text-sm font-bold text-white">
                        {loading && '1/3: Building Transaction...'}
                        {signingState === 'signing' && '2/3: Waiting for Wallet Approval...'}
                        {signingState === 'submitting' && '3/3: Broadcasting to Stellar Network...'}
                      </h4>
                      <p className="mt-1 text-xs text-[#9CA3AF]">
                        {stepMessage ? stepMessage : loading ? 'Our server is securely constructing your transaction parameters.' : signingState === 'signing' ? 'Please confirm and sign inside the popup window of your Freighter wallet extension.' : 'The signed transaction is being broadcast to the blockchain for confirmation.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SUCCESS STATE */}
              {signingState === 'success' && onChainTxHash && (
                <div className="rounded-2xl border border-[#16A34A]/50 bg-[#16A34A]/15 p-6 space-y-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#16A34A] text-lg font-bold text-white shadow-[0_0_15px_rgba(22,197,94,0.4)]">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-mono text-sm font-black text-[#22C55E]">
                        Transaction Confirmed &amp; Recorded!
                      </h4>
                      <p className="mt-0.5 text-xs text-[#A7F3D0]">
                        {activeTab === 'pool'
                          ? 'Liquidity pool created and trustlines established.'
                          : 'Trustline created and tokens successfully minted to your wallet.'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#16A34A]/30 bg-[#0A0A0E]/60 p-3.5 font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#9CA3AF]">
                      <span>Transaction Code (Tx Hash):</span>
                      <span className="text-[#22C55E] font-bold">Confirmed ✓</span>
                    </div>
                    <p className="text-[#E2E8F0] break-all font-mono text-[11px] select-all bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
                      {onChainTxHash}
                    </p>
                  </div>

                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${onChainTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#16A34A] py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#15803d] shadow-[0_0_20px_rgba(22,163,74,0.3)]"
                  >
                    <span>View on Stellar Explorer ↗</span>
                  </a>
                </div>
              )}

              {/* 4. ERROR STATE (End-User Friendly) */}
              {(signingState === 'error' || userError) && userError && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 text-lg text-red-400 border border-red-500/30">
                      ⚠️
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-mono text-sm font-bold text-red-300">
                        {userError.title}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-red-200/90">
                        {userError.message}
                      </p>
                    </div>
                  </div>

                  {userError.tip && (
                    <div className="rounded-xl border border-red-500/20 bg-[#0A0A0E]/80 p-3.5 font-mono text-xs text-[#F2C12E] space-y-1">
                      <div className="font-bold uppercase tracking-wider text-[10px] text-[#9CA3AF]">
                        💡 Recommended Solution:
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#E2E8F0]">
                        {userError.tip}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => { setSigningState('idle'); setUserError(null) }}
                    className="w-full rounded-xl border border-white/[0.12] bg-white/[0.06] py-2.5 text-xs font-bold text-white transition hover:bg-white/[0.12]"
                  >
                    Got it, Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
