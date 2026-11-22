/**
 * Canonical application and network manifest for this repository.
 * Chain rows are identifiers only. configurationVerified is not granted here.
 */

export const ZERO = '0x0000000000000000000000000000000000000000';
export const ALLTRA_WETH = '0x798f6762bb40d6801a593459d08f890603d3979c';

export const CHAINS = {
  ethereum: { chainId: 1, nativeSymbol: 'ETH', nativeName: 'Ether' },
  alltra: { chainId: 651940, nativeSymbol: 'ALL', nativeName: 'Alltra' },
  novaone: { chainId: 22016, nativeSymbol: null, nativeName: null, productId: 'nova-x' },
  nrw: { chainId: 33001, nativeSymbol: null, nativeName: null, productId: 'nova-plus' },
};

export const APPS = {
  pouchpay: { id: 'pouchpay', chainKey: 'alltra', android: 'web-only' },
  'nova-plus': { id: 'nova-plus', chainKey: 'nrw', android: 'uk.novabank.pluswallet' },
  'nova-x': { id: 'nova-x', chainKey: 'novaone', android: 'digital.novatrustee.novax' },
};

const ASSETS = [
  { id: 'eth-native', chainId: 1, address: null, native: true, symbol: 'ETH', name: 'Ether' },
  { id: 'all-native', chainId: 651940, address: ZERO, native: true, symbol: 'ALL', name: 'Alltra' },
  { id: 'alltra-weth', chainId: 651940, address: ALLTRA_WETH, native: false, symbol: 'WETH', name: 'Wrapped ALL (legacy WETH)' },
];

export function formatAddress(address) {
  if (address == null || address === '') return null;
  const text = String(address).toLowerCase();
  if (text === ZERO) return ZERO;
  return /^0x[0-9a-f]{40}$/.test(text) ? text : null;
}

export function assetKey(asset) {
  return `${Number(asset?.chainId)}:${asset?.native === true ? 'native' : formatAddress(asset?.address) || 'invalid'}`;
}

export function sameAsset(left, right) {
  if (!left || !right) return false;
  if (Number(left.chainId) !== Number(right.chainId)) return false;
  if (left.native === true || right.native === true) return left.native === true && right.native === true;
  const a = formatAddress(left.address);
  const b = formatAddress(right.address);
  return a != null && a === b;
}

/** Symbol or ticker equality is never enough to treat two assets as one. */
export function substitutionBlocked(left, right) {
  if (sameAsset(left, right)) return false;
  return true;
}

export function knownAsset(chainId, address, native = false) {
  return ASSETS.find((asset) => sameAsset(asset, { chainId, address, native })) || null;
}
