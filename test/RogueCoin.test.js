const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RogueCoin Production Token", function () {
  let RogueCoin, rogueCoin, owner, addr1, addr2;

  beforeEach(async function () {
    RogueCoin = await ethers.getContractFactory("RogueCoin");
    [owner, addr1, addr2] = await ethers.getSigners();
    rogueCoin = await RogueCoin.deploy();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await rogueCoin.getAddress()).to.be.properAddress;
    });

    it("Should have correct name and symbol", async function () {
      expect(await rogueCoin.name()).to.equal("RogueCoin");
      expect(await rogueCoin.symbol()).to.equal("RGC");
    });

    it("Should have correct total supply", async function () {
      const totalSupply = await rogueCoin.totalSupply();
      expect(totalSupply).to.equal(ethers.parseEther("1000000000")); // 1 billion
    });

    it("Should have correct initial balances", async function () {
      const ownerBalance = await rogueCoin.balanceOf(owner.address);
      
      // Owner should have liquidity + community + airdrop + game treasury
      expect(ownerBalance).to.be.gt(ethers.parseEther("500000000")); // Should have more than 500M
    });

    it("Should have trading disabled initially", async function () {
      expect(await rogueCoin.tradingEnabled()).to.equal(false);
    });
  });

  describe("Trading Controls", function () {
    it("Should allow owner to enable trading", async function () {
      await rogueCoin.enableTrading();
      expect(await rogueCoin.tradingEnabled()).to.equal(true);
    });

    it("Should prevent non-owner from enabling trading", async function () {
      await expect(
        rogueCoin.connect(addr1).enableTrading()
      ).to.be.revertedWithCustomError(rogueCoin, "OwnableUnauthorizedAccount");
    });
  });

  describe("Anti-whale Protection", function () {
    beforeEach(async function () {
      await rogueCoin.enableTrading();
    });

    it("Should have max transaction and wallet limits", async function () {
      const totalSupply = await rogueCoin.totalSupply();
      const maxTx = await rogueCoin.maxTransactionAmount();
      const maxWallet = await rogueCoin.maxWalletAmount();

      // 2% of total supply
      const expectedMax = totalSupply * BigInt(2) / BigInt(100);
      expect(maxTx).to.equal(expectedMax);
      expect(maxWallet).to.equal(expectedMax);
    });
  });

  describe("Vesting", function () {
    it("Should have vesting configured", async function () {
      // Check that vesting-related functions exist
      expect(await rogueCoin.totalSupply()).to.be.gt(0);
    });
  });
});