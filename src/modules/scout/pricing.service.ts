import { Injectable, Logger, Inject } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { appConfig } from "../../config/app.config";
import { HorizonClient } from "./horizon/horizon.client";
import { RedisService } from "../../core/redis/redis.service";

// Stellar mainnet'te en yaygın USDC issuer
const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
const USDC_CODE = "USDC";

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
    private readonly horizonClient: HorizonClient,
    private readonly redisService: RedisService,
  ) {}

  /**
   * XLM/USD fiyatını Horizon'daki XLM/USDC trade'lerinden VWAP ile hesaplar.
   * 5 dakika cache'lenir.
   */
  async getXlmUsdPrice(): Promise<number> {
    const cacheKey = "price:xlm_usd";
    const cached = await this.redisService.get<number>(cacheKey);
    if (cached) return cached;

    try {
      const trades = await this.horizonClient.fetchTradesByAssets(
        "native",
        "", // XLM
        USDC_CODE,
        USDC_ISSUER,
        24,
      );

      if (trades.length === 0) {
        // this.logger.warn('No XLM/USDC trades found, using fallback price');
        return 0.1; // Son çare fallback
      }

      const vwap = this.calculateVwap(trades);
      await this.redisService.set(cacheKey, vwap, 300); // 5dk cache
      this.logger.log(
        `XLM/USD VWAP: $${vwap.toFixed(6)} (from ${trades.length} trades)`,
      );
      return vwap;
    } catch (e) {
      this.logger.error(`Failed to fetch XLM/USD price: ${e.message}`);
      return 0.1; // Fallback
    }
  }

  /**
   * Herhangi bir asset'in USD fiyatını hesaplar.
   * Strateji:
   *   1. XLM ise → doğrudan XLM/USD
   *   2. USDC ise → 1.0
   *   3. Diğerleri → Önce Asset/XLM trade VWAP, sonra × XLM/USD
   */
  async getAssetUsdPrice(code: string, issuer: string | null): Promise<number> {
    // Native XLM
    if (!issuer || code === "XLM") {
      return this.getXlmUsdPrice();
    }

    // Stablecoin'ler
    if (code === "USDC" || code === "USDT") {
      return 1.0;
    }

    const cacheKey = `price:${code}:${issuer}`;
    const cached = await this.redisService.get<number>(cacheKey);
    if (cached) return cached;

    try {
      // Asset/XLM trade'lerinden VWAP hesapla
      const trades = await this.horizonClient.fetchTradesByAssets(
        code,
        issuer,
        "native",
        "", // XLM karşısında
        24,
      );

      if (trades.length === 0) {
        // XLM ile trade yoksa, USDC ile dene
        const usdcTrades = await this.horizonClient.fetchTradesByAssets(
          code,
          issuer,
          USDC_CODE,
          USDC_ISSUER,
          24,
        );

        if (usdcTrades.length === 0) {
          // this.logger.debug(`No trades found for ${code}, price unknown`);
          return 0;
        }

        const vwapUsdc = this.calculateVwap(usdcTrades);
        await this.redisService.set(cacheKey, vwapUsdc, 300);
        return vwapUsdc; // Zaten USD cinsinden
      }

      const vwapXlm = this.calculateVwap(trades);
      const xlmUsd = await this.getXlmUsdPrice();
      const priceUsd = vwapXlm * xlmUsd;

      await this.redisService.set(cacheKey, priceUsd, 300);
      return priceUsd;
    } catch (e) {
      // this.logger.warn(`Failed to price ${code}: ${e.message}`);
      return 0;
    }
  }

  /**
   * Volume-Weighted Average Price hesaplar.
   * VWAP = Σ(price × volume) / Σ(volume)
   */
  private calculateVwap(trades: any[]): number {
    let sumPriceVolume = 0;
    let sumVolume = 0;

    for (const trade of trades) {
      const price = trade.price.n / trade.price.d;
      const volume = parseFloat(trade.base_amount);

      sumPriceVolume += price * volume;
      sumVolume += volume;
    }

    if (sumVolume === 0) return 0;
    return sumPriceVolume / sumVolume;
  }
}
