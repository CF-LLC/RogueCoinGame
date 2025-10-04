const hre = require("hardhat")

async function main() {
  console.log("🔍 Testing Polygon Connection...")
  
  try {
    // Test network connection
    const network = await hre.ethers.provider.getNetwork()
    console.log("✅ Connected to network:", network.name, "Chain ID:", network.chainId)
    
    // Test account setup
    const [deployer] = await hre.ethers.getSigners()
    console.log("✅ Deployer address:", deployer.address)
    
    // Test balance
    const balance = await hre.ethers.provider.getBalance(deployer.address)
    console.log("✅ Balance:", hre.ethers.formatEther(balance), "MATIC")
    
    // Test gas price
    const gasPrice = await hre.ethers.provider.getFeeData()
    console.log("✅ Current gas price:", gasPrice.gasPrice ? hre.ethers.formatUnits(gasPrice.gasPrice, "gwei") : "auto", "gwei")
    
    // Test nonce
    const nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
    console.log("✅ Current nonce:", nonce)
    
    console.log("\n🎉 All checks passed! Ready to deploy.")
    
  } catch (error) {
    console.error("❌ Connection test failed:", error.message)
    
    if (error.message.includes("ENOTFOUND")) {
      console.log("💡 RPC endpoint is unreachable")
    } else if (error.message.includes("Unauthorized")) {
      console.log("💡 API key issue")
    } else if (error.message.includes("insufficient funds")) {
      console.log("💡 Not enough MATIC for gas")
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })