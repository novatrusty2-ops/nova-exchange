import { Injectable, Logger, BadRequestException } from '@nestjs/common';

export interface SwapRequest {
  sourceCurrency: 'USD' | 'EUR' | 'GBP' | 'AED' | 'USDT';
  targetCurrency: 'USD' | 'EUR' | 'GBP' | 'AED' | 'USDT';
  amount: number;
  terminalId: string;
}

@Injectable()
export class VaultSwapService {
  private readonly logger = new Logger(VaultSwapService.name);

  private vaultReserves = {
    'nova-pool-usd': 241000000000,
    'nova-pool-eur': 50000000000,
    'nova-pool-gbp': 25000000000,
    'nova-pool-aed': 10000000000,
  };

  public async executeLiquiditySwap(request: SwapRequest): Promise<any> {
    this.logger.log(`Processing swap: ${request.amount} ${request.sourceCurrency} -> ${request.targetCurrency}`);
    const sourceKey = `nova-pool-${request.sourceCurrency.toLowerCase()}`;
    
    if (this.vaultReserves[sourceKey] && this.vaultReserves[sourceKey] < request.amount) {
      throw new BadRequestException(`Insufficient reserves in ${sourceKey}`);
    }

    return {
      status: 'SUCCESS',
      terminal: request.terminalId,
      sourceCurrency: request.sourceCurrency,
      targetCurrency: request.targetCurrency,
      inputAmount: request.amount,
      outputAmount: request.amount, // 1:1 AMM peg simulation
      timestamp: new Date().toISOString(),
    };
  }

  public getVaultReserves() {
    return {
      terminal: 'TRV-TERMINAL-01',
      account: '6572',
      reserves: this.vaultReserves,
      status: 'OPERATIONAL',
      timestamp: new Date().toISOString(),
    };
  }
}
