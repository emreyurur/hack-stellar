import { ApiProperty } from '@nestjs/swagger';

export class RiskResponseDto {
  @ApiProperty({ description: 'Horizon Pool ID' })
  poolId: string;

  @ApiProperty({ description: 'Trust score (0-100)' })
  trustScore: number;

  @ApiProperty({ description: 'TVL depth score (0-100)' })
  tvlScore: number;

  @ApiProperty({ description: 'Volatility score (0-100)' })
  volatilityScore: number;

  @ApiProperty({ description: 'Estimated APY score (0-100)' })
  apyScore: number;

  @ApiProperty({ description: 'Composite average score (0-100)' })
  compositeScore: number;

  @ApiProperty({ description: 'Risk level (LOW, MEDIUM, HIGH)' })
  riskLevel: string;

  @ApiProperty({ description: 'Estimated APY percentage', required: false })
  estimatedApy: number | null;
}
