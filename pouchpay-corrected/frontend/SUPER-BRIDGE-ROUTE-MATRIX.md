# Super Bridge route matrix

Source of truth for this frontend: `src/super-bridge.mjs` (recovered from historical `super-bridge-evm.ts`; `available: false` preserved).

| id | source → dest | available | frontend state |
|---|---|---|---|
| superbridge-ethereum | 1 → 22016 | no | route_unavailable |
| superbridge-bsc | 56 → 22016 | no | route_unavailable |
| superbridge-polygon | 137 → 22016 | no | route_unavailable |
| superbridge-arbitrum | 42161 → 22016 | no | route_unavailable |
| superbridge-base | 8453 → 22016 | no | route_unavailable |
| superbridge-optimism | 10 → 22016 | no | route_unavailable |
| superbridge-avalanche | 43114 → 22016 | no | route_unavailable |
| superbridge-tron | 728126428 → 22016 | no | route_unavailable |
| novaone-nrw-world | 22016 → 33001 | no | route_unavailable |
| superbridge-alltra | 651940 → 22016 | no | route_unavailable |
| novaone-alltra | 22016 → 651940 | no | route_unavailable |

Transfer API: `POST /api/v1/chains/super-bridge/transfer` — blocked in the browser client. Ambiguous timeouts never auto-retry.
