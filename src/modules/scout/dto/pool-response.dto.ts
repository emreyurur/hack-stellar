import { ApiProperty } from '@nestjs/swagger';

export class PoolResponseDto {
  @ApiProperty({ description: 'Horizon Pool ID' })
  id: string;

  @ApiProperty({ description: 'Fee in basis points' })
  feeBp: number;

  @ApiProperty({ description: 'Pool type (e.g., constant_product)' })
  type: string;

  @ApiProperty({ description: 'Total shares of the pool' })
  totalShares: string;

  @ApiProperty({ description: 'Asset A Code' })
  assetACode: string;

  @ApiProperty({ description: 'Asset A Issuer', required: false })
  assetAIssuer: string | null;

  @ApiProperty({ description: 'Asset A Reserve' })
  reserveA: string;

  @ApiProperty({ description: 'Asset B Code' })
  assetBCode: string;

  @ApiProperty({ description: 'Asset B Issuer', required: false })
  assetBIssuer: string | null;

  @ApiProperty({ description: 'Asset B Reserve' })
  reserveB: string;

  @ApiProperty({ description: 'Total trustlines' })
  totalTrustlines: number;

  @ApiProperty({ description: 'Last synced time' })
  lastSyncedAt: Date;
}
