import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class AutomateCustomLpDto {

  @ApiPropertyOptional({ description: 'Distributor secret key for testnet. If not provided, process.env.TESTNET_DISTRIBUTOR_SECRET is used.' })
  @IsOptional()
  @IsString()
  distributorSecret?: string;

  @ApiProperty({ description: 'The first custom token code (e.g. yrk)', example: 'yrk' })
  @IsNotEmpty()
  @IsString()
  tokenCode1: string;

  @ApiProperty({ description: 'Amount of token 1 to mint', example: '50000' })
  @IsNotEmpty()
  @IsString()
  mintAmount1: string;

  @ApiProperty({ description: 'Amount of token 1 to deposit into LP', example: '10000' })
  @IsNotEmpty()
  @IsString()
  depositAmount1: string;

  @ApiProperty({ description: 'The second custom token code (e.g. terminal)', example: 'terminal' })
  @IsNotEmpty()
  @IsString()
  tokenCode2: string;

  @ApiProperty({ description: 'Amount of token 2 to mint', example: '50000' })
  @IsNotEmpty()
  @IsString()
  mintAmount2: string;

  @ApiProperty({ description: 'Amount of token 2 to deposit into LP', example: '10000' })
  @IsNotEmpty()
  @IsString()
  depositAmount2: string;
}
