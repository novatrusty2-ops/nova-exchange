/**
 * Supported assets copied from control/app.json (Alltra) plus explicit
 * unsupported classes. No balances and no USD prices live here.
 */

import { getProduct } from './networks.mjs';

export const TOKEN_KINDS = ['catalog', 'smart', 'native', 'rapid', 'stable', 'wrapped', 'custom'];

const ALLTRA = [
  { id: 'ALL', symbol: 'ALL', kind: 'native', classes: ['native', 'smart'], chainFamily: 'smart', decimals: 18, address: '0x0000000000000000000000000000000000000000', native: true, pegVerified: false },
  { id: '$BUCKS', symbol: '$BUCKS', kind: 'catalog', decimals: 18, address: '0x90a72d1cc06434938671e3e10c8774870bd40e41', pegVerified: false },
  { id: 'ACX', symbol: 'ACX', kind: 'catalog', decimals: 18, address: '0xe86714a357e20bb7af375f2bb18601f5caaedac9', pegVerified: false },
  { id: 'USDC', symbol: 'USDC', kind: 'stable', decimals: 18, address: '0xa95eed79f84e6a0151eaeb9d441f9ffd50e8e881', pegVerified: false, label: 'Alltra catalog USDC' },
  { id: 'USDT-NATIVE', symbol: 'USDT', kind: 'stable', decimals: 18, address: '0x70a38a336f7f857975452a19b81e87321e262aeb', pegVerified: false, label: 'Alltra catalog USDT' },
  { id: 'WBTC', symbol: 'WBTC', kind: 'wrapped', decimals: 8, address: '0x66971b907dfcc6325124af427fc7f97656a68e9c', pegVerified: false, canonicalSymbol: null },
  { id: 'WETH', symbol: 'WETH', kind: 'wrapped', decimals: 18, address: '0x798f6762bb40d6801a593459d08f890603d3979c', pegVerified: false, canonicalSymbol: null },
  { id: 'WBNB', symbol: 'WBNB', kind: 'wrapped', decimals: 18, address: '0xfe6e0aed4ca571bfbf3c3ae7bf01fca40b4716d3', pegVerified: false, canonicalSymbol: null },
  { id: 'WTRX', symbol: 'WTRX', kind: 'wrapped', decimals: 18, address: '0xaa7d8c0b6119148de1456ec0025f9a7b2dd41a4f', pegVerified: false, canonicalSymbol: null },
  { id: 'WALL', symbol: 'WALL', kind: 'wrapped', decimals: 18, address: '0x2da2b8f961f161ab6320acb3377e2e844a3c3ce4', pegVerified: false, canonicalSymbol: null },
];

function nativePlaceholder(productId) {
  const product = getProduct(productId);
  return {
    id: 'native',
    symbol: product.nativeSymbol,
    kind: 'native',
    chainFamily: 'smart',
    decimals: 18,
    address: null,
    native: true,
    pegVerified: false,
    productId,
    chainId: product.chainId,
    supported: product.nativeSymbol != null,
  };
}

const BY_PRODUCT = {
  pouchpay: ALLTRA.map((token) => ({
    ...token,
    productId: 'pouchpay',
    chainId: 651940,
    supported: true,
    depositRouteVerified: false,
  })),
  'nova-plus': [nativePlaceholder('nova-plus')],
  'nova-x': [nativePlaceholder('nova-x')],
};

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export function listTokens(productId, customTokens = []) {
  const base = BY_PRODUCT[productId];
  if (!base) throw new Error(`Unknown product: ${productId}`);
  const custom = [];
  for (const token of customTokens) {
    if (!token || !ADDRESS.test(token.address || '')) continue;
    custom.push({
      id: `custom:${token.address.toLowerCase()}`,
      symbol: typeof token.symbol === 'string' && token.symbol.trim() ? token.symbol.trim() : 'CUSTOM',
      kind: 'custom',
      decimals: Number.isInteger(token.decimals) ? token.decimals : 18,
      address: token.address.toLowerCase(),
      pegVerified: false,
      productId,
      chainId: getProduct(productId).chainId,
      supported: false,
    });
  }
  return [...base, ...custom];
}

export function tokensByKind(productId, kind, customTokens = []) {
  if (!TOKEN_KINDS.includes(kind)) return [];
  return listTokens(productId, customTokens).filter((token) => token.kind === kind || token.classes?.includes(kind));
}

/** Rapid-settlement tokens are not in the verified catalog. */
export function rapidTokens() {
  return [];
}
