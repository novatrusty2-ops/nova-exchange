const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Executing reserve synchronization from account: ${deployer.address}`);

  const contractAddress = process.env.VERIFIER_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("VERIFIER_CONTRACT_ADDRESS is not set in environment variables.");
  }

  const NovaReserveVerifier = await ethers.getContractFactory("NovaReserveVerifier");
  const verifier = NovaReserveVerifier.attach(contractAddress);

  // Record the declared Account 6572 reserve figure on-chain. The contract stores the number sent;
  // it does not check a bank or any off-chain balance.
  const tx = await verifier.updateReserves("241000000000", { gasLimit: 500000 });
  console.log(`Transaction sent: ${tx.hash}`);
  
  await tx.wait();
  console.log("Declared reserve recorded on-chain for Account 6572 (not independently verified).");
}

main().catch((error) => {
  console.error("Sync failed:", error);
  process.exitCode = 1;
});
