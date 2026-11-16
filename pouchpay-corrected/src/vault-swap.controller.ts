import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { VaultSwapService, SwapRequest } from './vault-swap.service';

@Controller('vault')
export class VaultSwapController {
  constructor(private readonly vaultSwapService: VaultSwapService) {}

  @Get('reserves')
  public getReserves() {
    return this.vaultSwapService.getVaultReserves();
  }

  @Post('swap')
  @HttpCode(HttpStatus.OK)
  public async executeSwap(@Body() request: SwapRequest) {
    return await this.vaultSwapService.executeLiquiditySwap(request);
  }
}
