const RPC_URL = "http://localhost:3000/rpc/nova-x";
const TOKEN_CONTRACT_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const monitoredWallets = [
  "0x05868c29D58d1EC275Cf078356c03F79B1975600"
];

function encodeBalanceOfData(walletAddress) {
  const methodId = "70a08231";
  const paddedAddress = walletAddress.replace(/^0x/, "").toLowerCase().padStart(64, "0");
  return "0x" + methodId + paddedAddress;
}

async function checkEcosystemBalances() {
  console.log("=== Checking Real Nova Ecosystem Balances ==-\n");

  try {
    const res = await fetch("http://localhost:3000/vault/reserves");
    const reserves = await res.json();
    console.log("Live Vault Reserves (TRV-TERMINAL-01):", reserves, "\n");
  } catch (e) {
    console.log("Vault endpoint check skipped or unavailable.\n");
  }

  for (const address of monitoredWallets) {
    console.log(`----------------------------------------`);
    console.log(`App Wallet: ${address}`);

    try {
      const nativeRes = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBalance", params: [address, "latest"], id: 1 })
      });
      const nativeData = await nativeRes.json();
      if (nativeData.result) {
        const nativeEth = Number(BigInt(nativeData.result)) / 1e18;
        console.log(`Native Balance: ${nativeEth} ETH/Native Coin`);
      }
    } catch (err) {
      console.error("Failed to fetch native balance:", err.message);
    }

    try {
      const tokenRes = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [{ to: TOKEN_CONTRACT_ADDRESS, data: encodeBalanceOfData(address) }, "latest"],
          id: 2
        })
      });
      const tokenData = await tokenRes.json();
      if (tokenData.result && tokenData.result !== "0x") {
        const tokenBalance = Number(BigInt(tokenData.result)) / 1e6; // USDT 6 decimals
        console.log(`USDT Token Balance: ${tokenBalance} USDT`);
      } else {
        console.log("USDT Token Balance: 0 USDT");
      }
    } catch (err) {
      console.error("Failed to fetch token balance:", err.message);
    }
    console.log(`----------------------------------------\n`);
  }
}

checkEcosystemBalances();
