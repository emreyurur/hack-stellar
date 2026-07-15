import { Injectable, Logger } from '@nestjs/common';
import { Asset, Keypair, Operation, TransactionBuilder, Networks, LiquidityPoolAsset, Horizon, getLiquidityPoolId } from '@stellar/stellar-sdk';
import { AutomateLpDto } from './dto/automate-lp.dto';
import { HistoryService } from '../history/history.service';
import { TransactionType } from '../history/entities/transaction-history.entity';

@Injectable()
export class TestnetToolsService {
  private readonly logger = new Logger(TestnetToolsService.name);

  constructor(private readonly historyService: HistoryService) {}

  async automateTokenAndLP(params: AutomateLpDto) {
    this.logger.log('Starting automated Token Minting and LP Deposit...');

    const issuerSecretStr = process.env.TESTNET_ISSUER_SECRET;
    const distributorSecretStr = params.distributorSecret || process.env.TESTNET_DISTRIBUTOR_SECRET;

    if (!issuerSecretStr || !distributorSecretStr) {
      throw new Error('Issuer and Distributor secrets are required (via DTO or .env)');
    }

    const issuerKeys = Keypair.fromSecret(issuerSecretStr);
    const distributorKeys = Keypair.fromSecret(distributorSecretStr);

    const customToken = new Asset(params.tokenCode, issuerKeys.publicKey());
    const nativeToken = Asset.native();

    // Stellar kuralları gereği LP oluşturulurken Varlıklar alfabetik (lexicographic) sıraya göre dizilmelidir.
    // Native (XLM) her zaman ilk sıradadır.
    const assetA = nativeToken;
    const assetB = customToken;

    const server = new Horizon.Server('https://horizon-testnet.stellar.org');

    try {
      this.logger.log('Loading distributor account from Horizon...');
      const distributorAccount = await server.loadAccount(distributorKeys.publicKey());

      const tx = new TransactionBuilder(distributorAccount, {
        fee: '10000',
        networkPassphrase: Networks.TESTNET,
      })
        // ADIM 1: Dağıtıcı, İhraççının tokenına güven limiti (Trustline) açar
        .addOperation(
          Operation.changeTrust({
            asset: customToken,
            limit: '1000000', // max tutabileceği limit
          })
        )
        // ADIM 2: İhraççı, Dağıtıcıya token basar (Minting)
        .addOperation(
          Operation.payment({
            source: issuerKeys.publicKey(),
            destination: distributorKeys.publicKey(),
            asset: customToken,
            amount: params.mintAmount,
          })
        )
        // ADIM 3: Dağıtıcı, Liquidity Pool hissesi (LP Shares) için trustline açar
        .addOperation(
          Operation.changeTrust({
            asset: new LiquidityPoolAsset(assetA, assetB, 30),
          })
        )
        // ADIM 4: Dağıtıcı, cüzdanındaki XLM ve Tokenı LP'ye yatırır
        .addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: getLiquidityPoolId('constant_product', { assetA, assetB, fee: 30 }).toString('hex'),
            maxAmountA: params.depositXlmAmount,
            maxAmountB: params.depositTokenAmount,
            minPrice: '0.01',
            maxPrice: '100.0',
          })
        )
        .setTimeout(180)
        .build();

      this.logger.log('Signing transaction...');
      tx.sign(distributorKeys);
      tx.sign(issuerKeys);

      this.logger.log('Submitting transaction to network...');
      const response = await server.submitTransaction(tx);
      this.logger.log(`Success! Hash: ${response.hash}`);
      
      const poolId = getLiquidityPoolId('constant_product', { assetA: nativeToken, assetB: customToken, fee: 30 }).toString('hex');

      // Log the transaction
      await this.historyService.logTransaction({
        userPublicKey: distributorKeys.publicKey(),
        poolId: poolId,
        type: TransactionType.DEPOSIT,
        assetA: 'XLM',
        amountA: params.depositXlmAmount,
        assetB: params.tokenCode,
        amountB: params.depositTokenAmount,
        tx: response.hash
      });

      return { 
        success: true, 
        hash: response.hash,
        poolId: poolId,
        tokenCode: params.tokenCode
      };
      
    } catch (error) {
      let errorMsg = error.message;
      if (error.response?.data) {
        if (error.response.data.extras?.result_codes) {
          errorMsg = JSON.stringify(error.response.data.extras.result_codes);
        } else {
          errorMsg = JSON.stringify(error.response.data);
        }
      }
      this.logger.error(`Error in automateTokenAndLP: ${errorMsg}`);
      throw new Error(`Transaction failed: ${errorMsg}`);
    }
  }

  async automateCustomTokenLP(params: {
    distributorSecret?: string;
    tokenCode1: string;
    mintAmount1: string;
    depositAmount1: string;
    tokenCode2: string;
    mintAmount2: string;
    depositAmount2: string;
  }) {
    this.logger.log('Starting automated Custom Token-Token Minting and LP Deposit...');

    const issuerSecretStr = process.env.TESTNET_ISSUER_SECRET;
    const distributorSecretStr = params.distributorSecret || process.env.TESTNET_DISTRIBUTOR_SECRET;

    if (!issuerSecretStr || !distributorSecretStr) {
      throw new Error('Issuer and Distributor secrets are required (via DTO or .env)');
    }

    const issuerKeys = Keypair.fromSecret(issuerSecretStr);
    const distributorKeys = Keypair.fromSecret(distributorSecretStr);

    let asset1 = new Asset(params.tokenCode1, issuerKeys.publicKey());
    let asset2 = new Asset(params.tokenCode2, issuerKeys.publicKey());

    // Stellar requires Asset A < Asset B (Lexicographic order)
    let assetA = asset1;
    let assetB = asset2;
    let maxAmountA = params.depositAmount1;
    let maxAmountB = params.depositAmount2;

    if (Asset.compare(asset1, asset2) === 1) {
      assetA = asset2;
      assetB = asset1;
      maxAmountA = params.depositAmount2;
      maxAmountB = params.depositAmount1;
    }

    const server = new Horizon.Server('https://horizon-testnet.stellar.org');

    try {
      this.logger.log('Loading distributor account from Horizon...');
      const distributorAccount = await server.loadAccount(distributorKeys.publicKey());

      const tx = new TransactionBuilder(distributorAccount, {
        fee: '10000',
        networkPassphrase: Networks.TESTNET,
      })
        // Token 1 Trustline
        .addOperation(Operation.changeTrust({ asset: asset1, limit: '1000000' }))
        // Token 2 Trustline
        .addOperation(Operation.changeTrust({ asset: asset2, limit: '1000000' }))
        // Mint Token 1
        .addOperation(Operation.payment({ source: issuerKeys.publicKey(), destination: distributorKeys.publicKey(), asset: asset1, amount: params.mintAmount1 }))
        // Mint Token 2
        .addOperation(Operation.payment({ source: issuerKeys.publicKey(), destination: distributorKeys.publicKey(), asset: asset2, amount: params.mintAmount2 }))
        // LP Trustline
        .addOperation(Operation.changeTrust({ asset: new LiquidityPoolAsset(assetA, assetB, 30) }))
        // LP Deposit
        .addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: getLiquidityPoolId('constant_product', { assetA, assetB, fee: 30 }).toString('hex'),
            maxAmountA: maxAmountA,
            maxAmountB: maxAmountB,
            minPrice: '0.001',
            maxPrice: '1000.0',
          })
        )
        .setTimeout(180)
        .build();

      tx.sign(distributorKeys);
      tx.sign(issuerKeys);

      const response = await server.submitTransaction(tx);
      const poolId = getLiquidityPoolId('constant_product', { assetA, assetB, fee: 30 }).toString('hex');

      // Log the transaction
      await this.historyService.logTransaction({
        userPublicKey: distributorKeys.publicKey(),
        poolId: poolId,
        type: TransactionType.DEPOSIT,
        assetA: params.tokenCode1,
        amountA: params.depositAmount1,
        assetB: params.tokenCode2,
        amountB: params.depositAmount2,
        tx: response.hash
      });

      return { 
        success: true, 
        hash: response.hash,
        poolId: poolId,
        assetACode: assetA.code,
        assetBCode: assetB.code
      };
      
    } catch (error) {
      let errorMsg = error.message;
      if (error.response?.data) {
        if (error.response.data.extras?.result_codes) {
          errorMsg = JSON.stringify(error.response.data.extras.result_codes);
        } else {
          errorMsg = JSON.stringify(error.response.data);
        }
      }
      this.logger.error(`Error in automateCustomTokenLP: ${errorMsg}`);
      throw new Error(`Transaction failed: ${errorMsg}`);
    }
  }

  async mintTokenToWallet(params: {
    tokenCode: string;
    amount: string;
    destination: string;
  }) {
    this.logger.log(`Minting ${params.amount} ${params.tokenCode} to ${params.destination}...`);

    const issuerSecretStr = process.env.TESTNET_ISSUER_SECRET;
    if (!issuerSecretStr) {
      throw new Error('Issuer secret is required (via DTO or .env)');
    }

    const issuerKeys = Keypair.fromSecret(issuerSecretStr);
    const token = new Asset(params.tokenCode, issuerKeys.publicKey());

    const server = new Horizon.Server('https://horizon-testnet.stellar.org');

    try {
      // We load the ISSUER account since it will be the source of the transaction and pay the fee
      const issuerAccount = await server.loadAccount(issuerKeys.publicKey());

      const tx = new TransactionBuilder(issuerAccount, {
        fee: '10000',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: params.destination,
            asset: token,
            amount: params.amount,
          })
        )
        .setTimeout(60)
        .build();

      tx.sign(issuerKeys);

      const response = await server.submitTransaction(tx);

      // Log the transaction
      await this.historyService.logTransaction({
        userPublicKey: params.destination, // Recipient is the destination
        type: TransactionType.MINT,
        assetA: params.tokenCode,
        amountA: params.amount,
        tx: response.hash
      });

      return { 
        success: true, 
        hash: response.hash,
        amount: params.amount,
        tokenCode: params.tokenCode,
        destination: params.destination
      };
      
    } catch (error) {
      let errorMsg = error.message;
      if (error.response?.data) {
        if (error.response.data.extras?.result_codes) {
          errorMsg = JSON.stringify(error.response.data.extras.result_codes);
        } else {
          errorMsg = JSON.stringify(error.response.data);
        }
      }
      this.logger.error(`Error in mintTokenToWallet: ${errorMsg}`);
      throw new Error(`Transaction failed: ${errorMsg}. Make sure the destination wallet has established a trustline for this asset!`);
    }
  }

  async buildTrustTransaction(params: { userPublicKey: string; tokenCode: string }) {
    this.logger.log(`Building trust transaction for ${params.userPublicKey} to trust ${params.tokenCode}...`);

    const issuerSecretStr = process.env.TESTNET_ISSUER_SECRET;
    if (!issuerSecretStr) {
      throw new Error('TESTNET_ISSUER_SECRET is required in .env');
    }

    const issuerKeys = Keypair.fromSecret(issuerSecretStr);
    const token = new Asset(params.tokenCode, issuerKeys.publicKey());
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');

    try {
      // 1. Load the user's account to get their sequence number
      const userAccount = await server.loadAccount(params.userPublicKey);

      // 2. Build the transaction where the user is the source
      const tx = new TransactionBuilder(userAccount, {
        fee: '10000',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.changeTrust({
            asset: token,
            limit: '1000000',
          })
        )
        .setTimeout(180)
        .build();

      // 3. DO NOT sign it. Just convert to XDR string.
      const xdr = tx.toXDR();

      return {
        success: true,
        xdr: xdr,
        tokenCode: params.tokenCode,
        issuerPublicKey: issuerKeys.publicKey(),
        userPublicKey: params.userPublicKey
      };
      
    } catch (error) {
      let errorMsg = error.message;
      if (error.response?.data) {
        if (error.response.data.extras?.result_codes) {
          errorMsg = JSON.stringify(error.response.data.extras.result_codes);
        } else {
          errorMsg = JSON.stringify(error.response.data);
        }
      }
      this.logger.error(`Error in buildTrustTransaction: ${errorMsg}`);
      throw new Error(`Failed to build transaction: ${errorMsg}`);
    }
  }
}
