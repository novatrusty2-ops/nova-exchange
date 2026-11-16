const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
// Default: the local Hardhat node (PM2 "local-evm-node"). Set RPC_URL for another chain.
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:3001";
const ROUTER_ADDRESS = process.env.LIQUIDITY_ROUTER || "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const TOKEN_A_ADDRESS = process.env.TOKEN_A_ADDRESS;
const TOKEN_B_ADDRESS = process.env.TOKEN_B_ADDRESS;

// Standard ERC-20 ABI for allowance, approval, and balance checks
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
];

// Uniswap V2 Router ABI for addLiquidity
const ROUTER_ABI = [
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)"
];

async function main() {
    const rawKey = process.argv[2] || process.env.PRIVATE_KEY;
    if (!rawKey || rawKey.includes('your_actual')) {
        throw new Error("Provide a valid PRIVATE_KEY in .env or as a command-line argument.");
    }

    for (const [name, addr] of [["TOKEN_A_ADDRESS", TOKEN_A_ADDRESS], ["TOKEN_B_ADDRESS", TOKEN_B_ADDRESS], ["LIQUIDITY_ROUTER", ROUTER_ADDRESS]]) {
        if (!ethers.isAddress(addr)) throw new Error(`${name} is not set to a valid address.`);
    }

    // Ask the node which chain it is (once), then pin it so ethers does not keep re-detecting.
    const probe = new ethers.JsonRpcProvider(RPC_URL);
    const chainId = Number(await probe.send("eth_chainId", []));
    probe.destroy();
    const network = new ethers.Network(`chain-${chainId}`, chainId);
    const provider = new ethers.JsonRpcProvider(RPC_URL, network, { staticNetwork: network });
    console.log(`RPC ${RPC_URL} is chain ${chainId}`);

    // Refuse to send anything if the router or tokens are not deployed on this chain
    // (e.g. the Ethereum-mainnet Uniswap router does not exist on a local Hardhat node).
    for (const [name, addr] of [["Router", ROUTER_ADDRESS], ["Token A", TOKEN_A_ADDRESS], ["Token B", TOKEN_B_ADDRESS]]) {
        if ((await provider.getCode(addr)) === "0x") {
            throw new Error(`${name} ${addr} has no contract code on chain ${chainId}. Deploy it there or set the right address.`);
        }
    }

    const wallet = new ethers.Wallet(rawKey, provider);
    console.log("Connected Wallet:", wallet.address);

    // Desired deposit: 10 of each token, using each token's real decimals
    const tokenAContract = new ethers.Contract(TOKEN_A_ADDRESS, ERC20_ABI, wallet);
    const tokenBContract = new ethers.Contract(TOKEN_B_ADDRESS, ERC20_ABI, wallet);
    const [decA, decB] = await Promise.all([tokenAContract.decimals(), tokenBContract.decimals()]);
    const amountA = ethers.parseUnits("10.0", decA);
    const amountB = ethers.parseUnits("10.0", decB);

    const [balA, balB] = await Promise.all([tokenAContract.balanceOf(wallet.address), tokenBContract.balanceOf(wallet.address)]);
    if (balA < amountA || balB < amountB) {
        throw new Error(`Insufficient balance: have ${ethers.formatUnits(balA, decA)} A / ${ethers.formatUnits(balB, decB)} B, need 10 of each.`);
    }

    // Minimum amounts with slippage tolerance (e.g., 95% of desired)
    const amountAMin = (amountA * 95n) / 100n;
    const amountBMin = (amountB * 95n) / 100n;

    // Deadline: 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 1200;

    const routerContract = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);

    console.log("Checking and approving tokens for router...");

    // 1. Approve Token A
    const allowanceA = await tokenAContract.allowance(wallet.address, ROUTER_ADDRESS);
    if (allowanceA < amountA) {
        console.log("Approving Token A...");
        const txA = await tokenAContract.approve(ROUTER_ADDRESS, amountA);
        await txA.wait();
        console.log("Token A approved!");
    }

    // 2. Approve Token B
    const allowanceB = await tokenBContract.allowance(wallet.address, ROUTER_ADDRESS);
    if (allowanceB < amountB) {
        console.log("Approving Token B...");
        const txB = await tokenBContract.approve(ROUTER_ADDRESS, amountB);
        await txB.wait();
        console.log("Token B approved!");
    }

    console.log("Executing addLiquidity transaction...");
    const tx = await routerContract.addLiquidity(
        TOKEN_A_ADDRESS,
        TOKEN_B_ADDRESS,
        amountA,
        amountB,
        amountAMin,
        amountBMin,
        wallet.address,
        deadline,
        { gasLimit: 3000000 }
    );

    console.log("Transaction submitted! Hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Liquidity successfully added in block:", receipt.blockNumber);
}

main().catch((error) => {
    console.error("Execution error:", error);
    process.exit(1);
});
