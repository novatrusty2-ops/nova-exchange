module.exports = {
  chain: {
    id: 651940,
    name: "ALLTRA",
    router: "0xEd04ee8307C0656207af5afe3926Ae2380052940",
    nativeCurrency: {
      name: "ALLTRA",
      symbol: "ALLTRA",
      decimals: 18
    }
  },
  apps: {
    pouchpay: {
      enabled: false, // On hold pending Mr. Nathan's review
      supportedTokens: ["USDT", "USDC", "ALLTRA"]
    },
    novaplus: {
      enabled: true,
      supportedTokens: ["USDT", "USDC", "ALLTRA"]
    },
    novax: {
      enabled: true,
      supportedTokens: ["USDT", "USDC", "ALLTRA"]
    }
  }
};
