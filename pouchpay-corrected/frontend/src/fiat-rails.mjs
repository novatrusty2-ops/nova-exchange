/** Public fiat-rail capability view. Codex PRs 997 and 998. */

const PROVIDERS = new Set(['wise', 'revolut']);
const CURRENCIES = new Set(['USD', 'EUR']);

function readCapabilities(input, role) {
  if (!Array.isArray(input)) throw new Error('Invalid fiat rail catalog');
  return input.map((row) => {
    if (!row || typeof row.id !== 'string' || !PROVIDERS.has(row.provider) || !CURRENCIES.has(row.currency)
      || typeof row.country !== 'string' || !Array.isArray(row.roles) || !row.roles.includes(role)
      || !Array.isArray(row.rails) || row.rails.some((rail) => typeof rail !== 'string')) {
      throw new Error('Invalid fiat rail capability');
    }
    return {
      id: row.id,
      provider: row.provider,
      currency: row.currency,
      roles: [role],
      rails: [...row.rails],
      country: row.country,
    };
  });
}

export function readFiatRailCatalog(input) {
  if (!input || typeof input !== 'object' || !('buyCrypto' in input) || !('sellCrypto' in input)) {
    throw new Error('Invalid fiat rail catalog');
  }
  return {
    buyCrypto: readCapabilities(input.buyCrypto, 'buy_crypto'),
    sellCrypto: readCapabilities(input.sellCrypto, 'sell_crypto'),
  };
}

export function fiatRailView(result) {
  try {
    if (!result?.ok) return { state: 'unavailable', buyCrypto: [], sellCrypto: [] };
    return { state: 'ready', ...readFiatRailCatalog(result.data) };
  } catch {
    return { state: 'unavailable', buyCrypto: [], sellCrypto: [] };
  }
}
