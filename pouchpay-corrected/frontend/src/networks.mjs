/**
 * Per-product network config. RPC gateways are not shared across products.
 * Chain ids match pouchpay-corrected RpcController / control/app.json.
 * Lab chain 922016 is never substituted for Nova X 22016.
 */

export const PRODUCTS = {
  pouchpay: {
    id: 'pouchpay',
    name: 'PouchPay Alltra',
    chainId: 651940,
    chainName: 'Alltra',
    rpc: 'https://mainnet-rpc.alltra.global',
    rpcGateway: null,
    nativeSymbol: 'ALL',
    accountReference: '6572',
  },
  'nova-plus': {
    id: 'nova-plus',
    name: 'Nova Plus',
    chainId: 33001,
    chainName: 'Nova Plus',
    rpc: null,
    rpcGateway: '/rpc/nova-plus',
    nativeSymbol: null,
    accountReference: null,
  },
  'nova-x': {
    id: 'nova-x',
    name: 'Nova X',
    chainId: 22016,
    chainName: 'Nova X',
    rpc: null,
    rpcGateway: '/rpc/nova-x',
    nativeSymbol: null,
    accountReference: null,
  },
};

export const READ_ONLY_RPC_METHODS = new Set([
  'eth_chainId',
  'net_version',
  'eth_blockNumber',
  'eth_getBalance',
  'eth_call',
  'eth_getLogs',
  'eth_getBlockByNumber',
  'eth_getBlockByHash',
  'eth_getTransactionByHash',
  'eth_getTransactionReceipt',
  'eth_getCode',
  'eth_gasPrice',
  'eth_estimateGas',
  'eth_getTransactionCount',
  'eth_feeHistory',
]);

export function getProduct(productId) {
  const product = PRODUCTS[productId];
  if (!product) throw new Error(`Unknown product: ${productId}`);
  return product;
}

export function assertRpcIsolation(productId, chainId) {
  const product = getProduct(productId);
  if (Number(chainId) !== product.chainId) {
    return { ok: false, reason: 'chain_mismatch', expected: product.chainId, actual: Number(chainId) };
  }
  if (Number(chainId) === 922016) {
    return { ok: false, reason: 'lab_chain_rejected' };
  }
  return { ok: true, chainId: product.chainId };
}
