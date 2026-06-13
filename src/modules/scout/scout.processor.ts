import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ScoutService } from './scout.service';

@Processor('scout')
export class ScoutProcessor extends WorkerHost {
  private readonly logger = new Logger(ScoutProcessor.name);

  constructor(private readonly scoutService: ScoutService) {
    super();
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Processing job ${job.name} (id: ${job.id})...`);
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'sync-pools':
        return this.scoutService.syncLiquidityPools();
      case 'daily-snapshot':
        return this.scoutService.takeDailySnapshots();
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
