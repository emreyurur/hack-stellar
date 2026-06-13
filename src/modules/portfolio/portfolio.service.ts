import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPosition } from './entities/user-position.entity';
import { PnlCalculator } from './pnl.calculator';
import { PortfolioResponseDto } from './dto/portfolio-response.dto';
import { ScoutService } from '../scout/scout.service';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(UserPosition)
    private readonly positionRepository: Repository<UserPosition>,
    private readonly pnlCalculator: PnlCalculator,
    private readonly scoutService: ScoutService,
  ) {}

  async getPortfolio(publicKey: string): Promise<PortfolioResponseDto> {
    const positions = await this.positionRepository.find({
      where: { userPublicKey: publicKey },
      relations: ['pool'],
    });

    let totalValueUsd = 0;
    let totalPnlUsd = 0;

    const positionDtos = [];

    for (const position of positions) {
      const pool = await this.scoutService.getPool(position.poolId);
      if (!pool) continue;

      const metrics = this.pnlCalculator.calculatePositionMetrics(position, pool);

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

  // Frontend'den başarılı işlem sonrasında webhook/callback geldiğinde veya
  // Horizon üzerinden adresin geçmiş işlemleri tarandığında çağrılır
  async syncPosition(publicKey: string, poolId: string, sharesAmount: string, assetAAmount: string, assetBAmount: string) {
    let position = await this.positionRepository.findOne({
      where: { userPublicKey: publicKey, poolId }
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
      position.sharesOwned = (parseFloat(position.sharesOwned) + parseFloat(sharesAmount)).toString();
      position.assetADeposited = (parseFloat(position.assetADeposited) + parseFloat(assetAAmount)).toString();
      position.assetBDeposited = (parseFloat(position.assetBDeposited) + parseFloat(assetBAmount)).toString();
      position.lastUpdatedAt = new Date();
    }

    await this.positionRepository.save(position);
  }
}
