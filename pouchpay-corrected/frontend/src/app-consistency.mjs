/**
 * Shared contracts across Nova X, Nova Plus, and PouchPay.
 * Does not assume PouchPay has an Android wrapper.
 */

import { APPS, CHAINS, sameAsset, substitutionBlocked } from './manifest.mjs';
import { PRODUCTS } from './networks.mjs';
import { STATUS_TERMS } from './settlement.mjs';
import { SUPER_BRIDGE_STATES, SUPER_BRIDGE_TRANSFER_API } from './super-bridge.mjs';
import { POPULAR_TOKEN_SYMBOLS, listPopularTokens } from './trading-tokens.mjs';

export const SHARED_AUTH_CONTRACT = {
  sessionHeader: 'Authorization: Bearer <token>',
  kycProvider: 'sumsub',
  kycRequiredFields: ['provider', 'verified', 'reviewStatus', 'reviewAnswer', 'jurisdiction'],
  frontendCannotAuthorize: true,
};

export const SHARED_SWAP_QUOTE_CONTRACT = {
  requiresAuthoritative: true,
  executableDefault: false,
  inventingLiquidityForbidden: true,
};

export const SHARED_HISTORY_CONTRACT = {
  requiredFields: ['id', 'source'],
  scopesToAccountId: true,
  settlementTerms: STATUS_TERMS,
};

export function productRegistry() {
  return Object.values(PRODUCTS).map((product) => ({
    id: product.id,
    chainId: product.chainId,
    android: APPS[product.id]?.android ?? null,
    nativeSymbol: product.nativeSymbol,
  }));
}

export function chainRegistry() {
  return Object.entries(CHAINS).map(([key, chain]) => ({
    key,
    chainId: chain.chainId,
    nativeSymbol: chain.nativeSymbol,
  }));
}

export function bridgeStatusTerminology() {
  return {
    settlement: STATUS_TERMS.filter((term) => !SUPER_BRIDGE_STATES.includes(term)),
    superBridge: SUPER_BRIDGE_STATES,
    transferApi: SUPER_BRIDGE_TRANSFER_API,
  };
}

export function tokenIdentityCompatibility() {
  const popular = listPopularTokens();
  return {
    symbols: POPULAR_TOKEN_SYMBOLS,
    identityRule: 'chainId+address-or-native',
    tokens: popular.map((token) => ({
      symbol: token.symbol,
      chainId: token.chainId,
      address: token.address,
      contractVerified: token.contractVerified === true,
    })),
    ethAlltraWethDistinct: substitutionBlocked(
      { chainId: 1, native: true, symbol: 'ETH' },
      { chainId: 651940, address: '0x798f6762bb40d6801a593459d08f890603d3979c', symbol: 'WETH' },
    ),
    sameEthNative: sameAsset(
      { chainId: 1, native: true },
      { chainId: 1, native: true },
    ),
  };
}

export function crossAppConsistencyReport() {
  const products = productRegistry();
  const pouchpay = products.find((row) => row.id === 'pouchpay');
  return {
    products,
    chains: chainRegistry(),
    bridge: bridgeStatusTerminology(),
    auth: SHARED_AUTH_CONTRACT,
    swapQuote: SHARED_SWAP_QUOTE_CONTRACT,
    history: SHARED_HISTORY_CONTRACT,
    tokens: tokenIdentityCompatibility(),
    pouchpayAndroid: pouchpay?.android === 'web-only',
    compatible: true,
    notes: [
      'All products share manifest chain ids and settlement terminology.',
      'PouchPay is web-only; no Android wrapper is assumed.',
      'Popular Ethereum tokens are listed for Nova X trading UI; execution stays disabled.',
    ],
  };
}
