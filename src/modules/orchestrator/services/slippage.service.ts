import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { appConfig } from "../../../config/app.config";

@Injectable()
export class SlippageService {
  constructor(
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  calculateMinAmounts(
    expectedA: number,
    expectedB: number,
    requestedSlippageBps?: number,
  ): { minA: number; minB: number } {
    const slippageBps = requestedSlippageBps || this.config.defaultSlippageBps;

    if (slippageBps > this.config.maxSlippageBps) {
      throw new BadRequestException(
        `Slippage cannot exceed ${this.config.maxSlippageBps} bps`,
      );
    }

    const slippageFactor = 1 - slippageBps / 10000;

    return {
      minA: expectedA * slippageFactor,
      minB: expectedB * slippageFactor,
    };
  }
}
