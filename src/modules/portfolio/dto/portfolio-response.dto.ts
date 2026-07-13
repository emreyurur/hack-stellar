import { ApiProperty } from "@nestjs/swagger";

export class PositionDto {
  @ApiProperty()
  poolId: string;

  @ApiProperty()
  sharesOwned: string;

  @ApiProperty()
  currentValueUsd: number;

  @ApiProperty()
  impermanentLossPct: number;

  @ApiProperty()
  pnlUsd: number;
}

export class PortfolioResponseDto {
  @ApiProperty()
  userPublicKey: string;

  @ApiProperty()
  totalValueUsd: number;

  @ApiProperty()
  totalPnlUsd: number;

  @ApiProperty({ type: [PositionDto] })
  positions: PositionDto[];
}
