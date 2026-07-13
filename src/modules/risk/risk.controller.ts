import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { RiskService } from "./risk.service";
import { RiskResponseDto } from "./dto/risk-response.dto";

@ApiTags("risk")
@Controller("api/v1/pools")
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Get(":id/risk")
  @ApiOperation({ summary: "Get detailed risk breakdown for a pool" })
  @ApiResponse({
    status: 200,
    description: "Risk score details",
    type: RiskResponseDto,
  })
  @ApiResponse({ status: 404, description: "Risk data not found" })
  async getPoolRisk(@Param("id") id: string): Promise<RiskResponseDto> {
    let risk = await this.riskService.getRiskByPoolId(id);

    // Eğer veritabanında risk skoru yoksa, anlık olarak hesaplamayı dene
    if (!risk) {
      try {
        risk = await this.riskService.calculatePoolRisk(id);
      } catch (e) {
        throw new NotFoundException(
          `Risk data for pool ${id} not found and could not be calculated: ${e.message}`,
        );
      }
    }

    return {
      poolId: risk.poolId,
      trustScore: risk.trustScore,
      tvlScore: risk.tvlScore,
      volatilityScore: risk.volatilityScore,
      apyScore: risk.apyScore,
      compositeScore: risk.compositeScore,
      riskLevel: risk.riskLevel,
      estimatedApy: risk.estimatedApy,
    };
  }

  @Get("level/:level")
  @ApiOperation({
    summary: "Get pools filtered by a specific risk level (LOW, MEDIUM, HIGH)",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "Paginated list of pools with their risk scores",
  })
  async getPoolsByLevel(
    @Param("level") level: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 50;

    return this.riskService.getPoolsByRiskLevel(level, pageNumber, limitNumber);
  }
}
