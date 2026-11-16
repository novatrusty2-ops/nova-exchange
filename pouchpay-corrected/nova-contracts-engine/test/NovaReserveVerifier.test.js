const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NovaReserveVerifier", function () {
  let verifier;
  let owner;
  let mockAggregatorAddress = "0x71041dddad3595f9ce5dcccef8d24b614566a07f";

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    
    // Deploy verifier with a mock aggregator address
    const NovaReserveVerifier = await ethers.getContractFactory("NovaReserveVerifier");
    verifier = await NovaReserveVerifier.deploy(mockAggregatorAddress);
    await verifier.waitForDeployment();
  });

  it("Should set the right owner", async function () {
    expect(await verifier.owner()).to.equal(owner.address);
  });

  it("Should allow owner to transfer ownership", async function () {
    const [, newOwner] = await ethers.getSigners();
    await verifier.transferOwnership(newOwner.address);
    expect(await verifier.owner()).to.equal(newOwner.address);
  });
});
