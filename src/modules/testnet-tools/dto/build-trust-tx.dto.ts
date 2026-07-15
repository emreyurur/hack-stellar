import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class BuildTrustTxDto {
  @ApiProperty({ description: 'The user public key who wants to trust the token', example: 'G...' })
  @IsNotEmpty()
  @IsString()
  userPublicKey: string;

  @ApiProperty({ description: 'The token code to trust (e.g. terminal)', example: 'terminal' })
  @IsNotEmpty()
  @IsString()
  tokenCode: string;

  @ApiPropertyOptional({ description: 'Issuer public key (if trusting a custom token). Defaults to backend issuer if empty.', example: 'G...' })
  @IsOptional()
  @IsString()
  issuerPublicKey?: string;
}
