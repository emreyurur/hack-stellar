import { useState } from 'react'
import {
  buildTransactionFromApi,
  clearStoredJwtToken,
  getPortfolioFromApi,
  getStoredJwtToken,
  loginWithFreighterFlow,
  submitToHorizon,
  syncPortfolioToApi,
  type BuildTransactionResponse,
} from '../../services/terminal8Api'


export function ApiTesterView() {
  const [jwtToken, setJwtToken] = useState<string | null>(() => getStoredJwtToken())
  const [userPublicKey, setUserPublicKey] = useState<string | null>(null)
  const [authStatus, setAuthStatus] = useState<string>('Not connected')
  const [authError, setAuthError] = useState<boolean>(false)

  // Portfolio state
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioResult, setPortfolioResult] = useState<string>('No result yet...')

  // Orchestrator state
  const [poolId, setPoolId] = useState('')
  const [action, setAction] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT')
  const [amountA, setAmountA] = useState('100.5')
  const [amountB, setAmountB] = useState('250.0')
  const [shareAmount, setShareAmount] = useState('5.25')
  const [slippageBps, setSlippageBps] = useState('50')

  const [buildLoading, setBuildLoading] = useState(false)
  const [buildResult, setBuildResult] = useState<string>('Waiting for request...')
  const [pendingTx, setPendingTx] = useState<BuildTransactionResponse | null>(null)

  // Submit state
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<string>('')
  const [submitError, setSubmitError] = useState<boolean>(false)
  const [submitResult, setSubmitResult] = useState<string>('')

  const handleLogin = async () => {
    setAuthError(false)
    setAuthStatus('Checking Freighter extension...')
    try {
      if (!window.freighterApi || !window.freighterApi.getPublicKey || !window.freighterApi.signTransaction) {
        throw new Error('Freighter extension not found! Please install or unlock Freighter.')
      }
      setAuthStatus('Requesting public key...')
      const pubKey = await window.freighterApi.getPublicKey()
      setUserPublicKey(pubKey)

      setAuthStatus('Requesting challenge from backend...')
      const token = await loginWithFreighterFlow(pubKey, async (xdr, opts) => {
        setAuthStatus('Please sign auth challenge in Freighter...')
        return window.freighterApi!.signTransaction!(xdr, { networkPassphrase: opts.networkPassphrase })
      })

      setJwtToken(token)
      setAuthStatus(`Connected successfully: ${pubKey}`)
    } catch (err) {
      setAuthError(true)
      setAuthStatus(`Error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleLogout = () => {
    clearStoredJwtToken()
    setJwtToken(null)
    setUserPublicKey(null)
    setAuthStatus('Not connected')
  }

  const handleGetPortfolio = async () => {
    if (!jwtToken) return
    setPortfolioLoading(true)
    setPortfolioResult('Fetching portfolio data from backend...')
    try {
      const pubKey = userPublicKey || 'unknown'
      const data = await getPortfolioFromApi(pubKey, jwtToken)
      setPortfolioResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setPortfolioResult(`API Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setPortfolioLoading(false)
    }
  }

  const handleBuildTx = async () => {
    if (!jwtToken) return
    setBuildLoading(true)
    setBuildResult('Building transaction XDR...')
    setPendingTx(null)
    setSubmitStatus('')
    setSubmitResult('')

    try {
      const params = {
        poolId,
        action,
        slippageBps: parseInt(slippageBps, 10) || 0,
        ...(action === 'DEPOSIT'
          ? { amountA: parseFloat(amountA), amountB: parseFloat(amountB) }
          : { shareAmount: parseFloat(shareAmount) }),
      }
      const data = await buildTransactionFromApi(params, jwtToken)
      setBuildResult(JSON.stringify(data, null, 2))
      setPendingTx(data)
    } catch (err) {
      setBuildResult(`API Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBuildLoading(false)
    }
  }

  const handleSignAndSubmit = async () => {
    if (!pendingTx || !window.freighterApi) return
    setSubmitLoading(true)
    setSubmitError(false)
    setSubmitStatus('Please sign transaction in Freighter...')
    setSubmitResult('')

    try {
      if (!window.freighterApi || !window.freighterApi.signTransaction) {
        throw new Error('Freighter extension not found or signTransaction missing!')
      }
      const signedTx = await window.freighterApi.signTransaction(pendingTx.xdr, {
        networkPassphrase: pendingTx.networkPassphrase,
      })

      setSubmitStatus('Signed! Submitting to Stellar Horizon Testnet...')
      const submitData = await submitToHorizon(signedTx)

      setSubmitStatus('Transaction successful! Synchronizing portfolio...')
      setSubmitResult(
        `Hash: ${(submitData as { hash?: string }).hash || 'Success'}\nLedger: ${(submitData as { ledger?: number }).ledger || 'N/A'}`,
      )

      // Sync portfolio
      let syncShares = '10.0'
      let syncA = '0'
      let syncB = '0'
      if (action === 'DEPOSIT') {
        syncA = amountA
        syncB = amountB
      } else {
        syncShares = `-${shareAmount}`
      }

      await syncPortfolioToApi(
        {
          poolId,
          sharesAmount: syncShares,
          assetAAmount: syncA,
          assetBAmount: syncB,
        },
        jwtToken,
      )

      setSubmitStatus('Transaction Successful! Portfolio synchronized.')
    } catch (err) {
      setSubmitError(true)
      setSubmitStatus('Transaction failed!')
      setSubmitResult(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 text-[#F0F0F0]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2C12E]">Terminal8 API Tester & Auth</h1>
          <p className="text-sm text-[#9CA3AF]">
            Test live Freighter authentication, JWT Token generation, and backend XDR orchestration.
          </p>
        </div>
        <a
          href="/apiTester.html"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-[#F0F0F0] transition hover:border-[#F2C12E] hover:text-[#F2C12E]"
        >
          <span>Open Static HTML Page</span>
          <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>

      {/* 1. Wallet Auth Card */}
      <div className="rounded-2xl border border-white/10 bg-[#12121A] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[#F0F0F0]">1. Wallet Connection (Auth)</h2>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Connect Freighter, sign challenge XDR, and obtain your backend JWT access token.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleLogin}
            className="rounded-xl bg-[#F2C12E] px-4 py-2 text-sm font-semibold text-[#0A0A0E] transition hover:bg-[#F2C12E]/90"
            type="button"
          >
            Login with Freighter
          </button>
          {jwtToken && (
            <button
              onClick={handleLogout}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
              type="button"
            >
              Clear Token
            </button>
          )}
        </div>

        <div className={`mt-3 text-sm font-medium ${authError ? 'text-red-400' : 'text-emerald-400'}`}>
          {authStatus}
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-[#0A0A0E] p-4 font-mono text-xs text-[#E5E7EB] overflow-x-auto">
          JWT Token: {jwtToken || 'None'}
        </div>
      </div>

      {/* 2. Portfolio & PnL Card */}
      <div className="rounded-2xl border border-blue-500/30 bg-[#12121A] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[#60A5FA]">2. Portfolio & PnL (Portfolio)</h2>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Fetch connected wallet pool positions and profit/loss directly from backend.
        </p>
        <div className="mt-4">
          <button
            onClick={handleGetPortfolio}
            disabled={!jwtToken || portfolioLoading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
            type="button"
          >
            {portfolioLoading ? 'Loading...' : 'Fetch Portfolio'}
          </button>
        </div>

        <pre className="mt-3 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#0A0A0E] p-4 font-mono text-xs text-[#E5E7EB]">
          {portfolioResult}
        </pre>
      </div>

      {/* 3. Transaction Orchestrator Card */}
      <div className="rounded-2xl border border-white/10 bg-[#12121A] p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[#F0F0F0]">3. Transaction Builder (Orchestrator)</h2>
          <p className="mt-1 text-sm text-[#9CA3AF]">Generate XDR for DEPOSIT or WITHDRAW operations.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
              Pool ID
            </label>
            <input
              type="text"
              value={poolId}
              onChange={(e) => setPoolId(e.target.value)}
              placeholder="e.g. e1f3b..."
              className="w-full rounded-xl border border-white/10 bg-[#0A0A0E] px-3 py-2 text-sm text-[#F0F0F0] focus:border-[#F2C12E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
              Action
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as 'DEPOSIT' | 'WITHDRAW')}
              className="w-full rounded-xl border border-white/10 bg-[#0A0A0E] px-3 py-2 text-sm text-[#F0F0F0] focus:border-[#F2C12E] focus:outline-none"
            >
              <option value="DEPOSIT">Add Liquidity (DEPOSIT)</option>
              <option value="WITHDRAW">Remove Liquidity (WITHDRAW)</option>
            </select>
          </div>
        </div>

        {action === 'DEPOSIT' ? (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/5 bg-[#0A0A0E]/50 p-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Amount A</label>
              <input
                type="number"
                step="0.0000001"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#12121A] px-3 py-2 text-sm text-[#F0F0F0]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Amount B</label>
              <input
                type="number"
                step="0.0000001"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#12121A] px-3 py-2 text-sm text-[#F0F0F0]"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 bg-[#0A0A0E]/50 p-4">
            <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Share Amount</label>
            <input
              type="number"
              step="0.0000001"
              value={shareAmount}
              onChange={(e) => setShareAmount(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#12121A] px-3 py-2 text-sm text-[#F0F0F0]"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
            Slippage (BPS e.g. 50 = 0.5%)
          </label>
          <input
            type="number"
            value={slippageBps}
            onChange={(e) => setSlippageBps(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0A0A0E] px-3 py-2 text-sm text-[#F0F0F0]"
          />
        </div>

        <button
          onClick={handleBuildTx}
          disabled={!jwtToken || buildLoading}
          className="rounded-xl bg-[#F2C12E] px-4 py-2 text-sm font-semibold text-[#0A0A0E] transition hover:bg-[#F2C12E]/90 disabled:opacity-50"
          type="button"
        >
          {buildLoading ? 'Building...' : 'Request XDR'}
        </button>

        <pre className="max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#0A0A0E] p-4 font-mono text-xs text-[#E5E7EB]">
          {buildResult}
        </pre>

        {pendingTx && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
            <p className="text-sm font-semibold text-emerald-300">
              XDR Ready! Sign with Freighter and submit to Horizon Testnet.
            </p>
            <button
              onClick={handleSignAndSubmit}
              disabled={submitLoading}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              type="button"
            >
              {submitLoading ? 'Submitting...' : 'Sign and Submit'}
            </button>

            {submitStatus && (
              <div className={`text-sm font-medium ${submitError ? 'text-red-400' : 'text-emerald-400'}`}>
                {submitStatus}
              </div>
            )}

            {submitResult && (
              <pre className="max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-[#0A0A0E] p-3 font-mono text-xs text-[#E5E7EB]">
                {submitResult}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
