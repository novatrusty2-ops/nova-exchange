import { Module } from '@nestjs/common';
import { AlltraHealthController } from './alltra-health.controller';
import { AlltraHealthService } from './alltra-health.service';

// GET /alltra/health: checks the Alltra RPC answers with chain ID 651940 (HTTP 502 when it does not).
@Module({
  controllers: [AlltraHealthController],
  providers: [AlltraHealthService],
  exports: [AlltraHealthService],
})
export class AlltraModule {}
