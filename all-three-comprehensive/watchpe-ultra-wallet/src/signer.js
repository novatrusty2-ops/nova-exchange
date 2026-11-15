const { ethers } = require('ethers');
export class WatchPeUltraSigner {
    constructor(rpcUrl = 'http://localhost:3001/rpc/651940') {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }
    async signAndBroadcast(unsignedTx, privateKey) {
        const wallet = new ethers.Wallet(privateKey, this.provider);
        const tx = {
            to: unsignedTx.to,
            data: unsignedTx.data,
            value: unsignedTx.value || 0n,
            gasLimit: unsignedTx.gasLimit || 250000n,
            chainId: 651940
        };
        return await wallet.signTransaction(tx);
    }
}
