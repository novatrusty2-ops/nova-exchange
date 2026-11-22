/**
 * Popular-token registry for Nova X trading surfaces.
 * Identity is exact chainId + contract address (or native). Symbols are labels only.
 * HHE3 has no verified historical contract address and stays unsupported.
 */

export const POPULAR_TOKEN_SYMBOLS = [
  'ETH',
  'USDC',
  'USDT',
  'DAI',
  'WBTC',
  'UNI',
  'LINK',
  'AAVE',
  'HHE3',
];

/** Ethereum mainnet catalog addresses (exact). */
export const ETHEREUM_POPULAR_TOKENS = [
  {
    id: 'eth-native',
    symbol: 'ETH',
    name: 'Ether',
    chainId: 1,
    address: null,
    native: true,
    decimals: 18,
    kind: 'native',
    supported: true,
    contractVerified: true,
  },
  {
    id: 'usdc-eth',
    symbol: 'USDC',
    name: 'USD Coin',
    chainId: 1,
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    native: false,
    decimals: 6,
    kind: 'stable',
    supported: true,
    contractVerified: true,
    pegVerified: false,
  },
  {
    id: 'usdt-eth',
    symbol: 'USDT',
    name: 'Tether USD',
    chainId: 1,
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    native: false,
    decimals: 6,
    kind: 'stable',
    supported: true,
    contractVerified: true,
    pegVerified: false,
  },
  {
    id: 'dai-eth',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    chainId: 1,
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    native: false,
    decimals: 18,
    kind: 'stable',
    supported: true,
    contractVerified: true,
    pegVerified: false,
  },
  {
    id: 'wbtc-eth',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    chainId: 1,
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    native: false,
    decimals: 8,
    kind: 'wrapped',
    supported: true,
    contractVerified: true,
    canonicalSymbol: null,
  },
  {
    id: 'uni-eth',
    symbol: 'UNI',
    name: 'Uniswap',
    chainId: 1,
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    native: false,
    decimals: 18,
    kind: 'catalog',
    supported: true,
    contractVerified: true,
  },
  {
    id: 'link-eth',
    symbol: 'LINK',
    name: 'Chainlink',
    chainId: 1,
    address: '0x514910771af9ca656af840dff83e8264ecf986ca',
    native: false,
    decimals: 18,
    kind: 'catalog',
    supported: true,
    contractVerified: true,
  },
  {
    id: 'aave-eth',
    symbol: 'AAVE',
    name: 'Aave',
    chainId: 1,
    address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    native: false,
    decimals: 18,
    kind: 'catalog',
    supported: true,
    contractVerified: true,
  },
  {
    id: 'hhe3-missing',
    symbol: 'HHE3',
    name: 'HHE3',
    chainId: null,
    address: null,
    native: false,
    decimals: null,
    kind: 'catalog',
    supported: false,
    contractVerified: false,
    unsupportedReason: 'missing_contract_address',
  },
];

export function listPopularTokens() {
  return ETHEREUM_POPULAR_TOKENS.map((token) => ({ ...token }));
}

export function popularTokenBySymbol(symbol) {
  const key = String(symbol || '').toUpperCase();
  return ETHEREUM_POPULAR_TOKENS.find((token) => token.symbol === key) || null;
}

export function requireExactTokenIdentity(token) {
  if (!token) {
    return { ok: false, reason: 'missing_token', identity: null };
  }
  if (token.symbol === 'HHE3' || token.contractVerified !== true) {
    return {
      ok: false,
      reason: token.unsupportedReason || 'missing_contract_address',
      identity: null,
    };
  }
  if (!Number.isFinite(Number(token.chainId))) {
    return { ok: false, reason: 'missing_chain_id', identity: null };
  }
  if (token.native === true) {
    return {
      ok: true,
      reason: null,
      identity: { chainId: Number(token.chainId), address: null, native: true, symbol: token.symbol },
    };
  }
  const address = typeof token.address === 'string' ? token.address.toLowerCase() : '';
  if (!/^0x[0-9a-f]{40}$/.test(address)) {
    return { ok: false, reason: 'missing_contract_address', identity: null };
  }
  return {
    ok: true,
    reason: null,
    identity: { chainId: Number(token.chainId), address, native: false, symbol: token.symbol },
  };
}

export function tradingNetworks() {
  return [
    { id: 'ethereum', chainId: 1, label: 'Ethereum', selectable: true },
    { id: 'nova-one', chainId: 22016, label: 'NovaONE', selectable: true, configurationVerified: false },
    { id: 'nrw-world', chainId: 33001, label: 'Nova World', selectable: true, configurationVerified: false },
    { id: 'alltra-mainnet', chainId: 651940, label: 'ALLTRA', selectable: true },
  ];
}
