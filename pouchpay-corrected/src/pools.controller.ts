import { Controller, Get } from '@nestjs/common';
import { fetchLivePoolTVL, PoolInput } from './services/reserve-fetcher';

// Alltra Smart Chain (651940) mainnet RPC.
const DEFAULT_RPC = 'https://alltra.global/rpc';

// The 8 live ALL/<token> pairs on the Alltra factory 0x3c3ed514691c06c89bf6626b05d22991e8924c93
// (same pairs VaultSwapService reads; each verified to hold pair contract code).
const DEFAULT_POOLS: PoolInput[] = [
  { label: 'ALL/USDC', address: '0xb0201c92126c13f5979b3e2c3b7a97a3bd1cec50' },
  { label: 'ALL/USDT', address: '0xfca3ea4102f23caae0aed893a2bfb8818523f09f' },
  { label: 'ALL/$BUCKS', address: '0xaa9de6e291527cde09492bf9bd180d489c58ddee' },
  { label: 'ALL/ACX', address: '0x8bfeef0125393ff3860722c064fd1ab840be7f3e' },
  { label: 'ALL/WBTC', address: '0x4b1cce885c4f08308146c13c10d00743c8bc8908' },
  { label: 'ALL/WETH', address: '0x283afebcaba39d33b578f10f37595c33c3a08e35' },
  { label: 'ALL/WBNB', address: '0xff1ac48e6cb456269d3cdc440aecd55756fbe35e' },
  { label: 'ALL/WTRX', address: '0x1d546d57cd24bdaa34af34056029be6a35653410' },
];

// Overrides (e.g. to point at a local chain):
//   EVM_RPC_URL                                         RPC to read from
//   POOL_ADDRESSES=0xabc...,0xdef...                    replaces the whole pool list
//   USDC_POOL_ADDRESS / USDT_POOL_ADDRESS / ALLTRA_POOL_ADDRESS   replace the list when any is set
// Invalid or non-contract overrides are reported per pool, never silently dropped.
export function resolvePools(env: NodeJS.ProcessEnv = process.env): PoolInput[] {
  if (env.POOL_ADDRESSES?.trim()) {
    return env.POOL_ADDRESSES.split(',').map((a) => a.trim()).filter(Boolean).map((address) => ({ address }));
  }
  const legacy = (['USDC_POOL_ADDRESS', 'USDT_POOL_ADDRESS', 'ALLTRA_POOL_ADDRESS'] as const)
    .filter((k) => env[k]?.trim())
    .map((k) => ({ label: k, address: env[k].trim() }));
  return legacy.length ? legacy : DEFAULT_POOLS;
}

@Controller('api/v1/pools')
export class PoolsController {
  @Get('tvl')
  async getPoolsTVL() {
    const rpcUrl = process.env.EVM_RPC_URL || DEFAULT_RPC;
    try {
      return await fetchLivePoolTVL(rpcUrl, resolvePools());
    } catch (error: any) {
      // The RPC itself could not be reached (no chain ID / block number).
      return { success: false, rpc: rpcUrl, error: error.shortMessage || error.message, pools: [] };
    }
  }
}
