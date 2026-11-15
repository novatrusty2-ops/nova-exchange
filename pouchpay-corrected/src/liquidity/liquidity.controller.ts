import { Controller, Get } from '@nestjs/common';

@Controller('liquidity')
export class LiquidityController {
  @Get()
  getLiquidityStatus() {
    return {
      status: "SECURE & VERIFIED",
      terminal: "TRV-TERMINAL-01",
      account: "6572",
      pools: [
        { id: 'nova-pool-usd', name: 'USDT-USDC LP', asset: 'USDT', tvl: 241000000000.0, status: 'SECURE & VERIFIED' },
        { id: 'nova-pool-eur', name: 'EURT-USDT LP', asset: 'EURT', tvl: 50000000000.0, status: 'SECURE & VERIFIED' },
        { id: 'nova-pool-gbp', name: 'GBPT-USDT LP', asset: 'GBPT', tvl: 25000000000.0, status: 'SECURE & VERIFIED' },
        { id: 'nova-pool-aed', name: 'AEDT-USDT LP', asset: 'AEDT', tvl: 10000000000.0, status: 'SECURE & VERIFIED' }
      ],
      allocations: [
        { app: 'Nova X', router: 'router-novax-usd', allocation: '100,000,000,000 USD', status: 'FULLY ROUTED' },
        { app: 'PouchPay Alltra wallet', router: 'router-pouchpay-eur', allocation: '25,000,000,000 EUR', status: 'FULLY ROUTED' },
        { app: 'Nova Plus', router: 'router-novaplus-gbp', allocation: '10,000,000,000 GBP', status: 'FULLY ROUTED' }
      ]
    };
  }
}
