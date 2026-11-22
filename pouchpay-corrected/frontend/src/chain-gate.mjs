/** NovaONE 22016 and NRW 33001 stay disabled until a verified backend record matches. */

export function chainReady(expectedChainId, evidence) {
  if (!evidence || evidence.configurationVerified !== true) {
    return { enabled: false, reason: 'chain_unverified' };
  }
  if (Number(evidence.chainId) !== Number(expectedChainId)) {
    return { enabled: false, reason: 'chain_mismatch', expected: Number(expectedChainId), actual: Number(evidence.chainId) };
  }
  return { enabled: true, reason: null, chainId: Number(expectedChainId) };
}
