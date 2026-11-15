import { Module } from '@nestjs/common';
import { LiquidityController } from './liquidity/liquidity.controller';

@Module({
  imports: [],
  controllers: [LiquidityController],
  providers: [],
})
export class AppModule {}
