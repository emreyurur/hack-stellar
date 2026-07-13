import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LiquidityPool } from "./entities/liquidity-pool.entity";
import { PoolSnapshot } from "./entities/pool-snapshot.entity";
import { HorizonClient } from "./horizon/horizon.client";
import { HorizonPoolResponse } from "./horizon/horizon.types";
import { RedisService } from "../../core/redis/redis.service";
import { PricingService } from "./pricing.service";
import { CACHE_KEYS } from "../../shared/constants";
import { Keypair, Horizon, Networks, Asset, TransactionBuilder, Operation, LiquidityPoolAsset, getLiquidityPoolId } from '@stellar/stellar-sdk';

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
    this.logger.log("Starting liquidity pools sync...");
    const pools = await this.horizonClient.fetchAllPools();
    this.logger.log(`Fetched ${pools.length} pools from Horizon`);

    const activePoolIds = new Set<string>();

    for (const poolData of pools) {
      activePoolIds.add(poolData.id);
      await this.upsertPool(poolData);
    }

    // Olmayan poolları isActive = false yap
    if (activePoolIds.size > 0) {
      await this.poolRepository
        .createQueryBuilder()
        .update(LiquidityPool)
        .set({ isActive: false })
        .where("id NOT IN (:...ids)", { ids: Array.from(activePoolIds) })
        .execute();
    }
    this.logger.log("Liquidity pools sync completed.");
  }

  private async upsertPool(data: HorizonPoolResponse) {
    const parseAsset = (assetString: string) => {
      if (assetString === "native") {
        return { code: "XLM", issuer: null };
      }
      const [code, issuer] = assetString.split(":");
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
    await this.redisService.set(
      `${CACHE_KEYS.POOL_PREFIX}${pool.id}`,
      pool,
      300,
    ); // 5dk cache
  }

  async takeDailySnapshots() {
    this.logger.log("Starting daily snapshots...");
    const activePools = await this.poolRepository.find({
      where: { isActive: true },
    });

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
        const priceAUsd = await this.pricingService.getAssetUsdPrice(
          pool.assetACode,
          pool.assetAIssuer,
        );
        const priceBUsd = await this.pricingService.getAssetUsdPrice(
          pool.assetBCode,
          pool.assetBIssuer,
        );

        const tvlUsd =
          parseFloat(pool.reserveA) * priceAUsd +
          parseFloat(pool.reserveB) * priceBUsd;
        const volume24hUsd = volumeA * priceAUsd + volumeB * priceBUsd; // Hacim de gerçek fiyattan hesaplanır

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

        // Rate limit'i aşmamak için her havuz arasında 1 saniye bekle
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        this.logger.error(
          `Error taking snapshot for pool ${pool.id}: ${e.message}`,
        );
      }
    }
    this.logger.log("Daily snapshots completed.");
  }

  async getPools(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.poolRepository.findAndCount({
      where: { isActive: true },
      skip,
      take: limit,
      order: { totalTrustlines: "DESC" }, // Daha çok kullanılan havuzlar üstte
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

  async getPoolDashboard(poolId: string) {
    const pool = await this.getPool(poolId);
    if (!pool) return null;

    // Son 90 günün snapshotlarını çek
    const snapshots = await this.snapshotRepository.find({
      where: { poolId },
      order: { snapshotAt: "ASC" },
      take: 90,
    });

    let profile = "Balanced";
    try {
      const riskScore = await this.poolRepository.manager.query(
        `SELECT risk_level FROM risk_scores WHERE pool_id = $1 ORDER BY calculated_at DESC LIMIT 1`,
        [poolId],
      );
      if (riskScore && riskScore.length > 0) {
        profile = riskScore[0].risk_level;
      }
    } catch (e) {
      // Ignore if table doesn't exist or error
    }

    let totalSupplied = 0;
    let utilization = 0;
    let supplyApy = 0;
    let avg90dApy = 0;
    const chartData = [];

    let sumApy = 0;

    if (snapshots.length > 0) {
      const latest = snapshots[snapshots.length - 1];
      totalSupplied = parseFloat(latest.tvlUsd || "0");

      const vol24h = parseFloat(latest.volume24hUsd || "0");
      utilization = totalSupplied > 0 ? (vol24h / totalSupplied) * 100 : 0;

      // APY = (Volume * Fee * 365) / TVL
      supplyApy =
        totalSupplied > 0
          ? ((vol24h * (pool.feeBp / 10000) * 365) / totalSupplied) * 100
          : 0;

      for (const s of snapshots) {
        const t = parseFloat(s.tvlUsd || "0");
        const v = parseFloat(s.volume24hUsd || "0");
        const apy = t > 0 ? ((v * (pool.feeBp / 10000) * 365) / t) * 100 : 0;
        sumApy += apy;

        chartData.push({
          timestamp: s.snapshotAt,
          supplyApy: apy,
          totalSupply: t,
        });
      }

      avg90dApy = sumApy / snapshots.length;
    }

    const assetName = `${pool.assetACode}-${pool.assetBCode} Prime`;

    return {
      vaultOverview: {
        totalSupplied: totalSupplied,
        totalBorrowed: 0, // Placeholder
        utilization: utilization,
        supplyApy: supplyApy,
        supplyApy90dAvg: avg90dApy,
      },
      strategyOverview: {
        name: assetName,
        profile: profile,
        description: `${assetName} is a liquidity provisioning strategy designed to enable superior risk-adjusted yields via allocation into highly liquid Stellar AMM markets.`,
      },
      chartData: chartData,
    };
  }

  async automateTokenAndLP(params: {
    issuerSecret?: string;
    distributorSecret?: string;
    tokenCode: string;
    mintAmount: string;
    depositXlmAmount: string;
    depositTokenAmount: string;
  }) {
    this.logger.log('Starting automated Token Minting and LP Deposit...');

    // 1. Anahtarları belirle
    const issuerSecretStr = params.issuerSecret || process.env.TESTNET_ISSUER_SECRET;
    const distributorSecretStr = params.distributorSecret || process.env.TESTNET_DISTRIBUTOR_SECRET;

    if (!issuerSecretStr || !distributorSecretStr) {
      throw new Error('Issuer and Distributor secrets are required (via DTO or .env)');
    }

    const issuerKeys = Keypair.fromSecret(issuerSecretStr);
    const distributorKeys = Keypair.fromSecret(distributorSecretStr);

    // 2. Tokenları Tanımla
    const customToken = new Asset(params.tokenCode, issuerKeys.publicKey());
    const nativeToken = Asset.native(); // XLM

    // TODO: Ideally use a shared server instance from HorizonClient, but keeping it explicit for this testnet automation script
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');

    try {
      this.logger.log('Loading distributor account from Horizon...');
      const distributorAccount = await server.loadAccount(distributorKeys.publicKey());

      this.logger.log('Building transaction envelope...');
      
      const tx = new TransactionBuilder(distributorAccount, {
        fee: '10000',
        networkPassphrase: Networks.TESTNET,
      })
        // ADIM 1: Dağıtıcı, İhraççının tokenına güven limiti (Trustline) açar
        .addOperation(
          Operation.changeTrust({
            asset: customToken,
            limit: '1000000',
          })
        )
        // ADIM 2: İhraççı, Dağıtıcıya token basar
        .addOperation(
          Operation.payment({
            source: issuerKeys.publicKey(),
            destination: distributorKeys.publicKey(),
            asset: customToken,
            amount: params.mintAmount,
          })
        )
        // ADIM 3: Havuz Hisseleri (Pool Shares) için Güven Limiti açılır
        .addOperation(
          Operation.changeTrust({
            asset: new LiquidityPoolAsset(nativeToken, customToken, 30),
          })
        )
        // ADIM 4: Havuza Likidite Eklenir
        .addOperation(
          Operation.liquidityPoolDeposit({
            liquidityPoolId: getLiquidityPoolId('constant_product', { assetA: nativeToken, assetB: customToken, fee: 30 }).toString('hex'),
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
}
