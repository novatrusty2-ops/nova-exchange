import { ethers } from "ethers";

const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
];

const ERC20_ABI = [
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)"
];

export interface PoolResult {
  pool: string;
  label?: string;
  token0?: { address: string; symbol: string; reserve: string };
  token1?: { address: string; symbol: string; reserve: string };
  error?: string;
}

export interface PoolInput {
  address: string;
  label?: string;
}

// Reads Uniswap-V2-style pair reserves. Each pool is read independently; a failing pool is reported
// with its error instead of being dropped. `success` is true only when every pool was read.
export async function fetchLivePoolTVL(providerRpcUrl: string, pools: PoolInput[]) {
  const provider = new ethers.JsonRpcProvider(providerRpcUrl, undefined, { staticNetwork: true });
  const network = await provider.getNetwork();
  const blockNumber = await provider.getBlockNumber();

  const results: PoolResult[] = await Promise.all(
    pools.map(async ({ address, label }): Promise<PoolResult> => {
      if (!ethers.isAddress(address)) return { pool: address, label, error: "not a valid address" };
      try {
        if ((await provider.getCode(address, blockNumber)) === "0x") {
          return { pool: address, label, error: "no contract at this address on this chain" };
        }
        const pair = new ethers.Contract(address, PAIR_ABI, provider);
        const [reserves, t0, t1] = await Promise.all([
          pair.getReserves({ blockTag: blockNumber }),
          pair.token0(),
          pair.token1(),
        ]);
        const c0 = new ethers.Contract(t0, ERC20_ABI, provider);
        const c1 = new ethers.Contract(t1, ERC20_ABI, provider);
        const [dec0, dec1, sym0, sym1] = await Promise.all([c0.decimals(), c1.decimals(), c0.symbol(), c1.symbol()]);
        return {
          pool: address,
          label,
          token0: { address: t0, symbol: sym0, reserve: ethers.formatUnits(reserves[0], dec0) },
          token1: { address: t1, symbol: sym1, reserve: ethers.formatUnits(reserves[1], dec1) },
        };
      } catch (error: any) {
        return { pool: address, label, error: error.shortMessage || error.message };
      }
    }),
  );

  const failed = results.filter((r) => r.error).length;
  return {
    success: failed === 0,
    chainId: Number(network.chainId),
    rpc: providerRpcUrl,
    blockNumber,
    timestamp: new Date().toISOString(),
    poolsRead: results.length - failed,
    poolsFailed: failed,
    pools: results,
  };
}
