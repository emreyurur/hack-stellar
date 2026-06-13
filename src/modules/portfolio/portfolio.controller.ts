import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { PortfolioResponseDto } from './dto/portfolio-response.dto';
import { SyncPositionDto } from './dto/sync-position.dto';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { CurrentUserPublicKey } from '../../shared/decorators/public-key.decorator';

@ApiTags('portfolio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':publicKey')
  @ApiOperation({ summary: 'Get user portfolio (PnL, IL, Balances)' })
  @ApiResponse({ status: 200, type: PortfolioResponseDto })
  async getPortfolio(@Param('publicKey') publicKey: string): Promise<PortfolioResponseDto> {
    return this.portfolioService.getPortfolio(publicKey);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync user position after successful transaction' })
  async syncPosition(
    @CurrentUserPublicKey() publicKey: string,
    @Body() dto: SyncPositionDto
  ) {
    await this.portfolioService.syncPosition(publicKey, dto.poolId, dto.sharesAmount, dto.assetAAmount, dto.assetBAmount);
    return { success: true };
  }
}
