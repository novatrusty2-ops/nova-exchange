import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RpcController } from './rpc.controller';
import { VaultSwapController } from './vault-swap.controller';
import { VaultSwapService } from './vault-swap.service';

@Module({
  imports: [],
  controllers: [HealthController, RpcController, VaultSwapController],
  providers: [VaultSwapService],
})
export class AppModule {}
