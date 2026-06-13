import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiquidityPool } from './entities/liquidity-pool.entity';
import { PoolSnapshot } from './entities/pool-snapshot.entity';
import { HorizonClient } from './horizon/horizon.client';
import { HorizonPoolResponse } from './horizon/horizon.types';
import { RedisService } from '../../core/redis/redis.service';
import { PricingService } from './pricing.service';
import { CACHE_KEYS } from '../../shared/constants';

@Injectable()
export class ScoutService {
  private readonly logger = new Logger(ScoutService.name);

  constructor(
    @InjectRepository(LiquidityPool)
    private readonly poolRepository: Repository<LiquidityPool>,
    @InjectRepository(PoolSnapshot)
    private readonly snapshotRepository: Repository<PoolSnapshot>,
    private readonly horizonClient: HorizonClient,
    private readonly redisService: RedisService,
    private readonly pricingService: PricingService,
  ) {}

  async syncLiquidityPools() {
    this.logger.log('Starting liquidity pools sync...');
    const pools = await this.horizonClient.fetchAllPools();
    this.logger.log(`Fetched ${pools.length} pools from Horizon`);

    const activePoolIds = new Set<string>();

    for (const poolData of pools) {
      activePoolIds.add(poolData.id);
      await this.upsertPool(poolData);
    }

    // Olmayan poolları isActive = false yap
    if (activePoolIds.size > 0) {
      await this.poolRepository.createQueryBuilder()
        .update(LiquidityPool)
        .set({ isActive: false })
        .where('id NOT IN (:...ids)', { ids: Array.from(activePoolIds) })
        .execute();
    }
    this.logger.log('Liquidity pools sync completed.');
  }

  private async upsertPool(data: HorizonPoolResponse) {
    const parseAsset = (assetString: string) => {
      if (assetString === 'native') {
        return { code: 'XLM', issuer: null };
      }
      const [code, issuer] = assetString.split(':');
      return { code, issuer };
    };

    const assetA = parseAsset(data.reserves[0].asset);
    const assetB = parseAsset(data.reserves[1].asset);

    let pool = await this.poolRepository.findOne({ where: { id: data.id } });
    if (!pool) {
      pool = this.poolRepository.create({ id: data.id });
    }

    pool.feeBp = data.fee_bp;
    pool.type = data.type;
    pool.totalShares = data.total_shares;
    pool.assetACode = assetA.code;
    pool.assetAIssuer = assetA.issuer;
    pool.reserveA = data.reserves[0].amount;
    pool.assetBCode = assetB.code;
    pool.assetBIssuer = assetB.issuer;
    pool.reserveB = data.reserves[1].amount;
    pool.totalTrustlines = data.total_trustlines;
    pool.lastSyncedAt = new Date();
    pool.isActive = true;

    await this.poolRepository.save(pool);
    await this.redisService.set(`${CACHE_KEYS.POOL_PREFIX}${pool.id}`, pool, 300); // 5dk cache
  }

  async takeDailySnapshots() {
    this.logger.log('Starting daily snapshots...');
    const activePools = await this.poolRepository.find({ where: { isActive: true } });

    for (const pool of activePools) {
      try {
        const trades = await this.horizonClient.fetchPoolTrades(pool.id, 24);
        
        let volumeA = 0;
        let volumeB = 0;

        for (const trade of trades) {
          // Basit hacim hesabı
          // XLM varsa fiyatlandırma daha kolay, yoksa şimdilik sadece base hacmi tutuyoruz
          // Gerçek VWAP uygulaması fiyat çaprazlaması gerektirir. Şimdilik pool içi işlem hacmi.
          if (trade.base_asset_code === pool.assetACode) {
            volumeA += parseFloat(trade.base_amount);
            volumeB += parseFloat(trade.counter_amount);
          } else {
            volumeA += parseFloat(trade.counter_amount);
            volumeB += parseFloat(trade.base_amount);
          }
        }

        // PricingService kullanarak gerçek USD fiyatlarını çekiyoruz
        const priceAUsd = await this.pricingService.getAssetUsdPrice(pool.assetACode, pool.assetAIssuer);
        const priceBUsd = await this.pricingService.getAssetUsdPrice(pool.assetBCode, pool.assetBIssuer);
        
        const tvlUsd = (parseFloat(pool.reserveA) * priceAUsd) + (parseFloat(pool.reserveB) * priceBUsd);
        const volume24hUsd = (volumeA * priceAUsd) + (volumeB * priceBUsd); // Hacim de gerçek fiyattan hesaplanır
        
        // Sadece Düşük Hacimli pool filtrelemesine takılmayanlar (Örn: TVL/Hacim çok düşükse skip)
        // Burada basitçe snapshot alıyoruz.
        const snapshot = this.snapshotRepository.create({
          pool,
          poolId: pool.id,
          reserveA: pool.reserveA,
          reserveB: pool.reserveB,
          totalShares: pool.totalShares,
          priceAUsd: priceAUsd.toString(),
          priceBUsd: priceBUsd.toString(),
          tvlUsd: tvlUsd.toString(),
          volume24hUsd: volume24hUsd.toString(),
          snapshotAt: new Date(),
        });
        await this.snapshotRepository.save(snapshot);
      } catch (e) {
        this.logger.error(`Error taking snapshot for pool ${pool.id}: ${e.message}`);
      }
    }
    this.logger.log('Daily snapshots completed.');
  }

  async getPools(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.poolRepository.findAndCount({
      where: { isActive: true },
      skip,
      take: limit,
      order: { totalTrustlines: 'DESC' }, // Daha çok kullanılan havuzlar üstte
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPool(id: string) {
    return this.poolRepository.findOne({ where: { id } });
  }
}
