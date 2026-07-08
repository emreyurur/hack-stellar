import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContractPanel } from './ContractPanel'

// ── Module mocks ────────────────────────────────────────────────────────────
// Prevent stellar-wallets-kit from accessing localStorage in jsdom
vi.mock('@creit.tech/stellar-wallets-kit', () => ({
  StellarWalletsKit: {
    init: vi.fn(),
    authModal: vi.fn(),
    getNetwork: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(() => () => {}),
    signTransaction: vi.fn(),
  },
  Networks: { TESTNET: 'Test SDF Network ; September 2015' },
}))
vi.mock('@creit.tech/stellar-wallets-kit/modules/freighter', () => ({ FreighterModule: class {} }))
vi.mock('@creit.tech/stellar-wallets-kit/modules/xbull', () => ({ xBullModule: class {} }))
vi.mock('@creit.tech/stellar-wallets-kit/modules/lobstr', () => ({ LobstrModule: class {} }))
vi.mock('@creit.tech/stellar-wallets-kit/modules/albedo', () => ({ AlbedoModule: class {} }))

vi.mock('../../context/useWallet', () => ({
  useWallet: () => ({
    publicKey: null,
    status: 'DISCONNECTED',
    networkPassphrase: '',
    networkUrl: '',
  }),
}))

vi.mock('../../services/counterContract', () => ({
  COUNTER_CONTRACT_ID: 'CAW6W5RJNLBBOQWVGPT4JALTU7P2M6KWQTWX44P4AHZZTLPE3XDTY43X',
  COUNTER_CONTRACT_DEPLOY_TX: 'deadbeef',
  callCounterGet: vi.fn().mockResolvedValue(42),
  callCounterIncrement: vi.fn().mockResolvedValue({ hash: 'abc123', newValue: 43 }),
}))

vi.mock('../../hooks/useCounterEvents', () => ({
  useCounterEvents: () => ({ snapshots: [], currentValue: 42, isPolling: false }),
}))

// ── Tests ───────────────────────────────────────────────────────────────────
describe('ContractPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the contract panel heading', () => {
    render(<ContractPanel />)
    expect(screen.getByText(/Counter contract/i)).toBeInTheDocument()
  })

  it('displays the deployed contract address', () => {
    render(<ContractPanel />)
    expect(screen.getByText('CAW6W5RJNLBBOQWVGPT4JALTU7P2M6KWQTWX44P4AHZZTLPE3XDTY43X')).toBeInTheDocument()
  })

  it('shows connect-wallet message when wallet is disconnected', () => {
    render(<ContractPanel />)
    expect(screen.getByText(/Connect your wallet/i)).toBeInTheDocument()
  })

  it('disables the increment button when wallet is not connected', () => {
    render(<ContractPanel />)
    const button = screen.getByRole('button', { name: /sign & call increment/i })
    expect(button).toBeDisabled()
  })

  it('shows the Soroban Contract label', () => {
    render(<ContractPanel />)
    expect(screen.getByText(/Soroban Contract/i)).toBeInTheDocument()
  })
})
