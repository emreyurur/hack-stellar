import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class MintTokenDto {
  @ApiProperty({ description: 'The token code to mint (e.g. terminal)', example: 'terminal' })
  @IsNotEmpty()
  @IsString()
  tokenCode: string;

  @ApiProperty({ description: 'Amount of token to mint', example: '50000' })
  @IsNotEmpty()
  @IsString()
  amount: string;

  @ApiProperty({ description: 'Destination public key to receive the tokens', example: 'G...' })
  @IsNotEmpty()
  @IsString()
  destination: string;

  @ApiPropertyOptional({ description: 'Issuer public key (if minting your own token). Defaults to backend issuer if empty.', example: 'G...' })
  @IsOptional()
  @IsString()
  issuerPublicKey?: string;
}
