import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { PoolDetailsView } from './PoolDetailsView'

vi.mock('../../context/useWallet', () => ({
  useWallet: () => ({
    connect: vi.fn(),
    networkPassphrase: 'Test SDF Network ; September 2015',
    networkUrl: 'https://soroban-testnet.stellar.org',
    publicKey: 'GBXXX',
    status: 'CONNECTED',
  }),
}))

describe('PoolDetailsView render check', () => {
  it('renders without crashing on a standard pool', () => {
    const mockPool = {
      id: 'd26f6a1f9a4ef102a196925226e34d03842611fd7c84b31a5ceb49c304e62848',
      asset: 'XLM',
      name: 'XLM Vault',
      protocol: 'Soroswap',
      apy: 12.5,
      tvl: '$1.2M',
      tvlRaw: 1200000,
      risk: 'Conservative' as const,
      category: 'AMM LP' as const,
      feeBp: 30,
      reputation: { liquidity: 20, age: 10, audit: 10, activity: 10 },
      method: 'addLiquidity()' as const,
      rationale: 'Mock pool for tests',
      contractId: 'SoroswapPool',
    }

    const { container } = render(
      <PoolDetailsView
        available={100}
        initialTab="overview"
        onBack={() => {}}
        onPositionAdded={() => {}}
        pool={mockPool}
        userPositions={[]}
      />
    )
    expect(container).toBeDefined()
  })
})
