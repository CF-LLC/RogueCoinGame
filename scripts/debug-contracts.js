const { ethers } = require("ethers");

async function debugContractIssues() {
  console.log("🔍 Debugging Contract Issues...\n");

  try {
    const RPC_URL = "https://polygon-mainnet.g.alchemy.com/v2/nBAwpGnF4mqnMRtGxC4Pi";
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    const TOKEN_ADDRESS = "0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e";
    const AIRDROP_ADDRESS = "0xd2D45bdf0e4C8393E9BC57bAd363b01Eaeb377f9";
    const ADMIN_ADDRESS = "0x8DA112FcA23e31785e9c69cA92C8f00e999BebF2";

    // Check if contracts exist
    console.log("📋 Contract Existence Check:");
    const tokenCode = await provider.getCode(TOKEN_ADDRESS);
    const airdropCode = await provider.getCode(AIRDROP_ADDRESS);
    
    console.log(`Token contract exists: ${tokenCode !== '0x' ? '✅ YES' : '❌ NO'}`);
    console.log(`Airdrop contract exists: ${airdropCode !== '0x' ? '✅ YES' : '❌ NO'}\n`);

    if (tokenCode === '0x') {
      console.log("❌ RGC Token contract not deployed at this address!");
      return;
    }

    // Try basic token contract calls
    console.log("🎯 Testing RGC Token Contract:");
    const tokenABI = [
      "function tradingEnabled() view returns (bool)",
      "function owner() view returns (address)",
      "function totalSupply() view returns (uint256)",
      "function enableTrading()"
    ];
    
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenABI, provider);
    
    try {
      const [tradingEnabled, owner, totalSupply] = await Promise.all([
        tokenContract.tradingEnabled(),
        tokenContract.owner(),
        tokenContract.totalSupply()
      ]);
      
      console.log(`  Trading Enabled: ${tradingEnabled ? '✅ YES' : '❌ NO'}`);
      console.log(`  Owner: ${owner}`);
      console.log(`  Admin Match: ${owner.toLowerCase() === ADMIN_ADDRESS.toLowerCase() ? '✅ YES' : '❌ NO'}`);
      console.log(`  Total Supply: ${ethers.formatEther(totalSupply)} RGC\n`);

      // If trading is already enabled
      if (tradingEnabled) {
        console.log("🎉 Trading is already enabled! The issue might be elsewhere.\n");
        return;
      }

      // Test enableTrading function with admin address
      console.log("⚡ Testing enableTrading function...");
      
      // Create a test transaction to see what would happen
      try {
        // Estimate gas for enableTrading
        const iface = new ethers.Interface(tokenABI);
        const data = iface.encodeFunctionData("enableTrading");
        
        const gasEstimate = await provider.estimateGas({
          to: TOKEN_ADDRESS,
          from: ADMIN_ADDRESS,
          data: data
        });
        
        console.log(`  ✅ Gas estimate successful: ${gasEstimate.toString()}`);
        console.log("  💡 enableTrading should work fine!");
        
      } catch (gasError) {
        console.log(`  ❌ Gas estimation failed: ${gasError.message}`);
        
        if (gasError.message.includes("missing revert data")) {
          console.log("  🔍 This suggests the contract function exists but would revert");
          console.log("  💭 Possible causes:");
          console.log("     - Trading is already enabled");
          console.log("     - Wrong caller (not owner)");
          console.log("     - Contract has some other restriction");
        }
      }

    } catch (tokenError) {
      console.log(`  ❌ Token contract calls failed: ${tokenError.message}`);
    }

    // Test airdrop contract
    if (airdropCode !== '0x') {
      console.log("🪂 Testing Airdrop Contract:");
      
      const airdropABI = [
        "function claimAirdrop() payable",
        "function airdropAmount() view returns (uint256)",
        "function claimFee() view returns (uint256)",
        "function paused() view returns (bool)",
        "function hasClaimed(address) view returns (bool)"
      ];
      
      const airdropContract = new ethers.Contract(AIRDROP_ADDRESS, airdropABI, provider);
      
      try {
        const [airdropAmount, claimFee, isPaused] = await Promise.all([
          airdropContract.airdropAmount(),
          airdropContract.claimFee(),
          airdropContract.paused()
        ]);
        
        console.log(`  Airdrop Amount: ${ethers.formatEther(airdropAmount)} RGC`);
        console.log(`  Claim Fee: ${ethers.formatEther(claimFee)} POL`);
        console.log(`  Paused: ${isPaused ? '❌ YES' : '✅ NO'}`);
        
        // Test if admin has already claimed
        const adminClaimed = await airdropContract.hasClaimed(ADMIN_ADDRESS);
        console.log(`  Admin has claimed: ${adminClaimed ? '✅ YES' : '❌ NO'}\n`);
        
        // Test claim function
        if (!adminClaimed && !isPaused) {
          try {
            const gasEstimate = await provider.estimateGas({
              to: AIRDROP_ADDRESS,
              from: ADMIN_ADDRESS,
              data: airdropContract.interface.encodeFunctionData("claimAirdrop"),
              value: ethers.parseEther(ethers.formatEther(claimFee))
            });
            console.log(`  ✅ Claim gas estimate: ${gasEstimate.toString()}`);
          } catch (claimError) {
            console.log(`  ❌ Claim would fail: ${claimError.message}`);
          }
        }
        
      } catch (airdropError) {
        console.log(`  ❌ Airdrop contract calls failed: ${airdropError.message}`);
      }
    }

    console.log("\n📝 Recommendations:");
    console.log("1. Try enabling trading directly via Polygonscan");
    console.log("2. Check if the admin wallet has sufficient POL for gas");
    console.log("3. Verify the contract addresses are correct");
    console.log(`\n🔗 Direct Links:`);
    console.log(`Token Contract: https://polygonscan.com/address/${TOKEN_ADDRESS}#writeContract`);
    console.log(`Airdrop Contract: https://polygonscan.com/address/${AIRDROP_ADDRESS}#writeContract`);

  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

debugContractIssues().catch(console.error);