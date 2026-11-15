const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const RPC_URL = process.env.RPC_URL || "https://cloudflare-eth.com";
const ROUTER_ADDRESS = process.env.LIQUIDITY_ROUTER || "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const TOKEN_A_ADDRESS = process.env.TOKEN_A_ADDRESS;
const TOKEN_B_ADDRESS = process.env.TOKEN_B_ADDRESS;

// Standard ERC-20 ABI for allowance, approval, and balance checks
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceof(address account) external view returns (uint256)",
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

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(rawKey, provider);
    console.log("Connected Wallet:", wallet.address);

    // Define desired deposit amounts (e.g., 10 tokens with 18 decimals)
    const amountA = ethers.parseUnits("10.0", 18);
    const amountB = ethers.parseUnits("10.0", 18);

    // Minimum amounts with slippage tolerance (e.g., 95% of desired)
    const amountAMin = (amountA * 95n) / 100n;
    const amountBMin = (amountB * 95n) / 100n;

    // Deadline: 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 1200;

    const tokenAContract = new ethers.Contract(TOKEN_A_ADDRESS, ERC20_ABI, wallet);
    const tokenBContract = new ethers.Contract(TOKEN_B_ADDRESS, ERC20_ABI, wallet);
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
