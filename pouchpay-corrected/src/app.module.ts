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
import { PoolsController } from './pools.controller';
import { AlltraModule } from './alltra/alltra.module';

// Every controller must be listed here or its routes return 404.
// nova-bank-monitor reads /reserves/status and nova-rebalance-engine reads /vault/reserves.
@Module({
  imports: [AlltraModule],
  controllers: [
    AppController,
    HealthController,
    RpcController,
    VaultSwapController,
    ReservesStatusController,
    LiquidityController,
    PoolsController,
  ],
  providers: [AppService, VaultSwapService, NovaBankService],
})
export class AppModule {}
