import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TransactionHistory, TransactionType } from './entities/transaction-history.entity';
import { PoolIndexerState } from './entities/pool-indexer-state.entity';
import * as StellarSdk from '@stellar/stellar-sdk';
import { Inject } from '@nestjs/common';
import { appConfig } from '../../config/app.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @InjectRepository(TransactionHistory)
    private readonly historyRepository: Repository<TransactionHistory>,
    @InjectRepository(PoolIndexerState)
    private readonly indexerStateRepository: Repository<PoolIndexerState>,
    private readonly dataSource: DataSource,
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  async logTransaction(params: {
    userPublicKey: string;
    poolId?: string;
    type: TransactionType;
    assetA: string;
    amountA: string;
    assetB?: string;
    amountB?: string;
    tx?: string;
  }) {
    try {
      const history = this.historyRepository.create(params);
      await this.historyRepository.save(history);
      this.logger.log(`Logged ${params.type} for ${params.userPublicKey} tx: ${params.tx}`);
    } catch (error) {
      this.logger.error(`Failed to log transaction: ${error.message}`);
    }
  }

  async getUserHistory(publicKey: string, limit = 50, page = 1) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.historyRepository.findAndCount({
      where: { userPublicKey: publicKey },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit)
    };
  }

  async getUserHistoryByPool(publicKey: string, poolId: string, limit = 50, page = 1) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.historyRepository.findAndCount({
      where: { userPublicKey: publicKey, poolId: poolId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit)
    };
  }

  async syncTransactions() {
    this.logger.log('Starting historical transaction sync...');
    
    // Fetch top 50 pools + pools that active users have interacted with
    const poolsToSyncResult = await this.dataSource.query(`
      SELECT id FROM (
        SELECT id FROM liquidity_pool ORDER BY "tvlUsd" DESC LIMIT 50
        UNION
        SELECT "poolId" as id FROM user_position
        UNION
        SELECT "poolId" as id FROM transaction_history WHERE "poolId" IS NOT NULL
      ) as combined
    `);

    const targetPoolIds: string[] = poolsToSyncResult.map((p: any) => p.id);
    this.logger.log(`Found ${targetPoolIds.length} target pools to index.`);

    const server = new StellarSdk.Horizon.Server(this.config.horizonUrl);

    for (const poolId of targetPoolIds) {
      try {
        let state = await this.indexerStateRepository.findOne({ where: { poolId } });
        if (!state) {
          state = this.indexerStateRepository.create({ poolId, lastPagingToken: '0' });
        }

        // Fetch operations for this pool
        const response = await server.operations()
          .forLiquidityPool(poolId)
          .cursor(state.lastPagingToken)
          .limit(200)
          .order('asc')
          .call();

        const records = response.records;
        if (records.length === 0) continue;

        let addedCount = 0;

        for (const op of records) {
          let txType: TransactionType;
          let assetA = '';
          let amountA = '';
          let assetB = '';
          let amountB = '';
          
          if (op.type === 'liquidity_pool_deposit') {
            txType = TransactionType.DEPOSIT;
            // op.reserves_max is an array of reserves used.
            const depOp = op as any;
            if (depOp.reserves_max && depOp.reserves_max.length === 2) {
              assetA = depOp.reserves_max[0].asset || 'XLM';
              amountA = depOp.reserves_max[0].amount;
              assetB = depOp.reserves_max[1].asset || 'XLM';
              amountB = depOp.reserves_max[1].amount;
            }
          } else if (op.type === 'liquidity_pool_withdraw') {
            txType = TransactionType.WITHDRAW;
            const witOp = op as any;
            if (witOp.reserves_min && witOp.reserves_min.length === 2) {
              assetA = witOp.reserves_min[0].asset || 'XLM';
              amountA = witOp.reserves_min[0].amount;
              assetB = witOp.reserves_min[1].asset || 'XLM';
              amountB = witOp.reserves_min[1].amount;
            }
          } else if (op.type === 'path_payment_strict_send' || op.type === 'path_payment_strict_receive') {
            txType = TransactionType.SWAP;
            const swapOp = op as any;
            assetA = swapOp.source_asset_type === 'native' ? 'XLM' : swapOp.source_asset_code;
            amountA = swapOp.source_amount;
            assetB = swapOp.asset_type === 'native' ? 'XLM' : swapOp.asset_code;
            amountB = swapOp.amount;
          } else {
            // Ignore other operations on the LP for now
            state.lastPagingToken = op.paging_token;
            continue;
          }

          // Parse assets strings
          if (assetA && assetA.includes(':')) assetA = assetA.split(':')[0];
          if (assetB && assetB.includes(':')) assetB = assetB.split(':')[0];

          await this.logTransaction({
            userPublicKey: op.source_account,
            poolId: poolId,
            type: txType,
            assetA: assetA || 'Unknown',
            amountA: amountA || '0',
            assetB: assetB,
            amountB: amountB,
            tx: op.transaction_hash,
          });

          addedCount++;
          state.lastPagingToken = op.paging_token;
        }

        await this.indexerStateRepository.save(state);
        if (addedCount > 0) {
          this.logger.debug(`Indexed ${addedCount} operations for pool ${poolId}`);
        }
      } catch (err) {
        this.logger.error(`Error syncing pool ${poolId}: ${err.message}`);
      }
    }
    
    this.logger.log('Historical transaction sync completed.');
  }

  async calculateUserCostBasis(publicKey: string, poolId: string): Promise<{ assetADeposited: string; assetBDeposited: string }> {
    const history = await this.historyRepository.find({
      where: { userPublicKey: publicKey, poolId },
      order: { createdAt: 'ASC' }
    });

    let assetADeposited = 0;
    let assetBDeposited = 0;

    for (const tx of history) {
      if (tx.type === TransactionType.DEPOSIT) {
        assetADeposited += parseFloat(tx.amountA || '0');
        assetBDeposited += parseFloat(tx.amountB || '0');
      } else if (tx.type === TransactionType.WITHDRAW) {
        assetADeposited -= parseFloat(tx.amountA || '0');
        assetBDeposited -= parseFloat(tx.amountB || '0');
      }
    }

    // Ensure it doesn't go below zero due to rounding or missing history
    return {
      assetADeposited: Math.max(0, assetADeposited).toString(),
      assetBDeposited: Math.max(0, assetBDeposited).toString(),
    };
  }
}
