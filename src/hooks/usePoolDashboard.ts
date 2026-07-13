import { useEffect, useState } from 'react'
import { API_BASE } from '../services/terminal8Api'

export interface PoolDashboardData {
  vaultOverview?: {
    totalSupplied: number
    totalBorrowed: number
    utilization: number
    supplyApy: number
    supplyApy90dAvg: number
  }
  strategyOverview?: {
    name: string
    profile: string
    description: string
  }
  chartData?: Array<{
    timestamp: string
    supplyApy: number
    totalSupply: number
  }>
}

export type PoolDashboardState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PoolDashboardData }
  | { status: 'error' }

const POOLS_BASE = `${API_BASE}api/v1/pools`

export function usePoolDashboard(poolId: string | null): PoolDashboardState {
  const [state, setState] = useState<PoolDashboardState>({ status: 'idle' })

  useEffect(() => {
    if (!poolId) {
      queueMicrotask(() => setState({ status: 'idle' }))
      return
    }

    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setState({ status: 'loading' })
    })

    fetch(`${POOLS_BASE}/${poolId}/dashboard`, { headers: { accept: '*/*' } })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json() as Promise<PoolDashboardData>
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'success', data })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [poolId])

  return state
}
