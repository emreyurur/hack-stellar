import { IsString, IsNumber, IsEnum, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum TransactionAction {
  DEPOSIT = "DEPOSIT",
  WITHDRAW = "WITHDRAW",
}

export class BuildTransactionDto {
  @ApiProperty({ description: "Pool ID" })
  @IsString()
  poolId: string;

  @ApiProperty({ enum: TransactionAction })
  @IsEnum(TransactionAction)
  action: TransactionAction;

  @ApiProperty({ description: "Amount for Asset A (if deposit)" })
  @IsNumber()
  @IsOptional()
  amountA?: number;

  @ApiProperty({ description: "Amount for Asset B (if deposit)" })
  @IsNumber()
  @IsOptional()
  amountB?: number;

  @ApiProperty({ description: "Amount of shares (if withdraw)" })
  @IsNumber()
  @IsOptional()
  shareAmount?: number;

  @ApiProperty({ description: "Slippage tolerance in bps", required: false })
  @IsNumber()
  @IsOptional()
  slippageBps?: number;
}
