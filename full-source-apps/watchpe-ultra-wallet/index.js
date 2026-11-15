// WatchPe Ultra Wallet - Full Self-Custody Signer & Wearable Bridge
const { ethers } = require('ethers');

class WatchPeSigner {
    constructor(providerUrl = 'http://localhost:3001/rpc/651940') {
        this.provider = new ethers.JsonRpcProvider(providerUrl);
        this.chainId = 651940;
    }

    async signAndBroadcast(unsignedTx, privateKey) {
        console.log('[WatchPe] Requesting local client-side signing on network 651940...');
        const wallet = new ethers.Wallet(privateKey, this.provider);
        const tx = {
            to: unsignedTx.to,
            data: unsignedTx.data,
            value: unsignedTx.value || 0n,
            gasLimit: unsignedTx.gasLimit || 250000n,
            chainId: this.chainId
        };
        return await wallet.signTransaction(tx);
    }
}
module.exports = { WatchPeSigner };
