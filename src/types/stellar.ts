export type WalletStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'

export type FreighterWallet = {
  getPublicKey: () => Promise<string> | string
}

export type LegacyFreighterApi = {
  getPublicKey?: () => Promise<string> | string
  requestAccess?: () => Promise<{ address?: string; publicKey?: string; error?: unknown }>
  isConnected?: () => Promise<boolean | { isConnected: boolean }> | boolean | { isConnected: boolean }
}

export type StellarWallets = {
  freighter?: FreighterWallet
}

declare global {
  interface Window {
    freighter?: boolean
    freighterApi?: LegacyFreighterApi
    stellarWallets?: StellarWallets
  }
}

export type TrustlineAsset = {
  code: 'XLM' | 'USDC' | 'AQUA' | 'yXLM'
  issuer: string
  balance: number
  usdValue: number
  dust: boolean
  route: string
}

export type WalletBalance = {
  id: string
  code: string
  issuer: string
  balance: string
  assetType: string
  isNative: boolean
}

export type YieldPosition = {
  protocol: string
  asset: string
  apy: number
  staked: string
  unlockDate: string
  sorobanContract: string
}

export type RouteHop = {
  label: string
  sublabel: string
}

export type RiskProfile = 'Conservative' | 'Moderate' | 'Aggressive'
