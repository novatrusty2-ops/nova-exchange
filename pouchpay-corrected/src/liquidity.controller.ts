import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { LiquidityService } from './liquidity.service';

@Controller('liquidity')
export class LiquidityController {
    constructor(private readonly liquidityService: LiquidityService) {}

    @Post('deposit')
    @HttpCode(HttpStatus.OK)
    async depositLiquidity(@Body() body: { privateKey: string; amountA: string; amountB: string }) {
        return await this.liquidityService.executeDeposit(body.privateKey, body.amountA, body.amountB);
    }
}
