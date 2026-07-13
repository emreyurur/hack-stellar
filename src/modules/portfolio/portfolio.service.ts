import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserPosition } from "./entities/user-position.entity";
import { PnlCalculator } from "./pnl.calculator";
import { PortfolioResponseDto } from "./dto/portfolio-response.dto";
import { ScoutService } from "../scout/scout.service";
import { HorizonClient } from "../scout/horizon/horizon.client";
import { Logger } from "@nestjs/common";

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(
    @InjectRepository(UserPosition)
    private readonly positionRepository: Repository<UserPosition>,
    private readonly pnlCalculator: PnlCalculator,
    private readonly scoutService: ScoutService,
    private readonly horizonClient: HorizonClient,
  ) {}

  async getPortfolio(publicKey: string): Promise<PortfolioResponseDto> {
    await this.syncBlockchainBalances(publicKey);

    const positions = await this.positionRepository.find({
      where: { userPublicKey: publicKey },
      relations: ["pool"],
    });

    let totalValueUsd = 0;
    let totalPnlUsd = 0;

    const positionDtos = [];

    for (const position of positions) {
      const pool = await this.scoutService.getPool(position.poolId);
      if (!pool) continue;

      const metrics = this.pnlCalculator.calculatePositionMetrics(
        position,
        pool,
      );

      totalValueUsd += metrics.currentValueUsd;
      totalPnlUsd += metrics.pnlUsd;

      positionDtos.push({
        poolId: position.poolId,
        sharesOwned: position.sharesOwned,
        currentValueUsd: metrics.currentValueUsd,
        impermanentLossPct: metrics.impermanentLossPct,
        pnlUsd: metrics.pnlUsd,
      });
    }

    return {
      userPublicKey: publicKey,
      totalValueUsd,
      totalPnlUsd,
      positions: positionDtos,
    };
  }

  private async syncBlockchainBalances(publicKey: string) {
    try {
      const account = await this.horizonClient.fetchAccount(publicKey);
      if (!account || !account.balances) return;

      const lpBalances = account.balances.filter(b => b.asset_type === 'liquidity_pool_shares' && b.liquidity_pool_id);
      
      const dbPositions = await this.positionRepository.find({ where: { userPublicKey: publicKey } });

      // Update existing positions
      for (const pos of dbPositions) {
        const onChainMatch = lpBalances.find(b => b.liquidity_pool_id === pos.poolId);
        const actualShares = onChainMatch ? onChainMatch.balance : "0";
        if (pos.sharesOwned !== actualShares) {
          pos.sharesOwned = actualShares;
          await this.positionRepository.save(pos);
        }
      }

      // Create missing positions if they have balances and the pool exists in our scout db
      for (const onChain of lpBalances) {
        const existsInDb = dbPositions.find(p => p.poolId === onChain.liquidity_pool_id);
        if (!existsInDb) {
          const poolExists = await this.scoutService.getPool(onChain.liquidity_pool_id!);
          if (poolExists) {
            const newPos = this.positionRepository.create({
              userPublicKey: publicKey,
              poolId: onChain.liquidity_pool_id!,
              sharesOwned: onChain.balance,
              assetADeposited: "0",
              assetBDeposited: "0",
            });
            await this.positionRepository.save(newPos);
          }
        }
      }
    } catch (e) {
      this.logger.warn(`Failed to sync blockchain balances for ${publicKey}: ${e.message}`);
    }
  }

  // Frontend'den başarılı işlem sonrasında webhook/callback geldiğinde veya
  // Horizon üzerinden adresin geçmiş işlemleri tarandığında çağrılır
  async syncPosition(
    publicKey: string,
    poolId: string,
    sharesAmount: string,
    assetAAmount: string,
    assetBAmount: string,
  ) {
    let position = await this.positionRepository.findOne({
      where: { userPublicKey: publicKey, poolId },
    });

    if (!position) {
      position = this.positionRepository.create({
        userPublicKey: publicKey,
        poolId,
        sharesOwned: sharesAmount,
        assetADeposited: assetAAmount,
        assetBDeposited: assetBAmount,
        firstDepositAt: new Date(),
        lastUpdatedAt: new Date(),
      });
    } else {
      // Eğer mevcutsa üzerine ekleniyor (basit logic, gerçekte average cost basis hesabı gerekir)
      position.sharesOwned = (
        parseFloat(position.sharesOwned) + parseFloat(sharesAmount)
      ).toString();
      position.assetADeposited = (
        parseFloat(position.assetADeposited) + parseFloat(assetAAmount)
      ).toString();
      position.assetBDeposited = (
        parseFloat(position.assetBDeposited) + parseFloat(assetBAmount)
      ).toString();
      position.lastUpdatedAt = new Date();
    }

    await this.positionRepository.save(position);
  }

  async getLendingDashboard(publicKey: string) {
    // 1. Calculate Global Market Size (Total TVL across all pools in the system)
    const allPools = await this.scoutService.getPools(1, 1000);
    let marketSizeUsd = 0;

    // Instead of querying all pools via scoutService if it's heavy, we can do a rough estimate or
    // fetch snapshot TVLs. Let's assume we can fetch them.
    for (const pool of allPools.data || []) {
      // Very basic TVL estimation if we don't have snapshots loaded here
      const reserveA = parseFloat(pool.reserveA) || 0;
      const reserveB = parseFloat(pool.reserveB) || 0;
      marketSizeUsd += (reserveA + reserveB) * 0.1; // Using the same dummy pricing logic as risk service for now
    }

    await this.syncBlockchainBalances(publicKey);

    // 2. Fetch User Positions
    const positions = await this.positionRepository.find({
      where: { userPublicKey: publicKey },
      relations: ["pool"],
    });

    let vaultDepositsUsd = 0; // User's total value
    let totalPnlUsd = 0;
    const assets = [];

    for (const position of positions) {
      const pool = await this.scoutService.getPool(position.poolId);
      if (!pool) continue;

      const metrics = this.pnlCalculator.calculatePositionMetrics(
        position,
        pool,
      );

      vaultDepositsUsd += metrics.currentValueUsd;
      totalPnlUsd += metrics.pnlUsd;

      // In Option 1, we map AMM data to Lending UI fields
      assets.push({
        poolId: position.poolId,
        assetName: `${pool.assetACode}-${pool.assetBCode} LP`,
        positionValueUsd: metrics.currentValueUsd,
        supplyApy: metrics.impermanentLossPct, // Showing IL% as the "APY" stat for the UI
        interestEarnedUsd: metrics.pnlUsd, // Showing PnL as "Interest Earned"
        vaultProfile: "Dynamic", // We can fetch from RiskService in a full implementation
      });
    }

    return {
      globalStats: {
        marketSizeUsd,
        vaultDepositsUsd, // For this specific user, the "Vault Deposits" is their portfolio value
      },
      userOverview: {
        activePositions: positions.length,
        positionsValueUsd: vaultDepositsUsd,
        avgApy:
          assets.length > 0
            ? assets.reduce((acc, curr) => acc + curr.supplyApy, 0) /
              assets.length
            : 0,
        interestEarnedUsd: totalPnlUsd,
      },
      assets,
    };
  }
}
