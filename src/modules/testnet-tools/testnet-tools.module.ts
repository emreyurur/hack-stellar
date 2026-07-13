import { Module } from '@nestjs/common';
import { TestnetToolsController } from './testnet-tools.controller';
import { TestnetToolsService } from './testnet-tools.service';

@Module({
  controllers: [TestnetToolsController],
  providers: [TestnetToolsService],
})
export class TestnetToolsModule {}
