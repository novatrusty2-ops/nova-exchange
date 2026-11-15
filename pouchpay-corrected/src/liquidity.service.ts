import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class LiquidityService {
    private provider: ethers.JsonRpcProvider;
    private routerAddress: string;
    private tokenAAddress: string;
    private tokenBAddress: string;

    private readonly ERC20_ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)"
    ];

    private readonly ROUTER_ABI = [
        "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)"
    ];

    constructor(private configService: ConfigService) {
        const rpcUrl = this.configService.get<string>('RPC_URL') || 'https://cloudflare-eth.com';
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.routerAddress = this.configService.get<string>('LIQUIDITY_ROUTER') || '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
        this.tokenAAddress = this.configService.get<string>('TOKEN_A_ADDRESS');
        this.tokenBAddress = this.configService.get<string>('TOKEN_B_ADDRESS');
    }

    async executeDeposit(privateKey: string, amountAStr: string, amountBStr: string) {
        if (!privateKey) {
            throw new BadRequestException("Private key is required for liquidity deposit.");
        }

        try {
            const wallet = new ethers.Wallet(privateKey, this.provider);
            const amountA = ethers.parseUnits(amountAStr, 18);
            const amountB = ethers.parseUnits(amountBStr, 18);

            const amountAMin = (amountA * 95n) / 100n; // 5% slippage
            const amountBMin = (amountB * 95n) / 100n;
            const deadline = Math.floor(Date.now() / 1000) + 1200;

            const tokenAContract = new ethers.Contract(this.tokenAAddress, this.ERC20_ABI, wallet);
            const tokenBContract = new ethers.Contract(this.tokenBAddress, this.ERC20_ABI, wallet);
            const routerContract = new ethers.Contract(this.routerAddress, this.ROUTER_ABI, wallet);

            // Check & Approve Token A
            const allowanceA = await tokenAContract.allowance(wallet.address, this.routerAddress);
            if (allowanceA < amountA) {
                const txA = await tokenAContract.approve(this.routerAddress, amountA);
                await txA.wait();
            }

            // Check & Approve Token B
            const allowanceB = await tokenBContract.allowance(wallet.address, this.routerAddress);
            if (allowanceB < amountB) {
                const txB = await tokenBContract.approve(this.routerAddress, amountB);
                await txB.wait();
            }

            // Execute addLiquidity
            const tx = await routerContract.addLiquidity(
                this.tokenAAddress,
                this.tokenBAddress,
                amountA,
                amountB,
                amountAMin,
                amountBMin,
                wallet.address,
                deadline,
                { gasLimit: 3000000 }
            );

            const receipt = await tx.wait();
            return {
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            throw new InternalServerErrorException(`Deposit failed: ${error.message}`);
        }
    }
}
