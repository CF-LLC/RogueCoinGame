const { ethers } = require("ethers");

// Your Alchemy RPC URL
const RPC_URL = "https://polygon-mainnet.g.alchemy.com/v2/nBAwpGnF4mqnMRtGxC4Pi";

// Contract addresses
const TOKEN_ADDRESS = "0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e";
const AIRDROP_ADDRESS = "0xd2D45bdf0e4C8393E9BC57bAd363b01Eaeb377f9";

// ABIs
const TOKEN_ABI = [
  "function tradingEnabled() external view returns (bool)",
  "function owner() external view returns (address)",
  "function totalSupply() external view returns (uint256)"
];

const AIRDROP_ABI = [
  "function paused() external view returns (bool)",
  "function airdropAmount() external view returns (uint256)",
  "function claimFee() external view returns (uint256)",
  "function totalClaimed() external view returns (uint256)",
  "function hasClaimed(address) external view returns (bool)",
  "function hasClaimedAirdrop(address) external view returns (bool)",
  "function owner() external view returns (address)",
  "function getStats() external view returns (uint256, uint256, uint256, uint256, uint256)"
];

async function checkContracts() {
  console.log("🔍 Checking RogueCoin Contracts Status...\n");

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Check RGC Token
    console.log("📊 RGC Token Contract:");
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
    const [tradingEnabled, tokenOwner, totalSupply] = await Promise.all([
      tokenContract.tradingEnabled(),
      tokenContract.owner(),
      tokenContract.totalSupply()
    ]);
    
    console.log(`  Address: ${TOKEN_ADDRESS}`);
    console.log(`  Trading: ${tradingEnabled ? "✅ ENABLED" : "❌ DISABLED"}`);
    console.log(`  Owner: ${tokenOwner}`);
    console.log(`  Supply: ${ethers.formatEther(totalSupply)} RGC\n`);

    // Check Airdrop Contract
    console.log("🪂 Airdrop Contract:");
    const airdropContract = new ethers.Contract(AIRDROP_ADDRESS, AIRDROP_ABI, provider);
    
    try {
      const stats = await airdropContract.getStats();
      const [airdropAmount, claimFee, totalClaimed, totalFeeCollected, remainingBalance] = stats;
      const isPaused = await airdropContract.paused();
      const airdropOwner = await airdropContract.owner();
      
      console.log(`  Address: ${AIRDROP_ADDRESS}`);
      console.log(`  Status: ${isPaused ? "❌ PAUSED" : "✅ ACTIVE"}`);
      console.log(`  Airdrop Amount: ${ethers.formatEther(airdropAmount)} RGC`);
      console.log(`  Claim Fee: ${ethers.formatEther(claimFee)} POL`);
      console.log(`  Total Claimed: ${ethers.formatEther(totalClaimed)} RGC`);
      console.log(`  Total Fees: ${ethers.formatEther(totalFeeCollected)} POL`);
      console.log(`  Remaining Balance: ${ethers.formatEther(remainingBalance)} RGC`);
      console.log(`  Owner: ${airdropOwner}\n`);

      // Test a sample claim check (using a random address)
      const testAddress = "0xa0c262747AbF4fB881544D12b9c63b9cd84C31Dd";
      const hasClaimed = await airdropContract.hasClaimed(testAddress);
      console.log(`  Test Address ${testAddress} has claimed: ${hasClaimed ? "YES" : "NO"}`);

      // Check if contract has enough RGC balance for claims
      if (ethers.parseEther("0") >= remainingBalance) {
        console.log(`  ⚠️  WARNING: Contract has insufficient RGC tokens for airdrops!`);
      }

    } catch (airdropError) {
      console.log(`  ❌ Error reading airdrop contract: ${airdropError.message}`);
      console.log(`  This might indicate the contract is not deployed properly or needs RGC tokens.\n`);
    }

    // Check if addresses match expected admin
    const adminAddress = "0x8DA112FcA23e31785e9c69cA92C8f00e999BebF2";
    console.log("👑 Admin Status:");
    console.log(`  Expected Admin: ${adminAddress}`);
    console.log(`  Token Owner: ${tokenOwner === adminAddress ? "✅ MATCH" : "❌ DIFFERENT"}`);
    
    return { tradingEnabled, tokenOwner };
    
  } catch (error) {
    console.error("❌ Error checking contracts:", error.message);
    return null;
  }
}

checkContracts().catch(console.error);