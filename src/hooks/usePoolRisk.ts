import { useEffect, useState } from 'react'

export interface PoolRiskData {
  poolId: string
  trustScore: number
  tvlScore: number
  volatilityScore: number
  apyScore: number
  compositeScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  estimatedApy: number
}

export type PoolRiskState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PoolRiskData }
  | { status: 'error' }

const BASE = 'http://localhost:3000/api/v1/pools'

export function usePoolRisk(poolId: string | null): PoolRiskState {
  const [state, setState] = useState<PoolRiskState>({ status: 'idle' })

  useEffect(() => {
    if (!poolId) {
      queueMicrotask(() => setState({ status: 'idle' }))
      return
    }

    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setState({ status: 'loading' })
    })

    fetch(`${BASE}/${poolId}/risk`, { headers: { accept: 'application/json' } })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json() as Promise<PoolRiskData>
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'success', data })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => { cancelled = true }
  }, [poolId])

  return state
}
