// Nova X Decentralized AMM Router Protocol
const { ethers } = require('ethers');

class NovaXRouter {
    constructor() {
        this.routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
        this.interface = new ethers.Interface([
            "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)"
        ]);
    }
    buildRoutePayload(tokenIn, tokenOut, amountIn, recipient) {
        const deadline = Math.floor(Date.now() / 1000) + 1200;
        const data = this.interface.encodeFunctionData("swapExactTokensForTokens", [
            amountIn, amountIn * 99n / 100n, [tokenIn, tokenOut], recipient, deadline
        ]);
        return { to: this.routerAddress, data, chainId: 651940 };
    }
}
module.exports = { NovaXRouter };
