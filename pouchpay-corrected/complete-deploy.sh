import { Controller, Get, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { LiquidityService } from './liquidity.service';

@Controller('liquidity')
export class LiquidityController {
  constructor(private readonly liquidityService: LiquidityService) {}

  @Get('reserves')
  @HttpCode(HttpStatus.OK)
  async getReserves() {
    return await this.liquidityService.getPoolReserves();
  }

  @Post('deposit')
  @HttpCode(HttpStatus.CREATED)
  async depositLiquidity(
    @Body() dto: { walletAddress: string; tokenAddress: string; amount: string; chainId: number },
  ) {
    return await this.liquidityService.processDeposit(dto);
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class LiquidityService {
  private readonly logger = new Logger(LiquidityService.name);
  private provider: ethers.JsonRpcProvider;

  constructor() {
    // BSC Mainnet RPC connection
    const rpcUrl = process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async getPoolReserves() {
    this.logger.log('Fetching liquidity pool reserves from BSC...');
    // Add your contract call logic here using ethers.js or Web3
    return {
      success: true,
      contractAddress: process.env.LIQUIDITY_CONTRACT_ADDRESS || '0x9ae0290cd677dc69a5f2a1e435ef002400da70f5',
      chainId: 56,
      reserves: {
        tokenA: '500000.00',
        tokenB: '1000000.00',
      },
      timestamp: new Date().toISOString(),
    };
  }

  async processDeposit(dto: { walletAddress: string; tokenAddress: string; amount: string; chainId: number }) {
    this.logger.log(`Processing deposit for wallet: ${dto.walletAddress}, Amount: ${dto.amount}`);
    // Add transaction processing / smart contract interaction logic here
    return {
      success: true,
      message: 'Liquidity deposit request received successfully',
      txHash: '0x_mock_transaction_hash_bsc_56',
      data: dto,
    };
  }
}
import { Module } from '@nestjs/common';
import { LiquidityController } from './liquidity.controller';
import { LiquidityService } from './liquidity.service';

@Module({
  controllers: [LiquidityController],
  providers: [LiquidityService],
  exports: [LiquidityService],
})
export class LiquidityModule {}
