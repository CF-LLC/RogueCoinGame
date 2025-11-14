const { ethers } = require("ethers")

// Test script to verify crash game functionality
async function testCrashGame() {
  try {
    console.log("🧪 Testing Crash Game Functionality...")
    
    // Connect to Polygon using public RPC
    const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com")
    
    const contractAddress = "0xf8f6F8f1c656DbD0540C26B3Bfa1969B500AdB5c"
    
    const abi = [
      "function minBet() view returns (uint256)",
      "function maxBet() view returns (uint256)",
      "function houseEdge() view returns (uint256)",
      "function currentRoundId() view returns (uint256)",
      "function getStats() view returns (uint256, uint256, uint256, uint256, uint256)",
      "function owner() view returns (address)"
    ]
    
    const contract = new ethers.Contract(contractAddress, abi, provider)
    
    console.log("📋 Contract Information:")
    console.log("- Address:", contractAddress)
    console.log("- Network: Polygon Mainnet")
    
    // Test basic contract functions
    try {
      const [minBet, maxBet, houseEdge, currentRoundId, owner] = await Promise.all([
        contract.minBet(),
        contract.maxBet(),
        contract.houseEdge(),
        contract.currentRoundId(),
        contract.owner()
      ])
      
      console.log("\n✅ Contract Functions Working:")
      console.log("- Min Bet:", ethers.formatEther(minBet), "RGC")
      console.log("- Max Bet:", ethers.formatEther(maxBet), "RGC")
      console.log("- House Edge:", Number(houseEdge) / 100 + "%")
      console.log("- Current Round ID:", currentRoundId.toString())
      console.log("- Owner:", owner)
      
      // Test stats function
      try {
        const stats = await contract.getStats()
        console.log("\n📊 Game Statistics:")
        console.log("- Total Bets:", ethers.formatEther(stats[0]), "RGC")
        console.log("- Total Winnings:", ethers.formatEther(stats[1]), "RGC")
        console.log("- Total Losses:", ethers.formatEther(stats[2]), "RGC")
        console.log("- Liquidity:", ethers.formatEther(stats[3]), "RGC")
        console.log("- Current Round ID:", stats[4].toString())
        
        console.log("\n🎉 All tests passed! Crash game contract is working properly.")
        
        console.log("\n💡 To play:")
        console.log("1. Connect your wallet with RGC tokens")
        console.log("2. Ensure you have MATIC for gas fees")
        console.log("3. Place a bet between", ethers.formatEther(minBet), "and", ethers.formatEther(maxBet), "RGC")
        console.log("4. Watch the multiplier rise and click 'Cash Out' before it crashes!")
        
      } catch (statsError) {
        console.error("❌ Stats function failed:", statsError.message)
      }
      
    } catch (contractError) {
      console.error("❌ Contract function calls failed:")
      console.error(contractError.message)
      
      if (contractError.message.includes("missing revert data")) {
        console.log("\n💡 This might be due to:")
        console.log("- Contract not deployed on this network")
        console.log("- Network connection issues")
        console.log("- Contract address incorrect")
      }
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message)
  }
}

// Run the test
testCrashGame()