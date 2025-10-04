const hre = require("hardhat")

async function main() {
  console.log("🎮 Deploying Crash Game Contract...")

  try {
    const [deployer] = await hre.ethers.getSigners()
    console.log("📡 Deploying with:", deployer.address)
    
    const balance = await hre.ethers.provider.getBalance(deployer.address)
    console.log("💰 Balance:", hre.ethers.formatEther(balance), "MATIC")
    
    // RGC Token address (already deployed)
    const rgcTokenAddress = "0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e"
    console.log("🪙 RGC Token:", rgcTokenAddress)
    
    // Game configuration
    const minBet = hre.ethers.parseEther("10") // 10 RGC minimum bet
    const maxBet = hre.ethers.parseEther("10000") // 10,000 RGC maximum bet
    const houseEdge = 200 // 2% house edge (200 basis points)
    
    console.log("📋 Game Config:")
    console.log("- Min bet:", hre.ethers.formatEther(minBet), "RGC")
    console.log("- Max bet:", hre.ethers.formatEther(maxBet), "RGC")
    console.log("- House edge:", houseEdge / 100, "%")
    
    // Get current gas price and nonce
    const feeData = await hre.ethers.provider.getFeeData()
    const nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
    console.log("⛽ Network gas price:", hre.ethers.formatUnits(feeData.gasPrice, "gwei"), "gwei")
    console.log("🔢 Current nonce:", nonce)
    
    console.log("🏗️  Getting CrashGame factory...")
    const CrashGame = await hre.ethers.getContractFactory("CrashGame")
    
    // Estimate gas
    console.log("📊 Estimating gas...")
    const deployTx = await CrashGame.getDeployTransaction(
      rgcTokenAddress,
      minBet,
      maxBet,
      houseEdge
    )
    const gasEstimate = await hre.ethers.provider.estimateGas(deployTx)
    console.log("📈 Gas estimate:", gasEstimate.toString())
    
    // Add 20% buffer
    const gasLimit = gasEstimate * BigInt(120) / BigInt(100)
    const gasPrice = feeData.gasPrice + hre.ethers.parseUnits("10", "gwei")
    console.log("🛡️  Gas limit (with buffer):", gasLimit.toString())
    console.log("💸 Using gas price:", hre.ethers.formatUnits(gasPrice, "gwei"), "gwei")
    
    console.log("🚀 Starting game deployment...")
    const crashGame = await CrashGame.deploy(
      rgcTokenAddress,
      minBet,
      maxBet,
      houseEdge,
      {
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        nonce: nonce
      }
    )
    
    console.log("📋 Transaction hash:", crashGame.deploymentTransaction()?.hash)
    console.log("⏳ Waiting for deployment...")
    
    await crashGame.waitForDeployment()
    const gameAddress = await crashGame.getAddress()
    
    console.log("🎉 Crash Game deployed to:", gameAddress)
    
    // Verify deployment
    const stats = await crashGame.getStats()
    console.log("✅ Deployment verified:")
    console.log("- Total bets:", hre.ethers.formatEther(stats[0]), "RGC")
    console.log("- Total winnings:", hre.ethers.formatEther(stats[1]), "RGC")
    console.log("- Total losses:", hre.ethers.formatEther(stats[2]), "RGC")
    console.log("- Liquidity:", hre.ethers.formatEther(stats[3]), "RGC")
    console.log("- Current round:", stats[4].toString())
    
    return gameAddress
    
  } catch (error) {
    console.error("❌ Game deployment failed:", error.message)
    throw error
  }
}

main()
  .then((address) => {
    console.log("\n🎯 Crash Game Contract Address:", address)
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })