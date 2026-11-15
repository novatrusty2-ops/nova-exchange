const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Network 651940 & Supported Routers
const SUPPORTED_NETWORKS = {
    "651940": { name: "Alltra Network 651940", router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D" }
};

const TOKEN_REGISTRY = {
    "USDT": { address: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6 },
    "USDC": { address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6 },
    "ETH": { address: "0x0000000000000000000000000000000000000000", decimals: 18 }
};

app.get('/health', (req, res) => {
    res.json({
        status: "ONLINE",
        architecture: "TRUE_SELF_CUSTODY",
        note: "No custodial reserves or mock balances maintained. Client signs all transactions.",
        timestamp: new Date().toISOString()
    });
});

// Returns unsigned transaction payload for client-side wallet signing
app.post('/api/v1/swap/build-tx', (req, res) => {
    const { chainId, tokenIn, tokenOut, amountIn, recipient } = req.body;

    if (chainId !== "651940" || !SUPPORTED_NETWORKS[chainId]) {
        return res.status(400).json({ success: false, error: "Invalid chain ID. PouchPay requires network 651940." });
    }
    if (!TOKEN_REGISTRY[tokenIn] || !TOKEN_REGISTRY[tokenOut]) {
        return res.status(400).json({ success: false, error: "Unsupported token pair." });
    }

    const network = SUPPORTED_NETWORKS[chainId];
    const parsedAmount = ethers.parseUnits(amountIn.toString(), TOKEN_REGISTRY[tokenIn].decimals);

    const routerInterface = new ethers.Interface([
        "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)"
    ]);

    const path = [TOKEN_REGISTRY[tokenIn].address, TOKEN_REGISTRY[tokenOut].address];
    const deadline = Math.floor(Date.now() / 1000) + 1200;
    const minAmountOut = parsedAmount * 99n / 100n; // 1% slippage buffer

    const calldata = routerInterface.encodeFunctionData("swapExactTokensForTokens", [
        parsedAmount,
        minAmountOut,
        path,
        recipient,
        deadline
    ]);

    res.json({
        success: true,
        mode: "SELF_CUSTODY_UNSIGNED_TX",
        transactionPayload: {
            chainId: 651940,
            to: network.router,
            data: calldata,
            value: tokenIn === "ETH" ? parsedAmount.toString() : "0",
            gasLimit: "250000"
        }
    });
});

app.listen(PORT, () => {
    console.log(`PouchPay Self-Custody Transaction Builder running on port ${PORT}`);
});
