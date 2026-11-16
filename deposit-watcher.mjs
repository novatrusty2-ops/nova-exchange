import dotenv from 'dotenv';
import { JsonRpcProvider, Contract, formatUnits } from 'ethers';

dotenv.config();

// Configuration
const RPC_URL = process.env.RPC_URL || "http://localhost:3000/rpc/nova-x";
const WATCH_WALLET = "0x05868c29D58d1EC275Cf078356c03F79B1975600";
const USDT_CONTRACT = process.env.USDT_CONTRACT || "0xdac17f958d2ee523a2206206994597c13d831ec7"; // 6 decimals USDT
const USDT_DECIMALS = 6;

// Telegram Alert Credentials (Update with your actual values)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "YOUR_ACTUAL_BOT_TOKEN";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "YOUR_ACTUAL_CHAT_ID";

const provider = new JsonRpcProvider(RPC_URL);

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

async function startWatcher() {
  console.log("=== Nova Deposit Watcher Daemon Started ===");
  console.log(`Monitoring wallet: ${WATCH_WALLET}`);
  console.log(`RPC Gateway: ${RPC_URL}`);

  // Listen only for USDT Transfer events whose `to` is our wallet. The filter is applied by the RPC node,
  // so we no longer download and discard every USDT transfer on Ethereum.
  const inbound = usdtContract.filters.Transfer(null, WATCH_WALLET);
  usdtContract.on(inbound, async (from, to, value, event) => {
    try {
      if (to.toLowerCase() === WATCH_WALLET.toLowerCase()) {
        const formattedAmount = formatUnits(value, USDT_DECIMALS);
        const txHash = event.log.transactionHash;
        
        console.log(`\n📥 INBOUND DEPOSIT DETECTED!`);
        console.log(`Amount: ${formattedAmount} USDT`);
        console.log(`From: ${from}`);
        console.log(`TxHash: ${txHash}`);

        const alertMessage = `🚨 *Inbound Deposit Received* 🚨\n\n` +
          `💰 *Amount:* \`${formattedAmount} USDT\`\n` +
          `👤 *From:* \`${from}\`\n` +
          `🔗 *TxHash:* \`${txHash}\``;

        await sendTelegramAlert(alertMessage);
      }
    } catch (err) {
      console.error("Error processing transfer event:", err.message);
    }
  });
}

startWatcher().catch(err => {
  console.error("Fatal watcher error:", err);
});
