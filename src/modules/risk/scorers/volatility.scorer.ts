import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PoolSnapshot } from "../../scout/entities/pool-snapshot.entity";

@Injectable()
export class VolatilityScorer {
  constructor(
    @InjectRepository(PoolSnapshot)
    private readonly snapshotRepository: Repository<PoolSnapshot>,
  ) {}

  async score(poolId: string): Promise<number> {
    const snapshots = await this.snapshotRepository.find({
      where: { poolId },
      order: { snapshotAt: "DESC" },
      take: 7, // Last 7 days
    });

    if (snapshots.length < 2) {
      return 50; // Not enough data, default to medium risk
    }

    const priceRatios: number[] = [];
    for (const s of snapshots) {
      if (s.priceAUsd && s.priceBUsd && parseFloat(s.priceAUsd) > 0) {
        priceRatios.push(parseFloat(s.priceBUsd) / parseFloat(s.priceAUsd));
      }
    }

    if (priceRatios.length < 2) return 50;

    // Calculate daily returns standard deviation
    const returns: number[] = [];
    for (let i = 0; i < priceRatios.length - 1; i++) {
      const dailyReturn =
        (priceRatios[i] - priceRatios[i + 1]) / priceRatios[i + 1];
      returns.push(dailyReturn);
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 0.01) return 95;
    if (stdDev < 0.03) return 70;
    if (stdDev < 0.07) return 45;

    return 15;
  }

  // Not directly used for scoring here, but part of the IL concept
  calculateImpermanentLoss(priceRatio: number): number {
    if (priceRatio <= 0) return 0;
    return (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1;
  }
}
