import { useEffect, useState, useCallback } from 'react'
import {
  fetchLendingDashboard,
  fetchUserPortfolio,
  type LendingDashboardResponse,
  type PortfolioPositionsResponse,
} from '../services/terminal8Api'

export interface PortfolioCombinedData {
  lendingDashboard: LendingDashboardResponse
  portfolio: PortfolioPositionsResponse
}

export type PortfolioDashboardState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PortfolioCombinedData }
  | { status: 'error' }

export function usePortfolioDashboard(publicKey: string | null) {
  const [state, setState] = useState<PortfolioDashboardState>({ status: 'idle' })

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setState({ status: 'idle' })
      return
    }
    setState({ status: 'loading' })
    try {
      const [lendingDashboard, portfolio] = await Promise.all([
        fetchLendingDashboard(publicKey).catch(() => ({}) as LendingDashboardResponse),
        fetchUserPortfolio(publicKey).catch(() => ({
          userPublicKey: publicKey,
          totalValueUsd: 0,
          totalPnlUsd: 0,
          positions: [],
        })),
      ])
      setState({
        status: 'success',
        data: { lendingDashboard, portfolio },
      })
    } catch {
      setState({ status: 'error' })
    }
  }, [publicKey])

  useEffect(() => {
    queueMicrotask(() => {
      refresh()
    })
  }, [refresh])

  return { state, refresh }
}
