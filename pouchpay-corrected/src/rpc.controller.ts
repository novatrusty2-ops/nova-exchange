import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';

// Previously these routes answered every JSON-RPC call with "0x0" (fake). They now forward
// read-only calls to the real chain RPC and return a proper JSON-RPC error if it is unreachable.
// The originals are kept in backups/simulated-2026-11-16/.

const UPSTREAMS: Record<string, { chainId: number; url: string }> = {
  'nova-x': { chainId: 22016, url: process.env.NOVA_X_RPC_URL || 'https://www.nova-x.io/novaone-rpc/' },
  'nova-plus': { chainId: 33001, url: process.env.NOVA_PLUS_RPC_URL || 'https://www.nova-x.io/nrw-rpc/' },
};

const READ_ONLY = new Set([
  'eth_chainId', 'net_version', 'eth_blockNumber', 'eth_getBalance', 'eth_call', 'eth_getLogs',
  'eth_getBlockByNumber', 'eth_getBlockByHash', 'eth_getTransactionByHash', 'eth_getTransactionReceipt',
  'eth_getCode', 'eth_gasPrice', 'eth_estimateGas', 'eth_getTransactionCount', 'eth_feeHistory',
]);

@Controller('rpc')
export class RpcController {
  private readonly logger = new Logger(RpcController.name);

  @Post('nova-x')
  @HttpCode(HttpStatus.OK)
  handleNovaXRpc(@Body() body: any) {
    return this.forward('nova-x', body);
  }

  @Post('nova-plus')
  @HttpCode(HttpStatus.OK)
  handleNovaPlusRpc(@Body() body: any) {
    return this.forward('nova-plus', body);
  }

  private async forward(name: string, body: any) {
    const id = body?.id ?? 1;
    const method = body?.method;
    const upstream = UPSTREAMS[name];
    if (!READ_ONLY.has(method)) {
      return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not allowed on this gateway: ${method}` } };
    }
    // Every method, including eth_chainId, is answered by the upstream node. eth_chainId used to be answered
    // locally from this table, which made a chain with no reachable node look alive.
    try {
      const res = await fetch(upstream.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id, method, params: body?.params ?? [] }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (method === 'eth_chainId' && typeof json?.result === 'string' && BigInt(json.result) !== BigInt(upstream.chainId)) {
        this.logger.error(`[${name}] upstream ${upstream.url} reports chain ${BigInt(json.result)}, expected ${upstream.chainId}`);
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32603, message: `Upstream RPC is on chain ${BigInt(json.result)}, expected ${upstream.chainId}` },
        };
      }
      return json;
    } catch (e) {
      this.logger.warn(`[${name}] upstream ${upstream.url} unavailable for ${method}: ${e.message}`);
      return { jsonrpc: '2.0', id, error: { code: -32603, message: `Upstream RPC for chain ${upstream.chainId} is unavailable` } };
    }
  }
}
