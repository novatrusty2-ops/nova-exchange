import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';

@Controller('rpc')
export class RpcController {
  private readonly logger = new Logger(RpcController.name);

  @Post('nova-x')
  @HttpCode(HttpStatus.OK)
  async handleNovaXRpc(@Body() body: any) {
    const { id = 1, method } = body;
    this.logger.log(`[Nova X] Method: ${method}`);
    if (method === 'eth_chainId') {
      return { jsonrpc: '2.0', result: '0x55f0', id }; // Chain 22016
    }
    return { jsonrpc: '2.0', result: '0x0', id };
  }

  @Post('nova-plus')
  @HttpCode(HttpStatus.OK)
  async handleNovaPlusRpc(@Body() body: any) {
    const { id = 1, method } = body;
    this.logger.log(`[Nova Plus] Method: ${method}`);
    if (method === 'eth_chainId') {
      return { jsonrpc: '2.0', result: '0x80E9', id }; // Chain 33001
    }
    return { jsonrpc: '2.0', result: '0x0', id };
  }
}
