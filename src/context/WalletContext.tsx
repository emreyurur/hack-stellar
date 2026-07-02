import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit'
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter'
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull'
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr'
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { WalletStatus } from '../types/stellar'
import { WalletContext } from './walletContextValue'

// ─── Wallet error classification ──────────────────────────────────────────────

export type WalletErrorType = 'wallet_not_found' | 'user_rejected' | 'insufficient_balance' | 'unknown'

export function classifyWalletError(error: unknown): { type: WalletErrorType; message: string } {
  const msg = error instanceof Error ? error.message : String(error)
  const lower = msg.toLowerCase()

  if (
    lower.includes('not installed') ||
    lower.includes('not found') ||
    lower.includes('wallet not') ||
    lower.includes('extension') ||
    lower.includes('no wallet') ||
    lower.includes('unavailable')
  ) {
    return {
      type: 'wallet_not_found',
      message: 'Wallet not found. Install Freighter, xBull, or LOBSTR to continue.',
    }
  }

  if (
    lower.includes('rejected') ||
    lower.includes('declined') ||
    lower.includes('cancelled') ||
    lower.includes('canceled') ||
    lower.includes('user closed') ||
    lower.includes('user denied') ||
    lower.includes('modal closed')
  ) {
    return {
      type: 'user_rejected',
      message: 'Connection rejected. You closed the wallet dialog.',
    }
  }

  if (
    lower.includes('insufficient') ||
    lower.includes('underfunded') ||
    lower.includes('balance') ||
    lower.includes('tx_insufficient') ||
    lower.includes('not enough')
  ) {
    return {
      type: 'insufficient_balance',
      message: 'Insufficient balance. Add funds to your wallet and try again.',
    }
  }

  return { type: 'unknown', message: msg || 'Wallet connection failed.' }
}

// ─── Kit initialisation (once per page load) ──────────────────────────────────

StellarWalletsKit.init({
  modules: [
    new FreighterModule(),
    new xBullModule(),
    new LobstrModule(),
    new AlbedoModule(),
  ],
  network: Networks.TESTNET,
})

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>('DISCONNECTED')
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [network, setNetwork] = useState<string | null>(null)
  const [networkPassphrase, setNetworkPassphrase] = useState<string | null>(null)
  const [sorobanRpcUrl, setSorobanRpcUrl] = useState<string | null>(null)
  const [networkUrl, setNetworkUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<WalletErrorType | null>(null)

  const connect = useCallback(async () => {
    setStatus('CONNECTING')
    setError(null)
    setErrorType(null)

    try {
      // Opens multi-wallet selection modal (Freighter, xBull, LOBSTR, Albedo)
      const { address } = await StellarWalletsKit.authModal()

      const networkInfo = await StellarWalletsKit.getNetwork()
      const passphrase = networkInfo.networkPassphrase

      // Map network passphrase to Horizon / Soroban RPC URLs
      const isTestnet = passphrase.toLowerCase().includes('test')
      const resolvedNetworkUrl = isTestnet
        ? 'https://horizon-testnet.stellar.org'
        : 'https://horizon.stellar.org'
      const resolvedSorobanUrl = isTestnet
        ? 'https://soroban-testnet.stellar.org'
        : 'https://soroban.stellar.org'
      const resolvedNetwork = isTestnet ? 'TESTNET' : 'PUBLIC'

      setPublicKey(address)
      setNetwork(resolvedNetwork)
      setNetworkPassphrase(passphrase)
      setSorobanRpcUrl(resolvedSorobanUrl)
      setNetworkUrl(resolvedNetworkUrl)
      setStatus('CONNECTED')
    } catch (reason) {
      const { type, message } = classifyWalletError(reason)
      setPublicKey(null)
      setNetwork(null)
      setNetworkPassphrase(null)
      setSorobanRpcUrl(null)
      setNetworkUrl(null)
      setStatus('ERROR')
      setError(message)
      setErrorType(type)
    }
  }, [])

  const reset = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect()
    } catch {
      // ignore disconnect errors
    }
    setStatus('DISCONNECTED')
    setPublicKey(null)
    setNetwork(null)
    setNetworkPassphrase(null)
    setSorobanRpcUrl(null)
    setNetworkUrl(null)
    setError(null)
    setErrorType(null)
  }, [])

  // Listen for kit-level disconnect events
  useEffect(() => {
    const unsub = StellarWalletsKit.on('DISCONNECT' as never, () => {
      setStatus('DISCONNECTED')
      setPublicKey(null)
      setNetwork(null)
      setNetworkPassphrase(null)
      setSorobanRpcUrl(null)
      setNetworkUrl(null)
      setError(null)
      setErrorType(null)
    })
    return unsub
  }, [])

  const value = useMemo(
    () => ({
      status,
      publicKey,
      network,
      networkPassphrase,
      sorobanRpcUrl,
      networkUrl,
      error,
      errorType,
      connect,
      reset,
    }),
    [
      connect,
      error,
      errorType,
      network,
      networkPassphrase,
      networkUrl,
      publicKey,
      reset,
      sorobanRpcUrl,
      status,
    ],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}
