import { Controller, Get } from '@nestjs/common';
import { VaultSwapService } from '../vault-swap.service';

// GET /liquidity (and /api/v1/liquidity)
// Live liquidity of the Alltra (chain 651940) AMM pools, read on-chain via VaultSwapService.
// This previously returned hard-coded pools ($241B TVL, "SECURE & VERIFIED") that were not read from anywhere.
// Declared, unverified bank figures are served separately by GET /reserves/status.
@Controller(['liquidity', 'api/v1/liquidity'])
export class LiquidityController {
  constructor(private readonly vault: VaultSwapService) {}

  @Get()
  async getLiquidityStatus() {
    return this.vault.getVaultReserves();
  }
}
