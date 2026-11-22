/** Display money only when a backend quote is verified for that exact asset. */

const REJECTED_SOURCES = new Set([
  'hardcoded',
  'static-oracle',
  'symbol-map',
  'coingecko-symbol',
  'assumed-peg',
  'wrapped-alias',
]);

export const UNPRICED = 'Unpriced';

export function priceLabel(token, quote) {
  if (!token) return { label: UNPRICED, usd: null, reason: 'missing_token' };
  if (token.pegVerified !== true && token.kind === 'stable') {
    if (!quoteMatches(token, quote)) return { label: UNPRICED, usd: null, reason: 'unverified_stable' };
  }
  if (token.kind === 'wrapped' && quote?.canonicalSymbol) {
    return { label: UNPRICED, usd: null, reason: 'wrapped_alias_rejected' };
  }
  if (!quoteMatches(token, quote)) {
    return { label: UNPRICED, usd: null, reason: quote ? 'quote_rejected' : 'no_quote' };
  }
  return { label: formatUsd(quote.priceUsd), usd: quote.priceUsd, reason: 'verified' };
}

export function holdingValue(token, amount, quote) {
  const price = priceLabel(token, quote);
  if (price.usd == null || !Number.isFinite(amount)) {
    return { amountLabel: formatAmount(amount), valueLabel: UNPRICED, usd: null };
  }
  return {
    amountLabel: formatAmount(amount),
    valueLabel: formatUsd(quote.priceUsd * amount),
    usd: quote.priceUsd * amount,
  };
}

function quoteMatches(token, quote) {
  if (!quote || quote.verified !== true) return false;
  if (REJECTED_SOURCES.has(quote.source)) return false;
  if (quote.source !== 'backend-oracle') return false;
  if (Number(quote.chainId) !== Number(token.chainId)) return false;
  if (String(quote.assetId) !== String(token.id)) return false;
  if (quote.address && token.address && quote.address.toLowerCase() !== token.address.toLowerCase()) return false;
  if (typeof quote.priceUsd !== 'number' || !Number.isFinite(quote.priceUsd) || quote.priceUsd < 0) return false;
  if (token.kind === 'wrapped' && quote.mapsCanonicalAsset === true) return false;
  if (token.kind === 'stable' && token.pegVerified !== true && quote.assumedPeg === true) return false;
  return true;
}

function formatUsd(value) {
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAmount(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '—';
  return String(amount);
}
