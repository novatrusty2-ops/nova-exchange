// Liquidity health monitor for the Alltra (651940) ALL pools, read from PouchPay /vault/reserves,
// which now reports real on-chain reserves. It only reports; it never moves funds.
// The previous version compared a hard-coded $241B number against a 200B threshold and always
// printed "healthy". It is kept in pouchpay-corrected/backups/simulated-2026-11-16/.

const VAULT_RESERVES_URL = process.env.VAULT_RESERVES_URL || "http://127.0.0.1:3000/vault/reserves"; // not "localhost": Node may resolve it to ::1, the backend listens on IPv4;
const CHECK_INTERVAL_MS = 60000;
const MIN_USD_SIDE = Number(process.env.MIN_USD_SIDE || 10000); // warn if a stablecoin pool holds less than this
const MAX_SPREAD_PCT = Number(process.env.MAX_SPREAD_PCT || 10); // warn if ALL price differs more than this between pools

async function checkLiquidity() {
  console.log(`\n[${new Date().toISOString()}] Alltra liquidity check`);
  try {
    const res = await fetch(VAULT_RESERVES_URL, { signal: AbortSignal.timeout(20000) });
    const data = await res.json();
    if (!res.ok || data.status !== "LIVE") {
      console.error(`Reserves unavailable: ${JSON.stringify(data).slice(0, 200)}`);
      return;
    }
    console.log(`Block ${data.blockNumber}`);
    for (const p of data.pools) {
      console.log(`  ${p.token.padEnd(7)} ${p.tokenReserve.toFixed(4).padStart(16)} ${p.token}  /  ${p.allReserve.toFixed(0).padStart(12)} ALL`);
    }
    const { viaUSDC, viaUSDT, spreadPercent } = data.allPriceUsd;
    console.log(`ALL price: $${viaUSDC?.toPrecision(4)} (USDC pool), $${viaUSDT?.toPrecision(4)} (USDT pool)`);

    const problems = [];
    for (const sym of ["USDC", "USDT"]) {
      const p = data.pools.find((x) => x.token === sym);
      if (p && p.tokenReserve < MIN_USD_SIDE) problems.push(`${sym} pool holds only ${p.tokenReserve.toFixed(2)} ${sym} (< ${MIN_USD_SIDE})`);
    }
    if (spreadPercent !== null && spreadPercent > MAX_SPREAD_PCT) problems.push(`ALL price spread between USDC and USDT pools is ${spreadPercent.toFixed(0)}%`);

    if (problems.length) problems.forEach((m) => console.warn(`⚠️ ${m}`));
    else console.log("✅ Pools within thresholds.");
  } catch (err) {
    console.error("Liquidity check failed:", err.message);
  }
}

console.log("=== Alltra liquidity health monitor started (report-only) ===");
checkLiquidity();
setInterval(checkLiquidity, CHECK_INTERVAL_MS);
