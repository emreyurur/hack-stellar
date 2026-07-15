import { Controller, Post, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TestnetToolsService } from './testnet-tools.service';
import { BuildLpTxDto } from './dto/build-lp-tx.dto';
import { MintTokenDto } from './dto/mint-token.dto';
import { BuildTrustTxDto } from './dto/build-trust-tx.dto';
import { SubmitMintTxDto } from './dto/submit-mint-tx.dto';

@ApiTags('testnet-tools')
@Controller('api/v1/pools/testnet')
export class TestnetToolsController {
  constructor(private readonly testnetToolsService: TestnetToolsService) {}

  @Post('build-lp-tx')
  @ApiOperation({ 
    summary: 'Build an LP creation transaction (XLM-Token or Token-Token)', 
    description: 'Generates a partially signed XDR for Liquidity Pool creation. \n\n**How to use:**\n- For **XLM-Token Pool**: Set `tokenA: "XLM"` and `tokenB: "TOKEN_CODE"`.\n- For **Token-Token Pool**: Set `tokenA: "TOKEN1"` and `tokenB: "TOKEN2"`.\n\nThe backend will automatically handle lexicographic sorting, trustlines, and minting (if mintAmount is provided). The returned XDR must be signed by the user on the frontend and submitted to the network.'
  })
  @ApiResponse({ status: 201, description: 'Returns base64 encoded XDR for frontend signing' })
  @ApiResponse({ status: 400, description: 'Bad Request / Failed to Build' })
  async buildLpTx(@Body() dto: BuildLpTxDto) {
    try {
      const result = await this.testnetToolsService.buildLiquidityPoolTransaction(dto);
      return result;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post('build-mint-tx')
  @ApiOperation({ 
    summary: 'Build a transaction to mint a token', 
    description: 'Generates an XDR for minting (Payment operation) a token to a destination. \n\nIf the `issuerPublicKey` is omitted, the system will use the default backend testnet issuer and partially sign the transaction. If you provide a custom `issuerPublicKey`, the transaction is returned unsigned and must be signed by the issuer on the frontend.'
  })
  @ApiResponse({ status: 201, description: 'Returns base64 encoded XDR for frontend signing' })
  @ApiResponse({ status: 400, description: 'Bad Request / Failed to Build' })
  async buildMintTx(@Body() dto: MintTokenDto) {
    try {
      const result = await this.testnetToolsService.buildMintTransaction(dto);
      return result;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post('build-trust-tx')
  @ApiOperation({ 
    summary: 'Build a transaction to establish a trustline',
    description: 'Generates an XDR containing a ChangeTrust operation for the user. \n\nThe frontend must prompt the user to sign this XDR with their Freighter wallet and then submit it to the network.'
  })
  @ApiResponse({ status: 201, description: 'Returns base64 encoded XDR for frontend signing' })
  @ApiResponse({ status: 400, description: 'Bad Request / Failed to Build' })
  async buildTrustTx(@Body() dto: BuildTrustTxDto) {
    try {
      const result = await this.testnetToolsService.buildTrustTransaction(dto);
      return result;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post('submit-mint-tx')
  @ApiOperation({ 
    summary: 'Submit a signed mint transaction and log it',
    description: 'Takes a fully signed XDR (signed via Freighter on the frontend), submits it to the Stellar testnet, and logs the MINT operation to the local history database upon success.'
  })
  @ApiResponse({ status: 201, description: 'Transaction submitted successfully' })
  @ApiResponse({ status: 400, description: 'Failed to submit' })
  async submitMintTx(@Body() dto: SubmitMintTxDto) {
    try {
      const result = await this.testnetToolsService.submitAndLogMint(dto);
      return result;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}
