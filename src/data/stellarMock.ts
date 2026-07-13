import type { DeFiPool, LocalPosition, RouteHop, TrustlineAsset, YieldPosition } from '../types/stellar'

export function reputationTotal(r: DeFiPool['reputation']) {
  return r.liquidity + r.age + r.audit + r.activity
}

export function reputationLabel(score: number): 'Trusted' | 'Moderate' | 'Risky' {
  if (score >= 75) return 'Trusted'
  if (score >= 50) return 'Moderate'
  return 'Risky'
}

export const YRK_VAULT_POOL: DeFiPool = {
  id: 'd26f6a1f9a4ef102a196925226e34d03842611fd7c84b31a5ceb49c304e62848',
  protocol: 'Soroswap AMM',
  category: 'AMM LP',
  asset: 'YRK',
  secondaryAsset: 'XLM',
  apy: 24.5,
  tvl: '$1.115B',
  tvlRaw: 1_115_000_000,
  volume24h: '$4.2M',
  reputation: { liquidity: 36, age: 18, audit: 18, activity: 19 },
  risk: 'Moderate',
  method: 'addLiquidity()',
  rationale: 'Provide liquidity to YRK / XLM Soroban vault and earn 24.5% APY with on-chain trust voting.',
  contractId: 'd26f6a1f9a4ef102a196925226e34d03842611fd7c84b31a5ceb49c304e62848',
}

export const TERMINAL_VAULT_POOL: DeFiPool = {
  id: 'badef3833c6c0765df43b3af3cfe0bb7b7919937143a234171cde7b8d72c4f45',
  protocol: 'Soroswap AMM',
  category: 'AMM LP',
  asset: 'terminal',
  secondaryAsset: 'XLM',
  apy: 18.2,
  tvl: '$485K',
  tvlRaw: 485_000,
  volume24h: '$120K',
  reputation: { liquidity: 32, age: 15, audit: 18, activity: 16 },
  risk: 'Moderate',
  method: 'addLiquidity()',
  rationale: 'Provide liquidity to terminal / XLM Soroban vault and earn yield with on-chain trust voting.',
  contractId: 'badef3833c6c0765df43b3af3cfe0bb7b7919937143a234171cde7b8d72c4f45',
}

export const stellarPools: DeFiPool[] = [
  YRK_VAULT_POOL,
  TERMINAL_VAULT_POOL,
  {
    id: 'blend-usdc-lending',
    protocol: 'Blend Protocol',
    category: 'Lending',
    asset: 'USDC',
    apy: 4.2,
    tvl: '$2.4M',
    tvlRaw: 2_400_000,
    utilization: 68,
    reputation: { liquidity: 35, age: 18, audit: 20, activity: 14 },
    risk: 'Conservative',
    method: 'supply()',
    rationale: 'Earn stable yield on idle USDC via non-custodial lending.',
    contractId: 'CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF',
  },
  {
    id: 'blend-xlm-lending',
    protocol: 'Blend Protocol',
    category: 'Lending',
    asset: 'XLM',
    apy: 5.1,
    tvl: '$1.1M',
    tvlRaw: 1_100_000,
    utilization: 45,
    reputation: { liquidity: 28, age: 18, audit: 20, activity: 13 },
    risk: 'Conservative',
    method: 'supply()',
    rationale: 'Supply XLM to earn borrower-paid yield while keeping fee reserves.',
    contractId: 'CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF',
  },
  {
    id: 'soroswap-xlm-usdc',
    protocol: 'Soroswap',
    category: 'AMM LP',
    asset: 'XLM',
    secondaryAsset: 'USDC',
    apy: 12.5,
    tvl: '$890K',
    tvlRaw: 890_000,
    volume24h: '$125K',
    reputation: { liquidity: 25, age: 14, audit: 15, activity: 17 },
    risk: 'Moderate',
    method: 'addLiquidity()',
    rationale: 'Provide liquidity to the most active XLM pair and earn swap fees.',
    contractId: 'CDL7...K4BV',
  },
  {
    id: 'aquarius-aqua-xlm',
    protocol: 'Aquarius',
    category: 'AMM Rewards',
    asset: 'XLM',
    secondaryAsset: 'AQUA',
    apy: 7.8,
    tvl: '$340K',
    tvlRaw: 340_000,
    volume24h: '$48K',
    reputation: { liquidity: 14, age: 12, audit: 15, activity: 17 },
    risk: 'Aggressive',
    method: 'addLiquidity()',
    rationale: 'Earn AQUA reward incentives by staking in Aquarius AMM pools.',
    contractId: 'CBY2...8KLP',
  },
  {
    id: 'soroswap-aqua-xlm',
    protocol: 'Soroswap',
    category: 'AMM LP',
    asset: 'XLM',
    secondaryAsset: 'AQUA',
    apy: 18.2,
    tvl: '$210K',
    tvlRaw: 210_000,
    volume24h: '$32K',
    reputation: { liquidity: 10, age: 10, audit: 15, activity: 13 },
    risk: 'Aggressive',
    method: 'addLiquidity()',
    rationale: 'High-yield LP for users comfortable with impermanent loss and AQUA exposure.',
    contractId: 'CSRW...7XLP',
  },
]

export const demoPositions: LocalPosition[] = [
  {
    id: 'demo-1',
    amount: 742,
    asset: 'USDC',
    hash: 'a8f3e1b2c4d56789a8f3e1b2c4d56789a8f3e1b2c4d56789a8f3e1b2c456789a',
    protocol: 'Blend Protocol',
    status: 'SUCCESS',
    timestamp: '09:14',
    openedAt: Date.now() - 4 * 3_600_000,
    apy: 4.2,
    category: 'Lending',
    poolId: 'blend-usdc-lending',
  },
  {
    id: 'demo-2',
    amount: 280,
    asset: 'XLM',
    hash: 'b9e4f2a3d5678901b9e4f2a3d5678901b9e4f2a3d5678901b9e4f2a3d567890b',
    protocol: 'Soroswap',
    status: 'SUCCESS',
    timestamp: '11:52',
    openedAt: Date.now() - 1.5 * 3_600_000,
    apy: 12.5,
    category: 'AMM LP',
    poolId: 'soroswap-xlm-usdc',
  },
]

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
