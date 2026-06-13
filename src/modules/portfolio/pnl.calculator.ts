import { Injectable } from '@nestjs/common';
import { UserPosition } from './entities/user-position.entity';
import { LiquidityPool } from '../scout/entities/liquidity-pool.entity';

@Injectable()
export class PnlCalculator {
  calculatePositionMetrics(position: UserPosition, pool: LiquidityPool) {
    const sharesOwned = parseFloat(position.sharesOwned);
    const totalShares = parseFloat(pool.totalShares);

    if (totalShares === 0 || sharesOwned === 0) {
      return { currentValueUsd: 0, pnlUsd: 0, impermanentLossPct: 0 };
    }

    const shareRatio = sharesOwned / totalShares;
    
    // Current assets based on share ratio
    const currentA = parseFloat(pool.reserveA) * shareRatio;
    const currentB = parseFloat(pool.reserveB) * shareRatio;

    // For full accuracy, we'd need exact current USD prices of A and B. 
    // Using a placeholder of $0.1 for demo purposes.
    const priceAUsd = 0.1;
    const priceBUsd = 0.1;

    const currentValueUsd = (currentA * priceAUsd) + (currentB * priceBUsd);
    
    const costBasisUsd = (parseFloat(position.assetADeposited) * priceAUsd) + 
                         (parseFloat(position.assetBDeposited) * priceBUsd);

    const pnlUsd = currentValueUsd - costBasisUsd;

    // IL Calculation: Value of current holdings vs value if held outside pool
    const heldOutsideUsd = (parseFloat(position.assetADeposited) * priceAUsd) + 
                           (parseFloat(position.assetBDeposited) * priceBUsd);
                           
    let impermanentLossPct = 0;
    if (heldOutsideUsd > 0 && currentValueUsd < heldOutsideUsd) {
      impermanentLossPct = ((heldOutsideUsd - currentValueUsd) / heldOutsideUsd) * 100;
    }

    return {
      currentValueUsd,
      pnlUsd,
      impermanentLossPct,
    };
  }
}
