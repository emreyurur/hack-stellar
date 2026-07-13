import { ApiProperty } from "@nestjs/swagger";

export class SyncPositionDto {
  @ApiProperty()
  poolId: string;

  @ApiProperty()
  sharesAmount: string;

  @ApiProperty()
  assetAAmount: string;

  @ApiProperty()
  assetBAmount: string;
}
