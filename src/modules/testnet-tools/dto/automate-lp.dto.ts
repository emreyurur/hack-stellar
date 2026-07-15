import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class AutomateLpDto {

  @ApiPropertyOptional({ description: 'Distributor secret key for testnet. If not provided, process.env.TESTNET_DISTRIBUTOR_SECRET is used.' })
  @IsOptional()
  @IsString()
  distributorSecret?: string;

  @ApiProperty({ description: 'The custom token code to mint (e.g. yrk)', example: 'yrk' })
  @IsNotEmpty()
  @IsString()
  tokenCode: string;

  @ApiProperty({ description: 'Amount of token to mint to distributor', example: '50000' })
  @IsNotEmpty()
  @IsString()
  mintAmount: string;

  @ApiProperty({ description: 'Amount of XLM to deposit into LP', example: '1000' })
  @IsNotEmpty()
  @IsString()
  depositXlmAmount: string;

  @ApiProperty({ description: 'Amount of custom token to deposit into LP', example: '10000' })
  @IsNotEmpty()
  @IsString()
  depositTokenAmount: string;
}
