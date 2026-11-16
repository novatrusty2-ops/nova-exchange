// Deploys NovaReserveVerifier. The deployer becomes the owner.
//
//   npx hardhat run scripts/deploy.js                      # in-memory Hardhat network (throwaway)
//   npx hardhat run scripts/deploy.js --network localhost  # local node
//   CONFIRM_DEPLOY=yes npx hardhat run scripts/deploy.js --network mainnet
//
// Any network other than hardhat/localhost spends real gas, so it requires CONFIRM_DEPLOY=yes.
import hre from "hardhat";

const LOCAL_NETWORKS = new Set(["hardhat", "localhost"]);

async function main() {
  const { ethers, network } = hre;
  const { chainId } = await ethers.provider.getNetwork();
  const isLocal = LOCAL_NETWORKS.has(network.name);

  console.log(`Network: ${network.name} (chain ${chainId})${isLocal ? " · local, nothing real is spent" : ""}`);

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(`No deployer account configured for "${network.name}". Set ORACLE_UPDATER_PRIVATE_KEY in .env.`);
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer:", deployer.address);
  console.log("Balance: ", ethers.formatEther(balance), "ETH");

  if (!isLocal && process.env.CONFIRM_DEPLOY !== "yes") {
    throw new Error(`Refusing to deploy to "${network.name}" without CONFIRM_DEPLOY=yes. This spends real gas.`);
  }

  const Verifier = await ethers.getContractFactory("NovaReserveVerifier");
  const verifier = await Verifier.deploy();
  const tx = verifier.deploymentTransaction();
  console.log("Deploy tx:", tx?.hash);
  await verifier.waitForDeployment();

  const address = await verifier.getAddress();
  console.log("NovaReserveVerifier deployed to:", address);
  console.log("Owner:", await verifier.owner());

  const receipt = await tx?.wait();
  if (receipt) {
    console.log(`Mined in block ${receipt.blockNumber}, gas used ${receipt.gasUsed}`);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
