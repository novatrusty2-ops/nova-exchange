const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NovaReserveVerifier", function () {
  let verifier;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    
    // The constructor takes no arguments; the deployer becomes the owner.
    const NovaReserveVerifier = await ethers.getContractFactory("NovaReserveVerifier");
    verifier = await NovaReserveVerifier.deploy();
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

  describe("updateReserves", function () {
    it("Should start with zero total reserves", async function () {
      expect(await verifier.totalReserves()).to.equal(0n);
    });

    it("Should let the owner set total reserves", async function () {
      const amount = ethers.parseEther("1234.5");
      await verifier.updateReserves(amount);
      expect(await verifier.totalReserves()).to.equal(amount);
    });

    it("Should overwrite the previous value, not add to it", async function () {
      await verifier.updateReserves(100n);
      await verifier.updateReserves(40n);
      expect(await verifier.totalReserves()).to.equal(40n);
    });

    it("Should allow setting reserves back to zero", async function () {
      await verifier.updateReserves(500n);
      await verifier.updateReserves(0n);
      expect(await verifier.totalReserves()).to.equal(0n);
    });

    it("Should accept the maximum uint256 value", async function () {
      await verifier.updateReserves(ethers.MaxUint256);
      expect(await verifier.totalReserves()).to.equal(ethers.MaxUint256);
    });

    it("Should emit ReservesUpdated with the new total and the updater", async function () {
      const amount = 777n;
      await expect(verifier.updateReserves(amount))
        .to.emit(verifier, "ReservesUpdated")
        .withArgs(amount, owner.address);
    });

    it("Should revert when called by a non-owner", async function () {
      const [, stranger] = await ethers.getSigners();
      await expect(verifier.connect(stranger).updateReserves(1n))
        .to.be.revertedWithCustomError(verifier, "OwnableUnauthorizedAccount")
        .withArgs(stranger.address);
      expect(await verifier.totalReserves()).to.equal(0n);
    });

    it("Should only accept updates from the new owner after a transfer", async function () {
      const [, newOwner] = await ethers.getSigners();
      await verifier.transferOwnership(newOwner.address);

      await expect(verifier.updateReserves(1n))
        .to.be.revertedWithCustomError(verifier, "OwnableUnauthorizedAccount")
        .withArgs(owner.address);

      await expect(verifier.connect(newOwner).updateReserves(2n))
        .to.emit(verifier, "ReservesUpdated")
        .withArgs(2n, newOwner.address);
      expect(await verifier.totalReserves()).to.equal(2n);
    });
  });

  describe("verifyVaultBalance", function () {
    const NATIVE = ethers.ZeroAddress;
    let token, vault, stranger;

    beforeEach(async function () {
      [, stranger, vault] = await ethers.getSigners();
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      token = await MockERC20.deploy("Mock USD", "mUSD", 6);
      await token.waitForDeployment();
    });

    describe("ERC-20 tokens", function () {
      it("Should read the vault's live token balance", async function () {
        expect(await verifier.vaultBalance(token, vault.address)).to.equal(0n);
        await token.mint(vault.address, 2_500_000n);
        expect(await verifier.vaultBalance(token, vault.address)).to.equal(2_500_000n);
      });

      it("Should return true when the balance equals the expected amount", async function () {
        await token.mint(vault.address, 1_000n);
        expect(await verifier.verifyVaultBalance(token, vault.address, 1_000n)).to.equal(true);
      });

      it("Should return true when the balance exceeds the expected amount", async function () {
        await token.mint(vault.address, 1_000n);
        expect(await verifier.verifyVaultBalance(token, vault.address, 999n)).to.equal(true);
      });

      it("Should return false when the balance is below the expected amount", async function () {
        await token.mint(vault.address, 1_000n);
        expect(await verifier.verifyVaultBalance(token, vault.address, 1_001n)).to.equal(false);
      });

      it("Should return true for an expected amount of zero on an empty vault", async function () {
        expect(await verifier.verifyVaultBalance(token, vault.address, 0n)).to.equal(true);
      });

      it("Should follow transfers out of the vault", async function () {
        await token.mint(vault.address, 1_000n);
        await token.connect(vault).transfer(stranger.address, 600n);
        expect(await verifier.vaultBalance(token, vault.address)).to.equal(400n);
        expect(await verifier.verifyVaultBalance(token, vault.address, 500n)).to.equal(false);
      });

      it("Should check each token separately", async function () {
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const other = await MockERC20.deploy("Other", "OTH", 18);
        await token.mint(vault.address, 1_000n);
        expect(await verifier.verifyVaultBalance(other, vault.address, 1n)).to.equal(false);
        expect(await verifier.verifyVaultBalance(token, vault.address, 1n)).to.equal(true);
      });

      it("Should not be affected by updateReserves", async function () {
        await verifier.updateReserves(ethers.parseEther("1000000"));
        expect(await verifier.verifyVaultBalance(token, vault.address, 1n)).to.equal(false);
      });

      it("Should revert when the token address has no contract code", async function () {
        await expect(verifier.verifyVaultBalance(stranger.address, vault.address, 1n))
          .to.be.revertedWithCustomError(verifier, "NotATokenContract")
          .withArgs(stranger.address);
      });

      it("Should revert when the token contract has no balanceOf", async function () {
        // The verifier itself is a contract without balanceOf.
        await expect(verifier.verifyVaultBalance(verifier, vault.address, 1n)).to.be.reverted;
      });
    });

    describe("native ETH", function () {
      it("Should read the vault's ETH balance when token is the zero address", async function () {
        const eth = await ethers.provider.getBalance(vault.address);
        expect(eth).to.be.greaterThan(0n);
        expect(await verifier.vaultBalance(NATIVE, vault.address)).to.equal(eth);
        expect(await verifier.verifyVaultBalance(NATIVE, vault.address, eth)).to.equal(true);
        expect(await verifier.verifyVaultBalance(NATIVE, vault.address, eth + 1n)).to.equal(false);
      });

      it("Should report zero for an address that never held ETH", async function () {
        const empty = ethers.Wallet.createRandom().address;
        expect(await verifier.vaultBalance(NATIVE, empty)).to.equal(0n);
        expect(await verifier.verifyVaultBalance(NATIVE, empty, 1n)).to.equal(false);
      });
    });

    it("Should be callable by anyone without sending a transaction", async function () {
      await token.mint(vault.address, 5n);
      expect(await verifier.connect(stranger).verifyVaultBalance(token, vault.address, 5n)).to.equal(true);
    });
  });
});
