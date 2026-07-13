import { Injectable, Inject, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigType } from "@nestjs/config";
import { appConfig } from "../../config/app.config";
import { RiskScore } from "./entities/risk-score.entity";
import { TrustScorer } from "./scorers/trust.scorer";
import { TvlScorer } from "./scorers/tvl.scorer";
import { VolatilityScorer } from "./scorers/volatility.scorer";
import { ApyCalculator } from "./scorers/apy.calculator";
import { ScoutService } from "../scout/scout.service";
import { PoolSnapshot } from "../scout/entities/pool-snapshot.entity";
import { RISK_LEVELS } from "../../shared/constants";

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);

  constructor(
    @InjectRepository(RiskScore)
    private readonly riskRepository: Repository<RiskScore>,
    @InjectRepository(PoolSnapshot)
    private readonly snapshotRepository: Repository<PoolSnapshot>,
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
    private readonly scoutService: ScoutService,
    private readonly trustScorer: TrustScorer,
    private readonly tvlScorer: TvlScorer,
    private readonly volatilityScorer: VolatilityScorer,
    private readonly apyCalculator: ApyCalculator,
  ) {}

  async calculatePoolRisk(poolId: string): Promise<RiskScore> {
    const pool = await this.scoutService.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool ${poolId} not found`);
    }

    // Veritabanından en son snapshot'ı doğrudan çek
    const latestSnapshot = await this.snapshotRepository.findOne({
      where: { poolId },
      order: { snapshotAt: "DESC" },
    });

    // Eğer snapshot yoksa, pool reserve'lerinden anlık TVL tahmini yap
    // (Dummy fiyat: henüz gerçek oracle yok, ama en azından 0'dan büyük bir değer üretir)
    let tvlUsd: number;
    let volume24hUsd: number;

    if (latestSnapshot?.tvlUsd) {
      tvlUsd = parseFloat(latestSnapshot.tvlUsd);
      volume24hUsd = latestSnapshot.volume24hUsd
        ? parseFloat(latestSnapshot.volume24hUsd)
        : 0;
    } else {
      // Snapshot yoksa reserve'lerden kaba tahmin (1 birim = 0.1 USD placeholder)
      const reserveA = parseFloat(pool.reserveA) || 0;
      const reserveB = parseFloat(pool.reserveB) || 0;
      tvlUsd = (reserveA + reserveB) * 0.1;
      volume24hUsd = 0;
      //this.logger.debug(`No snapshot for pool ${poolId}, estimated TVL from reserves: $${tvlUsd.toFixed(2)}`);
    }

    const trustScore = await this.trustScorer.score(pool);
    const tvlScore = this.tvlScorer.score(tvlUsd);
    const volatilityScore = await this.volatilityScorer.score(poolId);
    const { apy, score: apyScore } = this.apyCalculator.calculate(
      volume24hUsd,
      tvlUsd,
    );

    const weights = this.config.riskWeights;
    const compositeScore =
      trustScore * weights.trust +
      tvlScore * weights.tvl +
      volatilityScore * weights.volatility +
      apyScore * weights.apy;

    let riskLevel = RISK_LEVELS.MEDIUM;
    if (compositeScore >= 67) riskLevel = RISK_LEVELS.LOW;
    else if (compositeScore <= 33 || tvlScore <= 10)
      riskLevel = RISK_LEVELS.HIGH; // Force high risk if very low TVL

    let riskRecord = await this.riskRepository.findOne({ where: { poolId } });
    if (!riskRecord) {
      riskRecord = this.riskRepository.create({ poolId, pool });
    }

    riskRecord.trustScore = trustScore;
    riskRecord.tvlScore = tvlScore;
    riskRecord.volatilityScore = volatilityScore;
    riskRecord.apyScore = apyScore;
    riskRecord.compositeScore = compositeScore;
    riskRecord.riskLevel = riskLevel;
    riskRecord.estimatedApy = apy;
    riskRecord.calculatedAt = new Date();

    return this.riskRepository.save(riskRecord);
  }

  async getRiskByPoolId(poolId: string): Promise<RiskScore | null> {
    return this.riskRepository.findOne({ where: { poolId } });
  }

  async getPoolsByRiskLevel(
    level: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.riskRepository.findAndCount({
      where: { riskLevel: level.toUpperCase() },
      relations: ["pool"],
      skip,
      take: limit,
      order: { compositeScore: "DESC" }, // En güvenliden en riskliye doğru
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
