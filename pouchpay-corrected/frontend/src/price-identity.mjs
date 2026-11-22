/** Asset identity is chain id plus contract address. Symbols are labels only. */

export const ALLTRA_CHAIN_ID = 651940;
export const ALLTRA_WETH_ADDRESS = '0x798f6762bb40d6801a593459d08f890603d3979c';
export const ALLTRA_WETH_NAME = 'Wrapped ALL (legacy WETH)';
const BLOCKED = new Set(['0x980dad39b3de421d9299e37e430b21b9e02429b6']);

export function tokenIdentity(chainId, address) {
  return { chainId: Number(chainId), address: address ? String(address).toLowerCase() : null };
}

export function isBlockedToken(chainId, address) {
  return Number(chainId) === ALLTRA_CHAIN_ID && BLOCKED.has(String(address || '').toLowerCase());
}

export function assetClass(token) {
  if (isBlockedToken(token?.chainId, token?.address)) return 'blocked';
  if (isAlltraWeth(token)) return 'alltra-weth';
  if (Number(token?.chainId) === 1 && token?.native === true) return 'native-eth';
  if (token?.kind === 'wrapped') return 'wrapped';
  if (token?.kind === 'custom') return 'custom';
  if (token?.kind === 'native') return 'native';
  return token?.kind || 'unknown';
}

export function isAlltraWeth(token) {
  return Number(token?.chainId) === ALLTRA_CHAIN_ID
    && String(token?.address || '').toLowerCase() === ALLTRA_WETH_ADDRESS;
}

export function displayName(token) {
  if (isAlltraWeth(token)) return ALLTRA_WETH_NAME;
  if (token?.name) return token.name;
  return token?.symbol || 'Native';
}

export function presentPrice(row) {
  const unavailable = { text: 'Unpriced', badge: 'Unpriced', usd: null, includeInTotal: false };
  if (!row || row.priceDisplay === 'Unpriced' || row.priceBasis === 'unpriced' || row.priceDisplay == null) {
    return unavailable;
  }
  if (row.priceDisplay === 'assumed_peg' || row.priceBasis === 'assumed_peg') {
    return {
      text: row.priceLabel || 'Assumed peg (issuer claim; reserves not verified)',
      badge: 'assumed_peg',
      usd: null,
      includeInTotal: false,
    };
  }
  if (row.priceDisplay !== 'verified' || row.priceVerified !== true || row.priceBasis !== 'priced') {
    return {
      text: row.priceLabel || 'Indicative price',
      badge: row.priceDisplay || 'indicative',
      usd: null,
      includeInTotal: false,
    };
  }
  if (!Number.isFinite(row.current_price)) return unavailable;
  const balance = Number.isFinite(row.balance) ? row.balance : 0;
  const include = row.countsTowardTotals === true;
  return {
    text: formatUsd(row.current_price),
    badge: 'verified',
    usd: include ? row.current_price * balance : null,
    includeInTotal: include,
  };
}

export function portfolioTotal(rows) {
  const included = (rows || []).filter((row) => row.includeInTotal === true && Number.isFinite(row.usd));
  if (!included.length) return { label: 'not available', usd: null };
  const usd = included.reduce((sum, row) => sum + row.usd, 0);
  return { label: formatUsd(usd), usd };
}

function formatUsd(value) {
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
