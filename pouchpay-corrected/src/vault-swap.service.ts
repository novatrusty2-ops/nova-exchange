import { Injectable, Logger, NotImplementedException, ServiceUnavailableException } from '@nestjs/common';
import { ethers } from 'ethers';

// Previously this service returned hard-coded "reserves" ($241B USD, etc.) and a fake 1:1 swap
// that always reported SUCCESS. The originals are kept in backups/simulated-2026-11-16/.
// It now reads the real Alltra (chain 651940) AMM pools on-chain. Nothing here signs or sends transactions.

export interface SwapRequest {
  sourceCurrency: string;
  targetCurrency: string;
  amount: number;
  terminalId: string;
}

interface PoolDef {
  token: string;
  tokenAddress: string;
  pair: string;
  decimals: number;
}

const ALLTRA = {
  chainId: 651940,
  rpc: process.env.ALLTRA_RPC_URL || 'https://alltra.global/rpc',
  wrappedNative: '0x2da2b8f961f161ab6320acb3377e2e844a3c3ce4', // WALL (18 decimals)
};

// ALL/<token> pairs on the Alltra factory 0x3c3ed514691c06c89bf6626b05d22991e8924c93.
const POOLS: PoolDef[] = [
  { token: 'USDC', tokenAddress: '0xa95eed79f84e6a0151eaeb9d441f9ffd50e8e881', pair: '0xb0201c92126c13f5979b3e2c3b7a97a3bd1cec50', decimals: 18 },
  { token: 'USDT', tokenAddress: '0x70a38a336f7f857975452a19b81e87321e262aeb', pair: '0xfca3ea4102f23caae0aed893a2bfb8818523f09f', decimals: 18 },
  { token: '$BUCKS', tokenAddress: '0x90a72d1cc06434938671e3e10c8774870bd40e41', pair: '0xaa9de6e291527cde09492bf9bd180d489c58ddee', decimals: 18 },
  { token: 'ACX', tokenAddress: '0xe86714a357e20bb7af375f2bb18601f5caaedac9', pair: '0x8bfeef0125393ff3860722c064fd1ab840be7f3e', decimals: 18 },
  { token: 'WBTC', tokenAddress: '0x66971b907dfcc6325124af427fc7f97656a68e9c', pair: '0x4b1cce885c4f08308146c13c10d00743c8bc8908', decimals: 8 },
  { token: 'WETH', tokenAddress: '0x798f6762bb40d6801a593459d08f890603d3979c', pair: '0x283afebcaba39d33b578f10f37595c33c3a08e35', decimals: 18 },
  { token: 'WBNB', tokenAddress: '0xfe6e0aed4ca571bfbf3c3ae7bf01fca40b4716d3', pair: '0xff1ac48e6cb456269d3cdc440aecd55756fbe35e', decimals: 18 },
  { token: 'WTRX', tokenAddress: '0xaa7d8c0b6119148de1456ec0025f9a7b2dd41a4f', pair: '0x1d546d57cd24bdaa34af34056029be6a35653410', decimals: 18 },
];

const PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
];

const CACHE_MS = 30_000;
// The Alltra RPC is occasionally slow (seconds) or times out. Each read gets RPC_TIMEOUT_MS and one retry;
// if both fail, the last successful read is served for up to STALE_MAX_MS, explicitly marked STALE.
const RPC_TIMEOUT_MS = Number(process.env.ALLTRA_RPC_TIMEOUT_MS) || 8_000;
const STALE_MAX_MS = Number(process.env.ALLTRA_STALE_MAX_MS) || 10 * 60_000;
const RETRY_DELAY_MS = 1_000;

function makeProvider() {
  const request = new ethers.FetchRequest(ALLTRA.rpc);
  request.timeout = RPC_TIMEOUT_MS;
  return new ethers.JsonRpcProvider(request, ALLTRA.chainId, { staticNetwork: true });
}

@Injectable()
export class VaultSwapService {
  private readonly logger = new Logger(VaultSwapService.name);
  private readonly provider = makeProvider();
  private cache: { at: number; data: any } | null = null;

  public async getVaultReserves() {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.data;
    let lastError: Error;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const data = await this.readReserves();
        this.cache = { at: Date.now(), data };
        return data;
      } catch (e) {
        lastError = e;
        this.logger.warn(`Alltra reserve read attempt ${attempt} failed: ${e.message}`);
        if (attempt === 1) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }

    const ageMs = this.cache ? Date.now() - this.cache.at : Infinity;
    if (this.cache && ageMs <= STALE_MAX_MS) {
      const ageS = Math.round(ageMs / 1000);
      this.logger.warn(`Serving Alltra reserves from ${ageS}s ago (RPC unavailable)`);
      return {
        ...this.cache.data,
        status: 'STALE',
        staleSeconds: ageS,
        warnings: [...this.cache.data.warnings, `Alltra RPC unavailable; showing reserves read ${ageS}s ago (block ${this.cache.data.blockNumber}).`],
      };
    }
    this.logger.error(`Alltra reserve read failed: ${lastError.message}`);
    throw new ServiceUnavailableException({ status: 'UNAVAILABLE', reason: 'Could not read Alltra pools on-chain' });
  }

  private async readReserves() {
    {
      const block = await this.provider.getBlock('latest');
      const pools = await Promise.all(POOLS.map((p) => this.readPool(p, block.number)));

      const allUsd = (sym: string) => {
        const pool = pools.find((x) => x.token === sym);
        return pool && pool.allReserve > 0 ? pool.tokenReserve / pool.allReserve : null;
      };
      const viaUsdc = allUsd('USDC');
      const viaUsdt = allUsd('USDT');
      const spreadPct = viaUsdc && viaUsdt ? (Math.abs(viaUsdt - viaUsdc) / Math.min(viaUsdc, viaUsdt)) * 100 : null;

      const data = {
        source: 'alltra-onchain',
        chainId: ALLTRA.chainId,
        blockNumber: block.number,
        blockTimestamp: block.timestamp,
        allPriceUsd: { viaUSDC: viaUsdc, viaUSDT: viaUsdt, spreadPercent: spreadPct },
        pools: pools.map((p) => ({
          token: p.token,
          pair: p.pair,
          tokenReserve: p.tokenReserve,
          allReserve: p.allReserve,
          allPerToken: p.tokenReserve > 0 ? p.allReserve / p.tokenReserve : null,
        })),
        warnings: [
          ...(spreadPct !== null && spreadPct > 10
            ? [`ALL price differs ${spreadPct.toFixed(0)}% between the USDC and USDT pools (pools are out of balance).`]
            : []),
          ...pools.filter((p) => p.token === 'USDT' && p.tokenReserve < 10_000).map((p) => `USDT pool is shallow (${p.tokenReserve.toFixed(2)} USDT).`),
        ],
        status: 'LIVE',
        timestamp: new Date().toISOString(),
      };
      return data;
    }
  }

  private async readPool(p: PoolDef, blockTag: number) {
    const pair = new ethers.Contract(p.pair, PAIR_ABI, this.provider);
    const [[r0, r1], token0] = await Promise.all([pair.getReserves({ blockTag }), pair.token0({ blockTag })]);
    const tokenIs0 = token0.toLowerCase() === p.tokenAddress;
    const tokenRaw = tokenIs0 ? r0 : r1;
    const allRaw = tokenIs0 ? r1 : r0;
    return {
      ...p,
      tokenReserve: Number(ethers.formatUnits(tokenRaw, p.decimals)),
      allReserve: Number(ethers.formatUnits(allRaw, 18)),
    };
  }

  public async executeLiquiditySwap(request: SwapRequest): Promise<any> {
    this.logger.warn(`Rejected custodial swap request ${request?.amount} ${request?.sourceCurrency} -> ${request?.targetCurrency}`);
    throw new NotImplementedException({
      status: 'NOT_SUPPORTED',
      reason:
        'This backend does not execute swaps. Real swaps are signed by the user in Nova X / Nova Plus (/novax/, /novaplus/: /api/v1/amm/quote then /api/v1/swap/build-tx).',
    });
  }
}
