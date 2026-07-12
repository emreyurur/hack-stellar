import { useEffect, useState } from 'react'
import type { DeFiPool, PoolReputation, RiskProfile } from '../types/stellar'

// ─── Raw API types ─────────────────────────────────────────────────────────────

export interface ApiPool {
  id: string
  feeBp: number
  type: string
  totalShares: number
  assetACode: string
  assetAIssuer: string | null
  reserveA: number
  assetBCode: string
  assetBIssuer: string | null
  reserveB: number
  totalTrustlines: number
  lastSyncedAt: string
  isActive: boolean
}

interface ApiResponse {
  data: ApiPool[]
}

// ─── Mapping helpers ───────────────────────────────────────────────────────────

/**
 * Compute a reputation score from on-chain pool data.
 *
 * We derive four sub-scores without any off-chain enrichment:
 *   liquidity (0-40): based on total reserves denominated in "A" units
 *   age       (0-20): always 15 for real pools (we have no creation date)
 *   audit     (0-20): 10 for known protocol tokens, 5 otherwise
 *   activity  (0-20): based on number of trustlines
 */
function deriveReputation(pool: ApiPool): PoolReputation {
  // Liquidity score – log scale capped at 40
  const totalLiquidity = pool.reserveA + pool.reserveB
  const liquidityScore = Math.min(40, Math.round(Math.log10(totalLiquidity + 1) * 5))

  // Age score – placeholder since we don't have creation date from this endpoint
  const ageScore = 15

  // Audit score – known stablecoins & major assets get a higher score
  const knownAssets = ['XLM', 'USDC', 'AQUA', 'yXLM', 'BTC', 'ETH', 'EURC']
  const aKnown = knownAssets.includes(pool.assetACode)
  const bKnown = knownAssets.includes(pool.assetBCode)
  const auditScore = aKnown && bKnown ? 20 : aKnown || bKnown ? 14 : 8

  // Activity score – based on trustlines (more = more active community)
  const activityScore = Math.min(20, Math.max(4, pool.totalTrustlines * 4))

  return {
    liquidity: liquidityScore,
    age: ageScore,
    audit: auditScore,
    activity: activityScore,
  }
}

function deriveRisk(reputation: PoolReputation): RiskProfile {
  const total = reputation.liquidity + reputation.age + reputation.audit + reputation.activity
  if (total >= 70) return 'Conservative'
  if (total >= 50) return 'Moderate'
  return 'Aggressive'
}

/**
 * Format a raw reserve number into a human-friendly TVL string.
 * We use the larger reserve as the TVL proxy (usually the stablecoin side).
 */
function formatTvl(reserveA: number, reserveB: number): { tvl: string; tvlRaw: number } {
  const tvlRaw = Math.max(reserveA, reserveB)
  if (tvlRaw >= 1_000_000) {
    return { tvl: `$${(tvlRaw / 1_000_000).toFixed(2)}M`, tvlRaw }
  }
  if (tvlRaw >= 1_000) {
    return { tvl: `$${(tvlRaw / 1_000).toFixed(1)}K`, tvlRaw }
  }
  return { tvl: `$${tvlRaw.toFixed(0)}`, tvlRaw }
}

/**
 * Derive a rough estimated APY from the fee tier and pool activity.
 * Real APY calculation requires volume data, which this endpoint doesn't expose.
 * We approximate: feeBp / 100  gives fee %. We assume a reasonable volume/TVL ratio.
 */
function estimateApy(pool: ApiPool): number {
  const feePct = pool.feeBp / 100
  // Volume/TVL ratio assumption based on trustlines (proxy for activity)
  const volumeRatio = Math.min(3, 0.5 + pool.totalTrustlines * 0.3)
  return parseFloat((feePct * 365 * volumeRatio).toFixed(1))
}

function mapApiPoolToDeFiPool(pool: ApiPool): DeFiPool {
  const reputation = deriveReputation(pool)
  const risk = deriveRisk(reputation)
  const { tvl, tvlRaw } = formatTvl(pool.reserveA, pool.reserveB)
  const apy = estimateApy(pool)

  // Display order: XLM first, then as-is
  let assetA = pool.assetACode
  let assetB = pool.assetBCode
  if (pool.assetBCode === 'XLM') {
    assetA = pool.assetBCode
    assetB = pool.assetACode
  }

  const supportedAssets = new Set(['XLM', 'USDC', 'EURC'])
  const poolAsset = supportedAssets.has(assetA) ? (assetA as DeFiPool['asset']) : 'USDC'

  return {
    id: pool.id,
    protocol: 'Soroswap AMM',
    category: 'AMM LP',
    asset: poolAsset,
    secondaryAsset: assetB,
    apy,
    tvl,
    tvlRaw,
    volume24h: '—',
    reputation,
    risk,
    method: 'addLiquidity()',
    rationale: `Add liquidity to the ${assetA} / ${assetB} pool and earn ${(pool.feeBp / 100).toFixed(2)}% swap fees.`,
    contractId: pool.id.slice(0, 8) + '…' + pool.id.slice(-6),
    feeBp: pool.feeBp,
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export type PoolsState =
  | { status: 'loading' }
  | { status: 'success'; pools: DeFiPool[] }
  | { status: 'error'; message: string }

const API_URL = 'http://localhost:3000/api/v1/pools?page=1&limit=20'

export function usePools(): PoolsState {
  const [state, setState] = useState<PoolsState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function fetchPools() {
      try {
        const res = await fetch(API_URL, { headers: { accept: '*/*' } })
        if (!res.ok) throw new Error(`API returned ${res.status}`)
        const json: ApiResponse = await res.json()

        if (!cancelled) {
          const pools = json.data
            .filter((p) => p.isActive)
            // Sort by largest reserve (highest liquidity first)
            .sort((a, b) => Math.max(b.reserveA, b.reserveB) - Math.max(a.reserveA, a.reserveB))
            .slice(0, 20)
            .map(mapApiPoolToDeFiPool)

          setState({ status: 'success', pools })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Failed to load pools',
          })
        }
      }
    }

    fetchPools()
    return () => { cancelled = true }
  }, [])

  return state
}
