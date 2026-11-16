import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { RpcController } from './rpc.controller';
import { VaultSwapController } from './vault-swap.controller';
import { VaultSwapService } from './vault-swap.service';
import { ReservesStatusController } from './reserves-status.controller';
import { NovaBankService } from './nova-bank.service';
import { LiquidityController } from './liquidity/liquidity.controller';
import { AlltraModule } from './alltra/alltra.module';

@Module({
  imports: [AlltraModule],
  controllers: [
    AppController,
    HealthController,
    RpcController,
    VaultSwapController,
    ReservesStatusController,
    LiquidityController,
  ],
  providers: [AppService, VaultSwapService, NovaBankService],
})
export class AppModule {}
