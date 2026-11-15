import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AlltraHealthService {
  private readonly rpcUrl = 'https://alltra.global/rpc';
  private readonly expectedChainId = '0x9f2a4'; // 651940

  async checkHealth() {
    try {
      const response = await axios.post(
        this.rpcUrl,
        { jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] },
        { timeout: 5000 },
      );
      const { result, error } = response.data;
      if (error) throw new Error(error.message);
      if (result !== this.expectedChainId) {
        throw new Error(`Unexpected chain ID: ${result}`);
      }
      return {
        status: 'ok',
        chain: 'Alltra Smart Chain',
        chainId: result,
        rpc: this.rpcUrl,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      throw new HttpException(
        { status: 'error', message: `Alltra RPC health check failed: ${err.message}`, rpc: this.rpcUrl },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
