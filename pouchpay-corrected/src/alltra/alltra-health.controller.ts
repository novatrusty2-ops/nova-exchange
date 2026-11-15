import { Controller, Get } from '@nestjs/common';
import { AlltraHealthService } from './alltra-health.service';

@Controller('alltra')
export class AlltraHealthController {
  constructor(private readonly alltraHealthService: AlltraHealthService) {}

  @Get('health')
  async getHealth() {
    return this.alltraHealthService.checkHealth();
  }
}
