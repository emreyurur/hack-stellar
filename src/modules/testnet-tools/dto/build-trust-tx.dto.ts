import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class BuildTrustTxDto {
  @ApiProperty({ description: 'The public key of the user who wants to trust the token', example: 'G...' })
  @IsNotEmpty()
  @IsString()
  userPublicKey: string;

  @ApiProperty({ description: 'The token code to trust (e.g. terminal)', example: 'terminal' })
  @IsNotEmpty()
  @IsString()
  tokenCode: string;
}
