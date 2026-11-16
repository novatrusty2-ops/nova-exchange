import dotenv from 'dotenv';
import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

dotenv.config();

// Configuration
const RPC_URL = process.env.RPC_URL || "http://localhost:3000/rpc/nova-x";
const WATCH_WALLET = "0x05868c29D58d1EC275Cf078356c03F79B1975600";
const USDT_CONTRACT = process.env.USDT_CONTRACT || "0xdac17f958d2ee523a2206206994597c13d831ec7"; // 6 decimals USDT
const USDT_DECIMALS = 6;

// Telegram Alert Credentials (Update with your actual values)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "YOUR_ACTUAL_BOT_TOKEN";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "YOUR_ACTUAL_CHAT_ID";

// How the watcher finds deposits: every POLL_MS it asks the node for USDT Transfer logs to WATCH_WALLET
// in the blocks since the last check (eth_getLogs). It used to keep a filter on the node (contract.on),
// but public RPCs are load-balanced: the filter lived on one backend, later polls hit others that answered
// "filter not found", and ethers kept polling the dead filter, so deposits stopped being detected.
// The last checked block is saved to STATE_FILE, so a restart resumes where it left off.
const POLL_MS = Number(process.env.WATCHER_POLL_MS) || 15_000;
const CONFIRMATIONS = Number(process.env.WATCHER_CONFIRMATIONS) || 3; // stay a few blocks behind the tip (reorgs)
const MAX_RANGE = 500; // blocks per eth_getLogs call; public nodes reject very large ranges
const STATE_FILE = process.env.WATCHER_STATE_FILE || fileURLToPath(new URL('./.deposit-watcher-state.json', import.meta.url));

const provider = new JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const usdtContract = new Contract(USDT_CONTRACT, ERC20_ABI, provider);

async function sendTelegramAlert(message) {
  if (TELEGRAM_BOT_TOKEN === "YOUR_ACTUAL_BOT_TOKEN" || !TELEGRAM_BOT_TOKEN) {
    console.log("[Telegram] Skipped: Bot token not configured.");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown"
      })
    });

    const data = await response.json();
    if (!data.ok) {
      console.error("[Telegram API Error]:", data.description);
    }
  } catch (err) {
    console.error("[Telegram Fetch Failed]:", err.message);
  }
}

function loadLastBlock() {
  try {
    const st = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    if (st.wallet?.toLowerCase() === WATCH_WALLET.toLowerCase() && st.token?.toLowerCase() === USDT_CONTRACT.toLowerCase()) {
      return Number(st.lastBlock);
    }
  } catch {}
  return null;
}

function saveLastBlock(lastBlock) {
  const tmp = `${STATE_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify({ wallet: WATCH_WALLET, token: USDT_CONTRACT, lastBlock, savedAt: new Date().toISOString() }));
  renameSync(tmp, STATE_FILE);
}

async function handleDeposit(log) {
  const { args } = usdtContract.interface.parseLog(log);
  const formattedAmount = formatUnits(args.value, USDT_DECIMALS);
  const txHash = log.transactionHash;

  console.log(`\n📥 INBOUND DEPOSIT DETECTED! (block ${log.blockNumber})`);
  console.log(`Amount: ${formattedAmount} USDT`);
  console.log(`From: ${args.from}`);
  console.log(`TxHash: ${txHash}`);

  const alertMessage = `🚨 *Inbound Deposit Received* 🚨\n\n` +
    `💰 *Amount:* \`${formattedAmount} USDT\`\n` +
    `👤 *From:* \`${args.from}\`\n` +
    `🔗 *TxHash:* \`${txHash}\``;

  await sendTelegramAlert(alertMessage);
}

async function startWatcher() {
  console.log("=== Nova Deposit Watcher Daemon Started ===");
  console.log(`Monitoring wallet: ${WATCH_WALLET}`);
  console.log(`RPC Gateway: ${RPC_URL}`);

  const inbound = usdtContract.filters.Transfer(null, WATCH_WALLET);
  const topics = await inbound.getTopicFilter();
  const network = await provider.getNetwork();
  console.log(`Chain ${network.chainId}; polling every ${POLL_MS / 1000}s, ${CONFIRMATIONS} confirmations`);

  let lastBlock = loadLastBlock();
  if (lastBlock === null) {
    lastBlock = (await provider.getBlockNumber()) - CONFIRMATIONS;
    saveLastBlock(lastBlock);
    console.log(`No saved position; starting from block ${lastBlock} (earlier transfers are not replayed).`);
  } else {
    console.log(`Resuming after block ${lastBlock}.`);
  }

  let failures = 0;
  for (;;) {
    try {
      const safeTip = (await provider.getBlockNumber()) - CONFIRMATIONS;
      while (lastBlock < safeTip) {
        const from = lastBlock + 1;
        const to = Math.min(safeTip, lastBlock + MAX_RANGE);
        const logs = await provider.getLogs({ address: USDT_CONTRACT, topics, fromBlock: from, toBlock: to });
        for (const log of logs) {
          try {
            await handleDeposit(log);
          } catch (err) {
            console.error(`Error processing transfer ${log.transactionHash}:`, err.message);
          }
        }
        lastBlock = to;
        saveLastBlock(lastBlock);
      }
      if (failures) console.log(`[${new Date().toISOString()}] RPC recovered after ${failures} failed poll(s); checked up to block ${lastBlock}.`);
      failures = 0;
    } catch (err) {
      failures++;
      // One short line per failure; the position is kept, so the same blocks are retried next time.
      console.error(`[${new Date().toISOString()}] Poll failed (${failures}x, still at block ${lastBlock}): ${err.shortMessage || err.message}`);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

startWatcher().catch(err => {
  console.error("Fatal watcher error:", err);
});
