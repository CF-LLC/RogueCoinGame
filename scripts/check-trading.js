const { ethers } = require("ethers");

// Your Alchemy RPC URL
const RPC_URL = "https://polygon-mainnet.g.alchemy.com/v2/nBAwpGnF4mqnMRtGxC4Pi";

// Contract details
const TOKEN_ADDRESS = "0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e";

// Minimal ABI for trading status
const MINIMAL_ABI = [
  "function tradingEnabled() external view returns (bool)",
  "function owner() external view returns (address)",
  "function enableTrading() external"
];

async function checkTradingStatus() {
  console.log("🔍 Checking RGC Token Trading Status...\n");

  try {
    // Create provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Connect to contract (read-only)
    const contract = new ethers.Contract(TOKEN_ADDRESS, MINIMAL_ABI, provider);
    
    // Check current trading status
    const tradingEnabled = await contract.tradingEnabled();
    const owner = await contract.owner();
    
    console.log("📊 Trading Status:", tradingEnabled ? "✅ ENABLED" : "❌ DISABLED");
    console.log("👑 Contract Owner:", owner);
    console.log("📍 Contract Address:", TOKEN_ADDRESS);
    console.log("🔗 Polygonscan:", `https://polygonscan.com/address/${TOKEN_ADDRESS}`);
    
    if (!tradingEnabled) {
      console.log("\n⚠️  Trading is currently DISABLED");
      console.log("💡 To enable trading:");
      console.log("1. Connect wallet with owner address to PolygonScan");
      console.log("2. Go to Write Contract tab");
      console.log("3. Call 'enableTrading' function");
      console.log("4. Confirm transaction");
    } else {
      console.log("\n🎉 Trading is ENABLED!");
      console.log("✅ RGC can be traded on DEXs");
      console.log("💰 Ready for liquidity pools");
    }
    
    return { tradingEnabled, owner };
    
  } catch (error) {
    console.error("❌ Error checking trading status:", error.message);
    return null;
  }
}

checkTradingStatus().catch(console.error);