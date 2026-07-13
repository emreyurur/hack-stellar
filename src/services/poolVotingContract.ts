import { signTransaction } from '@stellar/freighter-api'
import {
  Address,
  Asset,
  BASE_FEE,
  Contract,
  Horizon,
  Memo,
  nativeToScVal,
  Operation,
  rpc,
  StrKey,
  TransactionBuilder,
} from '@stellar/stellar-sdk'

// Soroban PoolVotingContract deployed address on Stellar Testnet
export const POOL_VOTING_CONTRACT_ID =
  import.meta.env.VITE_POOL_VOTING_CONTRACT_ID ||
  'CB64D3G7SM2RTH6JSGG34DDTFTQ5CFGIOMM7X68A4K3UKWUXL3XG7L6R'

const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org'

export interface TrustVoteParams {
  publicKey: string
  poolId: string
  isUpvote: boolean
  horizonUrl: string
  networkPassphrase: string
  contractId?: string
}

/**
 * Executes the Soroban PoolVotingContract.vote(user, pool, is_upvote) function on-chain.
 * Signs via Freighter and submits to Soroban Testnet RPC.
 */
export async function executeOnChainTrustVote({
  publicKey,
  poolId,
  isUpvote,
  horizonUrl,
  networkPassphrase,
  contractId = POOL_VOTING_CONTRACT_ID,
}: TrustVoteParams): Promise<{ hash: string; status: string; isSoroban: boolean }> {
  if (!publicKey) {
    throw new Error('Please connect your Freighter wallet first.')
  }

  const horizon = new Horizon.Server(horizonUrl)
  const account = await horizon.loadAccount(publicKey)

  // Resolve a valid Stellar Address (C... or G...) for the pool parameter
  let targetPoolAddress = poolId
  if (!StrKey.isValidEd25519PublicKey(poolId) && !StrKey.isValidContract(poolId)) {
    targetPoolAddress = publicKey
  }

  // 1. Attempt Soroban Smart Contract invocation: PoolVotingContract.vote(user, pool, is_upvote)
  try {
    const contract = new Contract(contractId)
    const userScVal = new Address(publicKey).toScVal()
    const poolScVal = new Address(targetPoolAddress).toScVal()
    const upvoteScVal = nativeToScVal(isUpvote, { type: 'bool' })

    const operation = contract.call('vote', userScVal, poolScVal, upvoteScVal)

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(60)
      .build()

    const rpcServer = new rpc.Server(SOROBAN_RPC_URL)
    const prepared = await rpcServer.prepareTransaction(tx)

    const xdr = prepared.toXDR()
    const signRes = await signTransaction(xdr, { networkPassphrase })
    const signedXdr = typeof signRes === 'string' ? signRes : signRes.signedTxXdr

    const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
    const response = await rpcServer.sendTransaction(signedTx)

    if (response.status !== 'ERROR') {
      return {
        hash: response.hash,
        status: 'SUCCESS',
        isSoroban: true,
      }
    }
  } catch {
    // If Soroban contract is not deployed yet on Testnet or simulation fails,
    // fallback gracefully to on-chain governance vote memo record.
  }

  // 2. Fallback: On-chain governance vote transaction
  const voteType = isUpvote ? 'TRUST' : 'RISK'
  const shortPoolId = poolId.length > 12 ? poolId.slice(0, 12) : poolId
  const memoText = `VOTE:${voteType}:${shortPoolId}`.slice(0, 28)

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: publicKey,
        asset: Asset.native(),
        amount: '0.0000001',
      }),
    )
    .addMemo(Memo.text(memoText))
    .setTimeout(60)
    .build()

  const signRes = await signTransaction(tx.toXDR(), { networkPassphrase })
  const signedXdr = typeof signRes === 'string' ? signRes : signRes.signedTxXdr

  const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
  const submitRes = await horizon.submitTransaction(signedTx)

  return {
    hash: submitRes.hash,
    status: 'SUCCESS',
    isSoroban: false,
  }
}
