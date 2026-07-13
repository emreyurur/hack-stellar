import { Controller, Post, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TestnetToolsService } from './testnet-tools.service';
import { AutomateLpDto } from './dto/automate-lp.dto';
import { AutomateCustomLpDto } from './dto/automate-custom-lp.dto';
import { MintTokenDto } from './dto/mint-token.dto';
import { BuildTrustTxDto } from './dto/build-trust-tx.dto';

@ApiTags('testnet-tools')
@Controller('api/v1/pools/testnet')
export class TestnetToolsController {
  constructor(private readonly testnetToolsService: TestnetToolsService) {}

  @Post('automate-lp')
  @ApiOperation({ summary: 'Automate testnet token minting and LP deposit' })
  @ApiResponse({ status: 201, description: 'Successfully created token and LP' })
  @ApiResponse({ status: 400, description: 'Bad Request / Failed Transaction' })
  async automateTestnetLp(@Body() dto: AutomateLpDto) {
    try {
      const result = await this.testnetToolsService.automateTokenAndLP(dto);
      return result;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post('automate-custom-lp')
  @ApiOperation({ summary: 'Automate testnet Custom Token-Token minting and LP deposit' })
  @ApiResponse({ status: 201, description: 'Successfully created custom tokens and LP' })
  @ApiResponse({ status: 400, description: 'Bad Request / Failed Transaction' })
  async automateTestnetCustomLp(@Body() dto: AutomateCustomLpDto) {
    try {
      const result = await this.testnetToolsService.automateCustomTokenLP(dto);
      return result;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post('mint-token')
  @ApiOperation({ summary: 'Mint testnet tokens to a specific wallet' })
  @ApiResponse({ status: 201, description: 'Successfully minted tokens' })
  @ApiResponse({ status: 400, description: 'Bad Request / Failed Transaction' })
  async mintToken(@Body() dto: MintTokenDto) {
    try {
      const result = await this.testnetToolsService.mintTokenToWallet(dto);
      return result;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post('build-trust-tx')
  @ApiOperation({ summary: 'Build an unsigned XDR transaction for a user to establish a trustline' })
  @ApiResponse({ status: 201, description: 'Returns base64 encoded XDR' })
  @ApiResponse({ status: 400, description: 'Bad Request / Failed' })
  async buildTrustTx(@Body() dto: BuildTrustTxDto) {
    try {
      const result = await this.testnetToolsService.buildTrustTransaction(dto);
      return result;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}
