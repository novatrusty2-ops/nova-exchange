import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import * as path from 'path';
import { VaultSwapService } from './vault-swap.service';

// GET /api/v1/reserves/status
// Returns the declared Account 6572 reserves from config.js (labeled "declared, not verified")
// next to the live on-chain Alltra pool reserves. The declared figures are not used for pricing,
// routing or swaps; only the on-chain pools are.
@Controller('api/v1/reserves')
export class ReservesStatusController {
  constructor(private readonly vault: VaultSwapService) {}

  @Get('status')
  public async status() {
    let declared: any;
    try {
      const file = process.env.RESERVES_CONFIG || path.join(__dirname, '..', 'config.js');
      delete require.cache[require.resolve(file)];
      declared = require(file).reserves;
    } catch (e) {
      throw new InternalServerErrorException({ success: false, error: `config.js: ${e.message}` });
    }
    let onChain: any;
    try {
      onChain = await this.vault.getVaultReserves();
    } catch {
      onChain = { status: 'UNAVAILABLE' };
    }
    return { success: true, account: '6572', declaredReserves: declared, onChainLiquidity: onChain };
  }
}
