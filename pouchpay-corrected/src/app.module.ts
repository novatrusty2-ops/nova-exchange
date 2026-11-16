import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RpcController } from './rpc.controller';
import { VaultSwapController } from './vault-swap.controller';
import { VaultSwapService } from './vault-swap.service';
import { ReservesStatusController } from './reserves-status.controller';
import { NovaBankService } from './nova-bank.service';

@Module({
  imports: [],
  controllers: [HealthController, RpcController, VaultSwapController, ReservesStatusController],
  providers: [VaultSwapService, NovaBankService],
})
export class AppModule {}
