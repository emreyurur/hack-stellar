import { Injectable, Inject } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { appConfig } from "../../../config/app.config";

@Injectable()
export class TvlScorer {
  constructor(
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  score(tvlUsd: number): number {
    if (tvlUsd >= 1_000_000) return 100;
    if (tvlUsd >= 500_000) return 80;
    if (tvlUsd >= 100_000) return 60;
    if (tvlUsd >= this.config.minTvlUsd) return 40;

    return 10; // "HIGH RISK" for extremely low liquidity
  }
}
