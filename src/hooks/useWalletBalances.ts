import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '../context/useWallet'
import type { WalletBalance } from '../types/stellar'

type HorizonBalance = {
  asset_code?: string
  asset_issuer?: string
  asset_type: string
  balance: string
}

type HorizonAccountResponse = {
  balances: HorizonBalance[]
}

type BalanceState = 'idle' | 'loading' | 'success' | 'error'

function normalizeHorizonUrl(networkUrl: string) {
  return networkUrl.replace(/\/$/, '')
}

function toWalletBalance(balance: HorizonBalance): WalletBalance {
  const isNative = balance.asset_type === 'native'
  const code = isNative ? 'XLM' : balance.asset_code ?? 'UNKNOWN'
  const issuer = isNative ? 'native' : balance.asset_issuer ?? 'unknown issuer'

  return {
    id: `${code}-${issuer}`,
    code,
    issuer,
    balance: balance.balance,
    assetType: balance.asset_type,
    isNative,
  }
}

export function useWalletBalances() {
  const { networkUrl, publicKey, status } = useWallet()
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [balanceStatus, setBalanceStatus] = useState<BalanceState>('idle')
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const ready = status === 'CONNECTED' && Boolean(publicKey) && Boolean(networkUrl)

  useEffect(() => {
    if (!ready || !publicKey || !networkUrl) {
      return
    }

    const controller = new AbortController()
    const accountId = publicKey
    const horizonUrl = normalizeHorizonUrl(networkUrl)

    async function loadBalances() {
      setBalanceStatus('loading')
      setBalanceError(null)

      try {
        const response = await fetch(`${horizonUrl}/accounts/${accountId}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Horizon returned ${response.status} for this account.`)
        }

        const account = (await response.json()) as HorizonAccountResponse
        setBalances(account.balances.map(toWalletBalance))
        setBalanceStatus('success')
      } catch (reason) {
        if (controller.signal.aborted) {
          return
        }

        setBalances([])
        setBalanceStatus('error')
        setBalanceError(reason instanceof Error ? reason.message : 'Could not load wallet balances.')
      }
    }

    void loadBalances()

    return () => controller.abort()
  }, [networkUrl, publicKey, ready])

  return useMemo(
    () => ({
      balances: ready ? balances : [],
      balanceStatus: ready ? balanceStatus : 'idle',
      balanceError: ready ? balanceError : null,
    }),
    [balanceError, balanceStatus, balances, ready],
  )
}
