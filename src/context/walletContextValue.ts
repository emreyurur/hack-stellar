import { createContext } from 'react'
import type { WalletStatus } from '../types/stellar'

export type WalletContextValue = {
  status: WalletStatus
  publicKey: string | null
  network: string | null
  networkPassphrase: string | null
  sorobanRpcUrl: string | null
  networkUrl: string | null
  error: string | null
  connect: () => Promise<void>
  reset: () => void
}

export const WalletContext = createContext<WalletContextValue | null>(null)
