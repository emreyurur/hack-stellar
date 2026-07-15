import { signTransaction } from '@stellar/freighter-api'
import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Horizon,
  nativeToScVal,
  rpc,
  StrKey,
  TransactionBuilder,
} from '@stellar/stellar-sdk'
import { Buffer } from 'buffer'

// Soroban PoolVotingContract deployed address on Stellar Testnet
export const POOL_VOTING_CONTRACT_ID =
  import.meta.env.VITE_POOL_VOTING_CONTRACT_ID ||
  'CDYRNT2EBC3KJPYMCN3K7YWEIH5LS355TRJ25HPIEZYMAKFXFLM3XMZN'

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
 * Resolves a valid 56-character Soroban Address (C... or G...) for any given pool string ID.
 * If poolId is not already a valid Ed25519 or Contract address, hashes it with SHA-256
 * and encodes as a deterministic Soroban Contract Address (C...).
 */
export async function resolvePoolAddress(poolId: string): Promise<string> {
  if (StrKey.isValidEd25519PublicKey(poolId) || StrKey.isValidContract(poolId)) {
    return poolId
  }
  const encoder = new TextEncoder()
  const data = encoder.encode(poolId)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashBytes = new Uint8Array(hashBuffer)
  return StrKey.encodeContract(Buffer.from(hashBytes))
}

/**
 * Reads the aggregate upvotes and downvotes tuple (u32, u32) directly from
 * the deployed Soroban PoolVotingContract using get_score(pool).
 */
export async function fetchOnChainPoolScore(poolId: string): Promise<{ upvotes: number; downvotes: number } | null> {
  try {
    const contractId = POOL_VOTING_CONTRACT_ID
    const contract = new Contract(contractId)
    const targetPoolAddress = await resolvePoolAddress(poolId)
    const poolScVal = new Address(targetPoolAddress).toScVal()

    const operation = contract.call('get_score', poolScVal)

    // Dummy account for simulation read-only invocation
    const dummyAccount = new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0')
    const tx = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: 'Test SDF Network ; September 2015',
    })
      .addOperation(operation)
      .setTimeout(30)
      .build()

    const rpcServer = new rpc.Server(SOROBAN_RPC_URL)
    const simulated = await rpcServer.simulateTransaction(tx)

    if (rpc.Api.isSimulationSuccess(simulated) && simulated.result?.retval) {
      const scVal = simulated.result.retval
      const vec = scVal.vec()
      if (vec && vec.length === 2) {
        const up = vec[0].u32()
        const down = vec[1].u32()
        return { upvotes: Number(up || 0), downvotes: Number(down || 0) }
      }
    }
  } catch (err) {
    console.debug('Could not read on-chain pool score from Soroban contract:', err)
  }
  return null
}

/**
 * Executes the Soroban PoolVotingContract.vote(user, pool, is_upvote) function on-chain.
 * Signs via Freighter and submits directly to Soroban Testnet RPC without falling back.
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
  const targetPoolAddress = await resolvePoolAddress(poolId)

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
    .setTimeout(180)
    .build()

  const rpcServer = new rpc.Server(SOROBAN_RPC_URL)
  const prepared = await rpcServer.prepareTransaction(tx)

  const xdr = prepared.toXDR()
  const signRes = await signTransaction(xdr, { networkPassphrase, address: publicKey } as Parameters<typeof signTransaction>[1])
  const signedXdr = typeof signRes === 'string' ? signRes : signRes.signedTxXdr

  if (!signedXdr) {
    throw new Error('Transaction signature was cancelled in Freighter.')
  }

  const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
  const response = await rpcServer.sendTransaction(signedTx)

  if (response.status === 'ERROR') {
    let errDetail = 'Soroban smart contract transaction failed.'
    if ('errorResult' in response && response.errorResult) {
      const resultObj = response.errorResult as { toXDR?: (format: string) => string }
      errDetail += ` (Error Result: ${typeof response.errorResult === 'string' ? response.errorResult : resultObj.toXDR?.('base64') || JSON.stringify(response.errorResult)})`
    } else if ('errorResultXdr' in response && (response as unknown as { errorResultXdr?: string }).errorResultXdr) {
      errDetail += ` (Error XDR: ${String((response as unknown as { errorResultXdr?: string }).errorResultXdr)})`
    }
    throw new Error(errDetail)
  }

  // Poll for confirmation (PENDING -> SUCCESS)
  let finalStatus: string = response.status
  for (let i = 0; i < 8 && finalStatus === 'PENDING'; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    try {
      const txCheck = await rpcServer.getTransaction(response.hash)
      if (txCheck.status === 'SUCCESS' || txCheck.status === 'FAILED') {
        finalStatus = txCheck.status
        if (finalStatus === 'FAILED') {
          throw new Error('Soroban transaction failed on-chain after submission.')
        }
        break
      }
    } catch (pollErr: unknown) {
      const msg = pollErr instanceof Error ? pollErr.message : String(pollErr)
      if (msg.includes('failed on-chain')) throw pollErr
    }
  }

  return {
    hash: response.hash,
    status: 'SUCCESS',
    isSoroban: true,
  }
}
