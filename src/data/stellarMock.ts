import type { RouteHop, TrustlineAsset, YieldPosition } from '../types/stellar'

export const trustlines: TrustlineAsset[] = [
  {
    code: 'AQUA',
    issuer: 'GBNZILSTVQZ4R7...',
    balance: 182.44,
    usdValue: 3.82,
    dust: true,
    route: 'AQUA -> XLM -> USDC',
  },
  {
    code: 'yXLM',
    issuer: 'GARDNV3Q7YGT...',
    balance: 11.08,
    usdValue: 1.46,
    dust: true,
    route: 'yXLM -> XLM -> USDC',
  },
  {
    code: 'USDC',
    issuer: 'GA5ZSEJYB37...',
    balance: 48.2,
    usdValue: 48.2,
    dust: false,
    route: 'Base asset',
  },
  {
    code: 'XLM',
    issuer: 'native',
    balance: 116.72,
    usdValue: 13.44,
    dust: false,
    route: 'nativeBalance reserve',
  },
]

export const yieldPositions: YieldPosition[] = [
  {
    protocol: 'Blend USDC Lending',
    asset: 'USDC',
    apy: 4.2,
    staked: '742.00 USDC supplied',
    unlockDate: 'Withdrawable if liquid',
    sorobanContract: 'CCXQ...9R2A',
  },
  {
    protocol: 'Soroswap AQUA / XLM LP',
    asset: 'AQUA-XLM',
    apy: 12.5,
    staked: '1,280 LP tokens',
    unlockDate: 'Redeemable LP',
    sorobanContract: 'CDL7...K4BV',
  },
  {
    protocol: 'Aquarius AMM Rewards',
    asset: 'AQUA-XLM',
    apy: 7.8,
    staked: '310.25 LP rewards',
    unlockDate: 'Pool withdrawal',
    sorobanContract: 'CBY2...8KLP',
  },
]

export const routeHops: RouteHop[] = [
  { label: 'AQUA', sublabel: 'dust trustline' },
  { label: 'XLM', sublabel: 'native DEX bridge' },
  { label: 'USDC', sublabel: 'base asset' },
]

export const unstakeEvents = [
  { date: 'Jun 18', title: 'USDC lending unlock', value: '742.00 USDC' },
  { date: 'Jul 04', title: 'yXLM vault cycle', value: '310.25 yXLM' },
  { date: 'Jul 29', title: 'fee bump review', value: 'batch operations' },
]
