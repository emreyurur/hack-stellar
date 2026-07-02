import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit'
import {
  Address,
  BASE_FEE,
  Contract,
  Horizon,
  nativeToScVal,
  rpc,
  TransactionBuilder,
} from '@stellar/stellar-sdk'

// Soroswap testnet deployed contracts
// Source: github.com/soroswap/core
const SOROSWAP_TESTNET = {
  router: 'CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH',
  // SAC (Stellar Asset Contract) addresses on testnet — same network as Blend
  tokens: {
    XLM:  'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    USDC: 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU',
  },
}

const STROOPS = 10_000_000n
const SLIPPAGE = 0.95  // 5% slippage tolerance for demo

type AddLiquidityParams = {
  amountA: number
  amountB: number
  horizonUrl: string
  networkPassphrase: string
  publicKey: string
  sorobanRpcUrl: string
  tokenA: 'XLM' | 'USDC'
  tokenB: 'XLM' | 'USDC'
}

function toI128(amount: number) {
  return nativeToScVal(BigInt(Math.floor(amount * Number(STROOPS))), { type: 'i128' })
}

function toAddress(address: string) {
  return new Address(address).toScVal()
}

function deadlineScVal() {
  return nativeToScVal(BigInt(Math.floor(Date.now() / 1000) + 60), { type: 'u64' })
}

export async function executeSoroswapAddLiquidity({
  amountA,
  amountB,
  horizonUrl,
  networkPassphrase,
  publicKey,
  sorobanRpcUrl,
  tokenA,
  tokenB,
}: AddLiquidityParams) {
  if (amountA <= 0 || amountB <= 0) {
    throw new Error('Both token amounts must be greater than 0.')
  }

  if (!networkPassphrase.toLowerCase().includes('test')) {
    throw new Error('Soroswap LP demo runs on Testnet only. Switch Freighter to Testnet.')
  }

  const tokenAAddress = SOROSWAP_TESTNET.tokens[tokenA]
  const tokenBAddress = SOROSWAP_TESTNET.tokens[tokenB]

  const horizon = new Horizon.Server(horizonUrl)
  const account = await horizon.loadAccount(publicKey)

  const router = new Contract(SOROSWAP_TESTNET.router)

  // Build add_liquidity call on Soroswap Router
  const operation = router.call(
    'add_liquidity',
    toAddress(tokenAAddress),      // token_a
    toAddress(tokenBAddress),      // token_b
    toI128(amountA),               // amount_a_desired
    toI128(amountB),               // amount_b_desired
    toI128(amountA * SLIPPAGE),    // amount_a_min (5% slippage)
    toI128(amountB * SLIPPAGE),    // amount_b_min (5% slippage)
    toAddress(publicKey),          // to (LP tokens recipient)
    deadlineScVal(),               // deadline (60s from now)
  )

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build()

  const rpcServer = new rpc.Server(sorobanRpcUrl)
  const prepared = await rpcServer.prepareTransaction(tx)

  const signed = await StellarWalletsKit.signTransaction(prepared.toXDR(), {
    address: publicKey,
    networkPassphrase,
  })

  const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, networkPassphrase)
  const result = await rpcServer.sendTransaction(signedTx)

  return {
    hash: result.hash,
    status: result.status,
  }
}

// Rough price ratio for testnet demo (XLM ≈ $0.12, USDC = $1)
// In production this would be fetched from the pool reserves
export function estimateSecondaryAmount(primaryAsset: 'XLM' | 'USDC', primaryAmount: number): number {
  if (primaryAsset === 'XLM') return primaryAmount * 0.12   // XLM → USDC
  return primaryAmount / 0.12                                // USDC → XLM
}
