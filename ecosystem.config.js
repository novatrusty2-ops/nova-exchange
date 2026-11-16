// PM2 config for everything that runs on this PC. Start or apply changes with:
//   pm2 startOrReload ecosystem.config.js && pm2 save
// Restart a single app with `pm2 restart <name>`. Avoid `pm2 delete all`.
//
// Nova X / Nova Plus (and their oracles) are defined in ~/nova-production-ecosystem and included below
// when that folder exists, so starting from this file never drops them.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PCORR = path.join(ROOT, 'pouchpay-corrected');
const NOVA_APPS = path.join(process.env.HOME || '', 'nova-production-ecosystem', 'ecosystem.nova-apps.config.cjs');

const apps = [
  {
    // NestJS API on :3000. cwd is the repo root so it loads the root .env.
    name: 'pouchpay-backend',
    cwd: ROOT,
    script: path.join(PCORR, 'dist', 'main.js'),
    instances: 2,
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 3000 },
    max_memory_restart: '500M',
  },
  {
    // Ethereum mainnet balance check of the app wallet (ETH + USDT).
    name: 'nova-balance-monitor',
    cwd: ROOT,
    script: path.join(ROOT, 'check-deposits.js'),
  },
  {
    // Polls GET /reserves/status every 60 s and logs reachability + `verified`.
    name: 'nova-bank-monitor',
    cwd: PCORR,
    script: path.join(PCORR, 'bank-health-check.js'),
  },
  {
    // Inbound USDT transfers to the app wallet -> Telegram alert.
    name: 'nova-deposit-watcher',
    cwd: ROOT,
    script: path.join(ROOT, 'deposit-watcher.mjs'),
  },
  {
    // Report-only Alltra pool health monitor (reads /vault/reserves; never moves funds).
    name: 'nova-rebalance-engine',
    cwd: ROOT,
    script: path.join(ROOT, 'rebalance-engine.js'),
  },
  {
    // Throwaway local Hardhat chain on :3001 (chain 31337). State is lost on restart.
    name: 'local-evm-node',
    cwd: path.join(PCORR, 'nova-contracts-engine'),
    script: 'npx',
    args: 'hardhat node --port 3001 --hostname 127.0.0.1',
    interpreter: 'none',
  },
];

if (fs.existsSync(NOVA_APPS)) apps.push(...require(NOVA_APPS).apps);

module.exports = { apps };
