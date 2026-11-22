/**
 * NOVA Super Bridge — frontend contract recovered from historical wallet source.
 * EVM routes historically marked unavailable (no deployed contracts / no relayer)
 * stay disabled. Transfer POSTs are never auto-retried from this module.
 */

export const SUPER_BRIDGE_TRANSFER_PATH = '/chains/super-bridge/transfer';
export const SUPER_BRIDGE_TRANSFER_API = '/api/v1/chains/super-bridge/transfer';
export const SUPER_BRIDGE_STATUS_API = '/api/v1/chains/super-bridge';

export const SUPER_BRIDGE_TARGETS = [
  'nova-one',
  'nrw-world',
  'alltra-mainnet',
  'ethereum',
  'bsc',
  'tron',
  'bitcoin',
];

/** Lifecycle states required by the Super Bridge frontend contract. */
export const SUPER_BRIDGE_STATES = [
  'unsupported_route',
  'route_unavailable',
  'quote_available',
  'awaiting_user_authorization',
  'submitted',
  'confirming',
  'confirmed',
  'failed',
  'requires_reconciliation',
];

export const SUPER_BRIDGE_HUB_CHAIN_ID = 22016;
export const SUPER_BRIDGE_SETTLEMENT_CHAIN_ID = 33001;
export const ALLTRA_MAINNET_CHAIN_ID = 651940;

/**
 * Historical SUPER_BRIDGE_EVM_ROUTES (available: false preserved).
 * Do not flip available without backend evidence that both ends are deployed
 * and a relayer is running.
 */
export const SUPER_BRIDGE_EVM_ROUTES = [
  {
    id: 'superbridge-ethereum',
    label: 'Ethereum → NovaONE',
    sourceChainId: 1,
    sourceChainName: 'Ethereum',
    destChainId: SUPER_BRIDGE_HUB_CHAIN_ID,
    destChainName: 'NovaONE',
    sourceBridgeAddress: '0xa514D70f136229f5279c037f6292A78FbEe6bbDB',
    sourceTokenAddress: '0xa9e13CC09a6B8A551A87c244CcDea9a563491b66',
    wrappedBridgeAddress: '0x227a6f3EEF2df576bc127dF0326D1F4B6f0ce9Cb',
    available: false,
    unavailableReason: 'NovaONE wrapped token 0x227a… has no code (chain reset) and no relayer runs.',
  },
  {
    id: 'superbridge-bsc',
    label: 'BNB Chain → NovaONE',
    sourceChainId: 56,
    sourceChainName: 'BNB Smart Chain',
    destChainId: SUPER_BRIDGE_HUB_CHAIN_ID,
    destChainName: 'NovaONE',
    sourceBridgeAddress: '0x3cfB3bAE022039D667a15458060BF46449174ffb',
    sourceTokenAddress: '0xa514D70f136229f5279c037f6292A78FbEe6bbDB',
    wrappedBridgeAddress: '0x227a6f3EEF2df576bc127dF0326D1F4B6f0ce9Cb',
    available: false,
    unavailableReason: 'NovaONE wrapped token 0x227a… has no code (chain reset) and no relayer runs.',
  },
  {
    id: 'superbridge-polygon',
    label: 'Polygon → NovaONE',
    sourceChainId: 137,
    sourceChainName: 'Polygon',
    destChainId: SUPER_BRIDGE_HUB_CHAIN_ID,
    destChainName: 'NovaONE',
    available: false,
    unavailableReason: 'No bridge contracts are deployed for this route.',
  },
  {
    id: 'superbridge-arbitrum',
    label: 'Arbitrum → NovaONE',
    sourceChainId: 42161,
    sourceChainName: 'Arbitrum One',
    destChainId: SUPER_BRIDGE_HUB_CHAIN_ID,
    destChainName: 'NovaONE',
    available: false,
    unavailableReason: 'No bridge contracts are deployed for this route.',
  },
  {
    id: 'superbridge-base',
    label: 'Base → NovaONE',
    sourceChainId: 8453,
    sourceChainName: 'Base',
    destChainId: SUPER_BRIDGE_HUB_CHAIN_ID,
    destChainName: 'NovaONE',
    available: false,
    unavailableReason: 'No bridge contracts are deployed for this route.',
  },
  {
    id: 'superbridge-optimism',
    label: 'Optimism → NovaONE',
    sourceChainId: 10,
    sourceChainName: 'Optimism',
    destChainId: SUPER_BRIDGE_HUB_CHAIN_ID,
    destChainName: 'NovaONE',
    available: false,
    unavailableReason: 'No bridge contracts are deployed for this route.',
  },
  {
    id: 'superbridge-avalanche',
    label: 'Avalanche → NovaONE',
    sourceChainId: 43114,
    sourceChainName: 'Avalanche',
    destChainId: SUPER_BRIDGE_HUB_CHAIN_ID,
    destChainName: 'NovaONE',
    available: false,
    unavailableReason: 'No bridge contracts are deployed for this route.',
  },
  {
    id: 'superbridge-tron',
    label: 'TRON → NovaONE',
    sourceChainId: 728126428,
    sourceChainName: 'TRON',
    destChainId: SUPER_BRIDGE_HUB_CHAIN_ID,
    destChainName: 'NovaONE',
    available: false,
    unavailableReason: 'No bridge contracts are deployed for this route.',
  },
  {
    id: 'novaone-nrw-world',
    label: 'NovaONE → Nova World',
    sourceChainId: SUPER_BRIDGE_HUB_CHAIN_ID,
    sourceChainName: 'NovaONE',
    destChainId: SUPER_BRIDGE_SETTLEMENT_CHAIN_ID,
    destChainName: 'Nova World',
    wrappedBridgeAddress: '0xf2811B06807acF321FF9056dF668a621772999d8',
    available: false,
    unavailableReason: 'No bridge contracts are deployed for this route.',
  },
  {
    id: 'superbridge-alltra',
    label: 'ALLTRA → NovaONE',
    sourceChainId: ALLTRA_MAINNET_CHAIN_ID,
    sourceChainName: 'ALLTRA Mainnet',
    destChainId: SUPER_BRIDGE_HUB_CHAIN_ID,
    destChainName: 'NovaONE',
    available: false,
    unavailableReason: 'No bridge contracts are deployed for this route.',
  },
  {
    id: 'novaone-alltra',
    label: 'NovaONE → ALLTRA',
    sourceChainId: SUPER_BRIDGE_HUB_CHAIN_ID,
    sourceChainName: 'NovaONE',
    destChainId: ALLTRA_MAINNET_CHAIN_ID,
    destChainName: 'ALLTRA Mainnet',
    available: false,
    unavailableReason: 'No bridge contracts are deployed for this route.',
  },
];

export function availableSuperBridgeRoutes() {
  return SUPER_BRIDGE_EVM_ROUTES.filter((route) => route.available === true);
}

export function findSuperBridgeRoute(sourceChainId, destChainId) {
  return SUPER_BRIDGE_EVM_ROUTES.find(
    (route) => Number(route.sourceChainId) === Number(sourceChainId)
      && Number(route.destChainId) === Number(destChainId),
  ) || null;
}

export function evaluateSuperBridgeRoute({ sourceChainId, destChainId, backendRouteAvailable = null } = {}) {
  if (sourceChainId == null || destChainId == null || Number(sourceChainId) === Number(destChainId)) {
    return {
      state: 'unsupported_route',
      executable: false,
      route: null,
      reason: 'unsupported_route',
    };
  }
  const route = findSuperBridgeRoute(sourceChainId, destChainId);
  if (!route) {
    return {
      state: 'unsupported_route',
      executable: false,
      route: null,
      reason: 'unsupported_route',
    };
  }
  if (route.available !== true) {
    return {
      state: 'route_unavailable',
      executable: false,
      route,
      reason: route.unavailableReason || 'route_unavailable',
    };
  }
  if (backendRouteAvailable === false) {
    return {
      state: 'route_unavailable',
      executable: false,
      route,
      reason: 'backend_route_unavailable',
    };
  }
  return {
    state: 'quote_available',
    executable: false,
    route,
    reason: null,
  };
}

/**
 * Map authoritative backend transfer payloads into Super Bridge lifecycle states.
 * Timeouts and ambiguous outcomes never become confirmed.
 */
export function interpretSuperBridgeTransfer(payload, { httpStatus = 200, clientState = null } = {}) {
  if (clientState === 'timeout' || clientState === 'failure' || clientState === 'unavailable' || clientState === 'maintenance') {
    return {
      state: 'requires_reconciliation',
      completed: false,
      autoRetry: false,
      reason: clientState,
      txHash: null,
    };
  }
  if (clientState === 'blocked' || clientState === 'duplicate') {
    return {
      state: clientState === 'duplicate' ? 'requires_reconciliation' : 'failed',
      completed: false,
      autoRetry: false,
      reason: clientState,
      txHash: null,
    };
  }
  if (httpStatus === 401 || httpStatus === 403) {
    return {
      state: 'awaiting_user_authorization',
      completed: false,
      autoRetry: false,
      reason: 'authorization_required',
      txHash: null,
    };
  }
  if (httpStatus === 404 || httpStatus === 501) {
    return {
      state: 'unsupported_route',
      completed: false,
      autoRetry: false,
      reason: `http_${httpStatus}`,
      txHash: null,
    };
  }
  if (httpStatus === 503 || httpStatus === 0) {
    return {
      state: 'requires_reconciliation',
      completed: false,
      autoRetry: false,
      reason: httpStatus === 0 ? 'network' : 'unavailable',
      txHash: null,
    };
  }
  if (!payload || typeof payload !== 'object') {
    return {
      state: 'requires_reconciliation',
      completed: false,
      autoRetry: false,
      reason: 'empty_payload',
      txHash: null,
    };
  }

  const status = String(payload.status || payload.transferStatus || payload.state || '').toLowerCase();
  const txHash = typeof payload.txHash === 'string' && /^0x[0-9a-fA-F]{64}$/.test(payload.txHash)
    ? payload.txHash
    : null;

  if (status === 'unsupported' || status === 'unsupported_route') {
    return { state: 'unsupported_route', completed: false, autoRetry: false, reason: status, txHash: null };
  }
  if (status === 'unavailable' || status === 'route_unavailable') {
    return { state: 'route_unavailable', completed: false, autoRetry: false, reason: status, txHash: null };
  }
  if (status === 'quote_available' || status === 'quoted') {
    return { state: 'quote_available', completed: false, autoRetry: false, reason: null, txHash: null };
  }
  if (status === 'awaiting_user_authorization' || status === 'authorization_required' || status === 'pending_auth') {
    return { state: 'awaiting_user_authorization', completed: false, autoRetry: false, reason: status, txHash: null };
  }
  if (status === 'failed' || status === 'rejected' || payload.success === false) {
    return { state: 'failed', completed: false, autoRetry: false, reason: status || 'failed', txHash: null };
  }
  if (status === 'requires_reconciliation' || status === 'ambiguous' || status === 'unknown') {
    return { state: 'requires_reconciliation', completed: false, autoRetry: false, reason: status, txHash: null };
  }
  if (status === 'confirming' || status === 'pending' || status === 'in_flight') {
    return { state: 'confirming', completed: false, autoRetry: false, reason: null, txHash };
  }
  if (status === 'submitted') {
    return { state: 'submitted', completed: false, autoRetry: false, reason: null, txHash };
  }
  if (
    status === 'confirmed'
    && payload.success === true
    && (payload.evidence?.authoritative === true || payload.source === 'Nova Super Bridge')
  ) {
    return { state: 'confirmed', completed: true, autoRetry: false, reason: null, txHash };
  }
  if (status === 'confirmed' || payload.settled === true) {
    return {
      state: 'requires_reconciliation',
      completed: false,
      autoRetry: false,
      reason: 'unauthoritative_confirmation',
      txHash: null,
    };
  }

  return {
    state: 'requires_reconciliation',
    completed: false,
    autoRetry: false,
    reason: 'unrecognized_status',
    txHash: null,
  };
}

/** Build the historical transfer body. Does not send. */
export function buildSuperBridgeTransferBody(params = {}) {
  const currency = typeof params.currency === 'string' ? params.currency.trim().toUpperCase() : '';
  const targetChain = params.targetChain;
  if (!SUPER_BRIDGE_TARGETS.includes(targetChain)) {
    return { ok: false, reason: 'unsupported_route', body: null };
  }
  if (!currency || !params.fromAccountId || !params.amount) {
    return { ok: false, reason: 'invalid_request', body: null };
  }
  return {
    ok: true,
    reason: null,
    body: {
      fromAccountId: params.fromAccountId,
      amount: String(params.amount),
      currency,
      targetChain,
      recipientAddress: params.recipientAddress?.trim() || undefined,
      pin: params.pin,
    },
    path: SUPER_BRIDGE_TRANSFER_API,
  };
}

/** Ambiguous outcomes must not trigger another transfer. */
export function shouldAutoRetrySuperBridge(interpretation) {
  if (!interpretation) return false;
  if (interpretation.autoRetry === true) return false;
  if (interpretation.state === 'requires_reconciliation') return false;
  if (interpretation.state === 'confirming' || interpretation.state === 'submitted') return false;
  return false;
}

export function superBridgeRouteMatrix() {
  return SUPER_BRIDGE_EVM_ROUTES.map((route) => ({
    id: route.id,
    label: route.label,
    sourceChainId: route.sourceChainId,
    destChainId: route.destChainId,
    available: route.available === true,
    state: route.available === true ? 'quote_available' : 'route_unavailable',
    reason: route.available === true ? null : (route.unavailableReason || 'route_unavailable'),
    hasBridgeContracts: Boolean(route.sourceBridgeAddress || route.wrappedBridgeAddress),
  }));
}
