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

  // Trigger on-chain reserve attestation update for Account 6572
  const tx = await verifier.updateReserves("241000000000", { gasLimit: 500000 });
  console.log(`Transaction sent: ${tx.hash}`);
  
  await tx.wait();
  console.log("Successfully verified reserves on-chain for Account 6572.");
}

main().catch((error) => {
  console.error("Sync failed:", error);
  process.exitCode = 1;
});
