import { getAddress, getNetworkDetails, isConnected, requestAccess } from '@stellar/freighter-api'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { WalletStatus } from '../types/stellar'
import { WalletContext } from './walletContextValue'

type FreighterErrorLike = {
  message?: string
}

function getFreighterErrorMessage(error: unknown) {
  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return (error as FreighterErrorLike).message ?? 'Freighter returned an unknown error.'
  }

  return 'Freighter returned an unknown error.'
}

async function getLegacyPublicKey() {
  const stellarWalletPublicKey = await window.stellarWallets?.freighter?.getPublicKey?.()

  if (stellarWalletPublicKey) {
    return stellarWalletPublicKey
  }

  const legacyAccess = await window.freighterApi?.requestAccess?.()

  if (legacyAccess?.error) {
    throw new Error(getFreighterErrorMessage(legacyAccess.error))
  }

  if (legacyAccess?.address || legacyAccess?.publicKey) {
    return legacyAccess.address ?? legacyAccess.publicKey ?? ''
  }

  const legacyPublicKey = await window.freighterApi?.getPublicKey?.()

  return legacyPublicKey ?? ''
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>('DISCONNECTED')
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [network, setNetwork] = useState<string | null>(null)
  const [networkPassphrase, setNetworkPassphrase] = useState<string | null>(null)
  const [sorobanRpcUrl, setSorobanRpcUrl] = useState<string | null>(null)
  const [networkUrl, setNetworkUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    setStatus('CONNECTING')
    setError(null)

    try {
      const connection = await isConnected()
      let nextPublicKey = ''

      if (connection.error) {
        throw new Error(getFreighterErrorMessage(connection.error))
      }

      if (connection.isConnected) {
        const access = await requestAccess()

        if (access.error) {
          throw new Error(getFreighterErrorMessage(access.error))
        }

        nextPublicKey = access.address

        if (!nextPublicKey) {
          const address = await getAddress()

          if (address.error) {
            throw new Error(getFreighterErrorMessage(address.error))
          }

          nextPublicKey = address.address
        }
      }

      if (!nextPublicKey) {
        nextPublicKey = await getLegacyPublicKey()
      }

      if (!nextPublicKey) {
        throw new Error(
          'Freighter is installed, but this page could not access it. Refresh the page, unlock Freighter, and approve this site when prompted.',
        )
      }

      const details = await getNetworkDetails()

      if (details.error) {
        throw new Error(getFreighterErrorMessage(details.error))
      }

      setPublicKey(nextPublicKey)
      setNetwork(details.network || 'PUBLIC')
      setNetworkPassphrase(details.networkPassphrase || null)
      setSorobanRpcUrl(details.sorobanRpcUrl || null)
      setNetworkUrl(details.networkUrl || 'https://horizon.stellar.org')
      setStatus('CONNECTED')
    } catch (reason) {
      setPublicKey(null)
      setNetwork(null)
      setNetworkPassphrase(null)
      setSorobanRpcUrl(null)
      setNetworkUrl(null)
      setStatus('ERROR')
      setError(reason instanceof Error ? reason.message : 'Wallet connection failed.')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('DISCONNECTED')
    setPublicKey(null)
    setNetwork(null)
    setNetworkPassphrase(null)
    setSorobanRpcUrl(null)
    setNetworkUrl(null)
    setError(null)
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
      connect,
      reset,
    }),
    [
      connect,
      error,
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
