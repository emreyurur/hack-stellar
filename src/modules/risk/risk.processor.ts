import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RiskService } from './risk.service';
import { ScoutService } from '../scout/scout.service';

@Processor('risk')
export class RiskProcessor extends WorkerHost {
  private readonly logger = new Logger(RiskProcessor.name);

  constructor(
    private readonly riskService: RiskService,
    private readonly scoutService: ScoutService,
  ) {
    super();
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Processing risk job ${job.name}...`);
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'calculate-risks') {
      let page = 1;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const result = await this.scoutService.getPools(page, limit);
        
        for (const pool of result.data) {
          try {
            await this.riskService.calculatePoolRisk(pool.id);
          } catch (e) {
            this.logger.error(`Error calculating risk for pool ${pool.id}: ${e.message}`);
          }
        }
        
        page++;
        hasMore = page <= result.totalPages;
      }
    }
  }
}
