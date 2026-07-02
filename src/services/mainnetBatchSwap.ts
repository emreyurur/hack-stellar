import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit'
import {
  Asset,
  BASE_FEE,
  Horizon,
  Operation,
  Transaction,
  TransactionBuilder,
} from '@stellar/stellar-sdk'
import type { WalletBalance } from '../types/stellar'

const PUBLIC_NETWORK_PASSPHRASE = 'Public Global Stellar Network ; September 2015'
const XLM_RESERVE_BUFFER = 3
const SLIPPAGE_BUFFER = 0.99

type BatchSwapInput = {
  balances: WalletBalance[]
  networkPassphrase: string | null
  networkUrl: string | null
  publicKey: string | null
  selectedRows: WalletBalance[]
  targetAsset: 'USDC' | 'XLM'
}

type PlannedSwap = {
  destinationAmount: string
  operation: ReturnType<typeof Operation.pathPaymentStrictSend>
  sourceCode: string
}

export type BatchSwapResult = {
  explorerNetwork: 'public'
  hash: string
  operationCount: number
  skippedAssets: string[]
  targetAsset: string
}

type HorizonPathAsset = {
  asset_code?: string
  asset_issuer?: string
  asset_type: string
}

type HorizonPathRecord = {
  destination_amount: string
  path: HorizonPathAsset[]
}

export async function executeMainnetBatchSwap({
  balances,
  networkPassphrase,
  networkUrl,
  publicKey,
  selectedRows,
  targetAsset,
}: BatchSwapInput): Promise<BatchSwapResult> {
  if (!publicKey || !networkUrl || !networkPassphrase) {
    throw new Error('Connect Freighter before building a Mainnet batch swap.')
  }

  if (networkPassphrase !== PUBLIC_NETWORK_PASSPHRASE) {
    throw new Error('Switch Freighter to Stellar Mainnet before signing this batch swap.')
  }

  if (selectedRows.length === 0) {
    throw new Error('Select at least one token to batch swap.')
  }

  const destinationAsset = resolveDestinationAsset(targetAsset, balances)
  const horizon = new Horizon.Server(networkUrl)
  const account = await horizon.loadAccount(publicKey)
  const plannedSwaps: PlannedSwap[] = []
  const skippedAssets: string[] = []

  for (const row of selectedRows) {
    if (isSameAsset(row, destinationAsset)) {
      skippedAssets.push(`${row.code} already matches target`)
      continue
    }

    const sendAmount = getSpendableAmount(row)

    if (Number(sendAmount) <= 0) {
      skippedAssets.push(`${row.code} below spendable reserve`)
      continue
    }

    const sourceAsset = balanceToAsset(row)
    const path = await findBestStrictSendPath(horizon, sourceAsset, sendAmount, destinationAsset)

    if (!path) {
      skippedAssets.push(`${row.code} has no Mainnet route`)
      continue
    }

    plannedSwaps.push({
      destinationAmount: path.destination_amount,
      operation: Operation.pathPaymentStrictSend({
        destination: publicKey,
        destAsset: destinationAsset,
        destMin: applySlippage(path.destination_amount),
        path: path.path.map(pathAssetToAsset),
        sendAmount,
        sendAsset: sourceAsset,
      }),
      sourceCode: row.code,
    })
  }

  if (plannedSwaps.length === 0) {
    throw new Error(
      skippedAssets.length > 0
        ? skippedAssets.join('. ')
        : 'No Horizon strict-send route found on Mainnet for the selected assets.',
    )
  }

  let builder = new TransactionBuilder(account, {
    fee: (Number(BASE_FEE) * plannedSwaps.length).toString(),
    networkPassphrase,
  }).setTimeout(60)

  for (const plannedSwap of plannedSwaps) {
    builder = builder.addOperation(plannedSwap.operation)
  }

  const transaction = builder.build()
  const signed = await StellarWalletsKit.signTransaction(transaction.toXDR(), {
    address: publicKey,
    networkPassphrase,
  })

  const signedTransaction = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    networkPassphrase,
  ) as Transaction
  const response = await horizon.submitTransaction(signedTransaction, {
    skipMemoRequiredCheck: true,
  })

  return {
    explorerNetwork: 'public',
    hash: response.hash,
    operationCount: plannedSwaps.length,
    skippedAssets,
    targetAsset,
  }
}

function resolveDestinationAsset(targetAsset: 'USDC' | 'XLM', balances: WalletBalance[]) {
  if (targetAsset === 'XLM') {
    return Asset.native()
  }

  const usdcBalance = balances.find((row) => row.code === 'USDC' && !row.isNative && row.issuer)

  if (!usdcBalance) {
    throw new Error('USDC trustline was not found on this Mainnet account. Add USDC or choose XLM.')
  }

  return balanceToAsset(usdcBalance)
}

function balanceToAsset(row: WalletBalance) {
  if (row.isNative) {
    return Asset.native()
  }

  return new Asset(row.code, row.issuer)
}

function pathAssetToAsset(row: HorizonPathAsset) {
  if (row.asset_type === 'native') {
    return Asset.native()
  }

  if (!row.asset_code || !row.asset_issuer) {
    throw new Error('Horizon returned an invalid path asset.')
  }

  return new Asset(row.asset_code, row.asset_issuer)
}

function isSameAsset(row: WalletBalance, target: Asset) {
  if (row.isNative || target.isNative()) {
    return row.isNative && target.isNative()
  }

  return row.code === target.getCode() && row.issuer === target.getIssuer()
}

function getSpendableAmount(row: WalletBalance) {
  const amount = Number(row.balance)

  if (row.isNative) {
    return formatStellarAmount(Math.max(amount - XLM_RESERVE_BUFFER, 0))
  }

  return formatStellarAmount(amount)
}

async function findBestStrictSendPath(
  horizon: Horizon.Server,
  sourceAsset: Asset,
  sourceAmount: string,
  destinationAsset: Asset,
) {
  const response = await horizon.strictSendPaths(sourceAsset, sourceAmount, [destinationAsset]).call()
  const records = response.records as unknown as HorizonPathRecord[]

  return records.sort((left, right) => Number(right.destination_amount) - Number(left.destination_amount))[0]
}

function applySlippage(amount: string) {
  return formatStellarAmount(Number(amount) * SLIPPAGE_BUFFER)
}

function formatStellarAmount(amount: number) {
  return amount.toFixed(7).replace(/\.?0+$/, '')
}
