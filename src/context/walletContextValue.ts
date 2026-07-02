import { createContext } from 'react'
import type { WalletErrorType } from './WalletContext'
import type { WalletStatus } from '../types/stellar'

export type WalletContextValue = {
  status: WalletStatus
  publicKey: string | null
  network: string | null
  networkPassphrase: string | null
  sorobanRpcUrl: string | null
  networkUrl: string | null
  error: string | null
  errorType: WalletErrorType | null
  connect: () => Promise<void>
  reset: () => void
}

export const WalletContext = createContext<WalletContextValue | null>(null)
