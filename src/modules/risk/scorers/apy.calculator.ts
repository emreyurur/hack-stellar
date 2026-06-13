import { Injectable } from '@nestjs/common';

@Injectable()
export class ApyCalculator {
  calculate(volume24hUsd: number, tvlUsd: number): { apy: number; score: number } {
    if (tvlUsd <= 0) return { apy: 0, score: 0 };

    const dailyFeeIncome = volume24hUsd * 0.003; // 0.3% fee
    const dailyYield = dailyFeeIncome / tvlUsd;
    
    // (1 + dailyYield)^365 - 1
    const apy = Math.pow(1 + dailyYield, 365) - 1;

    let score = 0;
    if (apy >= 0.20) score = 100;
    else if (apy >= 0.10) score = 75;
    else if (apy >= 0.05) score = 50;
    else score = 25;

    return { apy, score };
  }
}
