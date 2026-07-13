import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit'
import { Asset, BASE_FEE, Horizon, Memo, Operation, TransactionBuilder } from '@stellar/stellar-sdk'

type MockWithdrawParams = {
  amount: number
  asset: string
  horizonUrl: string
  networkPassphrase: string
  publicKey: string
}

export async function executeMockTestnetWithdraw({
  amount,
  asset,
  horizonUrl,
  networkPassphrase,
  publicKey,
}: MockWithdrawParams) {
  if (amount <= 0) {
    throw new Error('Enter an amount greater than 0.')
  }

  if (!networkPassphrase.toLowerCase().includes('test')) {
    throw new Error('Demo transactions only run on Testnet. Switch Freighter to Testnet.')
  }

  const horizon = new Horizon.Server(horizonUrl)
  const account = await horizon.loadAccount(publicKey)

  const memoText = `Withdraw ${amount} ${asset}`.slice(0, 28)

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

  const signed = await StellarWalletsKit.signTransaction(transaction.toXDR(), {
    address: publicKey,
    networkPassphrase,
  })

  const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, networkPassphrase)
  const response = await horizon.submitTransaction(signedTx)

  return {
    hash: response.hash,
    status: 'SUCCESS' as const,
  }
}
