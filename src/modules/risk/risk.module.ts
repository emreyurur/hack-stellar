import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RiskScore } from './entities/risk-score.entity';
import { RiskService } from './risk.service';
import { RiskProcessor } from './risk.processor';
import { RiskController } from './risk.controller';
import { TrustScorer } from './scorers/trust.scorer';
import { TvlScorer } from './scorers/tvl.scorer';
import { VolatilityScorer } from './scorers/volatility.scorer';
import { ApyCalculator } from './scorers/apy.calculator';
import { ScoutModule } from '../scout/scout.module';
import { PoolSnapshot } from '../scout/entities/pool-snapshot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RiskScore, PoolSnapshot]),
    BullModule.registerQueue({
      name: 'risk',
    }),
    ScoutModule,
  ],
  controllers: [RiskController],
  providers: [
    RiskService,
    RiskProcessor,
    TrustScorer,
    TvlScorer,
    VolatilityScorer,
    ApyCalculator,
  ],
  exports: [RiskService],
})
export class RiskModule implements OnModuleInit {
  constructor(@InjectQueue('risk') private readonly riskQueue: Queue) {}

  async onModuleInit() {
    // Her 15 dakikada bir risk hesaplama job'ı (Scout sync'ten sonra çalışması ideal)
    await this.riskQueue.add('calculate-risks', {}, {
      repeat: { every: 900_000 },
    });
  }
}
