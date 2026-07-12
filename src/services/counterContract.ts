import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit'
import {
  BASE_FEE,
  Contract,
  Horizon,
  rpc,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk'
import { classifyWalletError } from '../lib/walletErrors'

// Terminal8 Counter contract deployed on Stellar Testnet
// Deploy TX: 141e83905dfee9c191a3b22c7d761be3a99e99894ee27b4df5f61cd6e9d3784a
export const COUNTER_CONTRACT_ID = 'CAW6W5RJNLBBOQWVGPT4JALTU7P2M6KWQTWX44P4AHZZTLPE3XDTY43X'
export const COUNTER_CONTRACT_DEPLOY_TX = '141e83905dfee9c191a3b22c7d761be3a99e99894ee27b4df5f61cd6e9d3784a'

const TESTNET_SOROBAN_RPC = 'https://soroban-testnet.stellar.org'
const TESTNET_HORIZON = 'https://horizon-testnet.stellar.org'
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015'

type CounterResult = {
  hash: string
  newValue: number
}

export async function callCounterIncrement(publicKey: string): Promise<CounterResult> {
  const horizon = new Horizon.Server(TESTNET_HORIZON)
  const account = await horizon.loadAccount(publicKey)

  const contract = new Contract(COUNTER_CONTRACT_ID)
  const operation = contract.call('increment')

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: TESTNET_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build()

  const rpcServer = new rpc.Server(TESTNET_SOROBAN_RPC)
  const prepared = await rpcServer.prepareTransaction(tx)

  let signed: { signedTxXdr: string }
  try {
    signed = await StellarWalletsKit.signTransaction(prepared.toXDR(), {
      address: publicKey,
      networkPassphrase: TESTNET_PASSPHRASE,
    })
  } catch (err) {
    const { message } = classifyWalletError(err)
    throw new Error(message, { cause: err })
  }

  const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, TESTNET_PASSPHRASE)
  const response = await rpcServer.sendTransaction(signedTx)

  if (response.status === 'ERROR') {
    throw new Error(classifyWalletError('Transaction failed on Soroban RPC.').message)
  }

  // Poll for confirmation
  let result = await rpcServer.getTransaction(response.hash)
  let retries = 10
  while (result.status === 'NOT_FOUND' && retries-- > 0) {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    result = await rpcServer.getTransaction(response.hash)
  }

  if (result.status !== 'SUCCESS') {
    throw new Error(`Transaction ${result.status}. Check explorer for details.`)
  }

  // Decode return value (u32)
  let newValue = 0
  try {
    const returnVal = (result as { returnValue?: xdr.ScVal }).returnValue
    if (returnVal) {
      newValue = returnVal.u32()
    }
  } catch {
    newValue = -1
  }

  return { hash: response.hash, newValue }
}

export async function callCounterGet(): Promise<number> {
  const rpcServer = new rpc.Server(TESTNET_SOROBAN_RPC)
  const contract = new Contract(COUNTER_CONTRACT_ID)

  // Simulate a read-only call
  const account = { accountId: () => 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN', sequenceNumber: () => '0', incrementSequenceNumber: () => {} } as never
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: TESTNET_PASSPHRASE,
  })
    .addOperation(contract.call('get'))
    .setTimeout(60)
    .build()

  try {
    const sim = await rpcServer.simulateTransaction(tx)
    if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      return sim.result.retval.u32()
    }
  } catch {
    // ignore
  }
  return 0
}
