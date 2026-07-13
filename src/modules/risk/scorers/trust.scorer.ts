import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { LiquidityPool } from "../../scout/entities/liquidity-pool.entity";
import { RedisService } from "../../../core/redis/redis.service";
import { CACHE_KEYS } from "../../../shared/constants";
import { HorizonClient } from "../../scout/horizon/horizon.client";

@Injectable()
export class TrustScorer {
  private readonly logger = new Logger(TrustScorer.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly horizonClient: HorizonClient,
  ) {}

  async score(pool: LiquidityPool): Promise<number> {
    const scoreA = await this.scoreAsset(pool.assetACode, pool.assetAIssuer);
    const scoreB = await this.scoreAsset(pool.assetBCode, pool.assetBIssuer);
    return (scoreA + scoreB) / 2;
  }

  private async scoreAsset(
    code: string,
    issuer: string | null,
  ): Promise<number> {
    if (!issuer) {
      return 100; // Native XLM is fully trusted
    }

    // 1. StellarExpert verified list cache check
    const isExpertVerified = await this.checkStellarExpertList(code, issuer);
    if (isExpertVerified) {
      return 100; // Directly verified by expert list
    }

    let score = 0;

    // 2. Fallback: Check issuer account and stellar.toml
    try {
      const account = await this.horizonClient.fetchAccount(issuer);
      if (account?.home_domain) {
        score += 20;

        const tomlData = await this.fetchStellarToml(account.home_domain);
        if (tomlData) {
          score += 10;
          // Check if asset is explicitly listed in toml
          if (tomlData.includes(code) && tomlData.includes(issuer)) {
            score += 50;
          }
          if (
            tomlData.includes("regulated = true") ||
            tomlData.includes("regulated=true")
          ) {
            score += 20;
          }
        }
      }
    } catch (e) {
      this.logger.warn(`Failed to score asset ${code}-${issuer}: ${e.message}`);
    }

    return Math.min(score, 100);
  }

  private async checkStellarExpertList(
    code: string,
    issuer: string,
  ): Promise<boolean> {
    let verifiedAssets = await this.redisService.get<any[]>(
      CACHE_KEYS.VERIFIED_ASSETS,
    );

    if (!verifiedAssets) {
      try {
        const response = await axios.get(
          "https://api.stellar.expert/explorer/public/asset",
          {
            params: { search: code, rating: "1", limit: 50 },
          },
        );
        verifiedAssets = response.data?._embedded?.records || [];
        await this.redisService.set(
          CACHE_KEYS.VERIFIED_ASSETS,
          verifiedAssets,
          86400,
        ); // 24h
      } catch (e) {
        this.logger.warn(`Failed to fetch StellarExpert assets: ${e.message}`);
        return false;
      }
    }

    return verifiedAssets.some((a) => a.asset === `${code}-${issuer}`);
  }

  private async fetchStellarToml(domain: string): Promise<string | null> {
    const cacheKey = `${CACHE_KEYS.TOML_PREFIX}${domain}`;
    let toml = await this.redisService.get<string>(cacheKey);

    if (!toml) {
      try {
        const response = await axios.get(
          `https://${domain}/.well-known/stellar.toml`,
          { timeout: 5000 },
        );
        toml = response.data;
        await this.redisService.set(cacheKey, toml, 86400); // 24h
      } catch (e) {
        // Mark as failed in cache for 1 hour to avoid spamming
        await this.redisService.set(cacheKey, "FAILED", 3600);
        return null;
      }
    }

    return toml === "FAILED" ? null : toml;
  }
}
