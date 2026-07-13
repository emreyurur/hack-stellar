import { signTransaction } from '@stellar/freighter-api'
import { Asset, BASE_FEE, Horizon, Memo, Operation, TransactionBuilder } from '@stellar/stellar-sdk'

type MockSupplyParams = {
  amount: number
  asset: string
  horizonUrl: string
  networkPassphrase: string
  protocol: string
  publicKey: string
}

// Sends a minimal self-payment on testnet with a descriptive memo.
// This demonstrates the full Freighter approval → Horizon submission flow
// without touching real DeFi contract state.
export async function executeMockTestnetSupply({
  amount,
  asset,
  horizonUrl,
  networkPassphrase,
  protocol,
  publicKey,
}: MockSupplyParams) {
  if (amount <= 0) {
    throw new Error('Enter an amount greater than 0.')
  }

  if (!networkPassphrase.toLowerCase().includes('test')) {
    throw new Error('Demo transactions only run on Testnet. Switch Freighter to Testnet.')
  }

  const horizon = new Horizon.Server(horizonUrl)
  const account = await horizon.loadAccount(publicKey)

  const memoText = `${protocol} ${amount} ${asset}`.slice(0, 28)

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: publicKey,
        asset: Asset.native(),
        amount: '0.0010000',
      }),
    )
    .addMemo(Memo.text(memoText))
    .setTimeout(60)
    .build()

  const signed = await signTransaction(transaction.toXDR(), {
    address: publicKey,
    networkPassphrase,
  })

  if (signed.error) {
    throw new Error(signed.error.message ?? 'Freighter rejected the transaction.')
  }

  const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, networkPassphrase)
  const response = await horizon.submitTransaction(signedTx)

  return {
    hash: response.hash,
    status: 'SUCCESS' as const,
  }
}
