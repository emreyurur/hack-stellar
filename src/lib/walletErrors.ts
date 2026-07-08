export type WalletErrorType = 'wallet_not_found' | 'user_rejected' | 'insufficient_balance' | 'unknown'

export function classifyWalletError(error: unknown): { type: WalletErrorType; message: string } {
  const msg = error instanceof Error ? error.message : String(error)
  const lower = msg.toLowerCase()

  if (
    lower.includes('not installed') ||
    lower.includes('not found') ||
    lower.includes('wallet not') ||
    lower.includes('extension') ||
    lower.includes('no wallet') ||
    lower.includes('unavailable')
  ) {
    return {
      type: 'wallet_not_found',
      message: 'Wallet not found. Install Freighter, xBull, or LOBSTR to continue.',
    }
  }

  if (
    lower.includes('rejected') ||
    lower.includes('declined') ||
    lower.includes('cancelled') ||
    lower.includes('canceled') ||
    lower.includes('user closed') ||
    lower.includes('user denied') ||
    lower.includes('modal closed')
  ) {
    return {
      type: 'user_rejected',
      message: 'Connection rejected. You closed the wallet dialog.',
    }
  }

  if (
    lower.includes('insufficient') ||
    lower.includes('underfunded') ||
    lower.includes('balance') ||
    lower.includes('tx_insufficient') ||
    lower.includes('not enough')
  ) {
    return {
      type: 'insufficient_balance',
      message: 'Insufficient balance. Add funds to your wallet and try again.',
    }
  }

  return { type: 'unknown', message: msg || 'Wallet connection failed.' }
}
