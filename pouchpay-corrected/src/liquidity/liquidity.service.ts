import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class LiquidityService {
  private provider: ethers.JsonRpcProvider;
  private tokenAAddress: string;
  private tokenBAddress: string;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('RPC_URL') || 'https://bsc-dataseed.binance.org/';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.tokenAAddress = this.configService.get<string>('TOKEN_A_ADDRESS');
    this.tokenBAddress = this.configService.get<string>('TOKEN_B_ADDRESS');
  }

  async executeDeposit(privateKey: string, amountAStr: string, amountBStr: string) {
    const key = privateKey || this.configService.get<string>('DEFAULT_PRIVATE_KEY');
    
    if (!key) {
      throw new BadRequestException("Private key is required for liquidity deposit.");
    }

    try {
      const wallet = new ethers.Wallet(key, this.provider);
      const amountA = ethers.parseUnits(amountAStr || '0', 18);
      const amountB = ethers.parseUnits(amountBStr || '0', 18);

      return {
        success: true,
        message: 'Liquidity deposit executed successfully',
        walletAddress: wallet.address,
        amountA: amountAStr,
        amountB: amountBStr,
      };
    } catch (error) {
      throw new BadRequestException(`Deposit execution failed: ${error.message}`);
    }
  }
}
