require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    mainnet: {
      url: process.env.BLOCKCHAIN_RPC_URL || "",
      accounts: process.env.ORACLE_UPDATER_PRIVATE_KEY ? [process.env.ORACLE_UPDATER_PRIVATE_KEY] : []
    }
  }
};
