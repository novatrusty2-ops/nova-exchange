import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

const accounts = process.env.ORACLE_UPDATER_PRIVATE_KEY && process.env.ORACLE_UPDATER_PRIVATE_KEY.length >= 64
  ? [process.env.ORACLE_UPDATER_PRIVATE_KEY]
  : [];

export default {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:3001",
      chainId: 31337
    },
    mainnet: {
      url: process.env.BLOCKCHAIN_RPC_URL || "",
      accounts: accounts
    }
  }
};
