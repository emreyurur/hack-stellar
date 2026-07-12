import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit'
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter'
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull'
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr'
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { WalletStatus } from '../types/stellar'
import { WalletContext } from './walletContextValue'
import { classifyWalletError } from '../lib/walletErrors'

export type { WalletErrorType } from '../lib/walletErrors'

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
  const [errorType, setErrorType] = useState<ReturnType<typeof classifyWalletError>['type'] | null>(null)

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
