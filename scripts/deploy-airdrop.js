const hre = require("hardhat")

async function main() {
  console.log("🪂 Deploying RogueCoin Airdrop Contract...")

  try {
    const [deployer] = await hre.ethers.getSigners()
    console.log("📡 Deploying with:", deployer.address)
    
    const balance = await hre.ethers.provider.getBalance(deployer.address)
    console.log("💰 Balance:", hre.ethers.formatEther(balance), "MATIC")
    
    // RGC Token address (already deployed)
    const rgcTokenAddress = "0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e"
    console.log("🪙 RGC Token:", rgcTokenAddress)
    
    // Airdrop configuration
    const airdropAmount = hre.ethers.parseEther("1000") // 1000 RGC per claim
    const claimFee = hre.ethers.parseEther("0.001") // 0.001 MATIC fee
    
    console.log("📋 Airdrop Config:")
    console.log("- Amount per claim:", hre.ethers.formatEther(airdropAmount), "RGC")
    console.log("- Claim fee:", hre.ethers.formatEther(claimFee), "MATIC")
    
    // Get current gas price and nonce
    const feeData = await hre.ethers.provider.getFeeData()
    const nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
    console.log("⛽ Network gas price:", hre.ethers.formatUnits(feeData.gasPrice, "gwei"), "gwei")
    console.log("🔢 Current nonce:", nonce)
    
    console.log("🏗️  Getting Airdrop factory...")
    const RogueCoinAirdrop = await hre.ethers.getContractFactory("RogueCoinAirdrop")
    
    // Estimate gas
    console.log("📊 Estimating gas...")
    const deployTx = await RogueCoinAirdrop.getDeployTransaction(
      rgcTokenAddress,
      airdropAmount,
      claimFee
    )
    const gasEstimate = await hre.ethers.provider.estimateGas(deployTx)
    console.log("📈 Gas estimate:", gasEstimate.toString())
    
    // Add 20% buffer
    const gasLimit = gasEstimate * BigInt(120) / BigInt(100)
    const gasPrice = feeData.gasPrice + hre.ethers.parseUnits("10", "gwei")
    console.log("🛡️  Gas limit (with buffer):", gasLimit.toString())
    console.log("💸 Using gas price:", hre.ethers.formatUnits(gasPrice, "gwei"), "gwei")
    
    console.log("🚀 Starting airdrop deployment...")
    const airdrop = await RogueCoinAirdrop.deploy(
      rgcTokenAddress,
      airdropAmount,
      claimFee,
      {
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        nonce: nonce
      }
    )
    
    console.log("📋 Transaction hash:", airdrop.deploymentTransaction()?.hash)
    console.log("⏳ Waiting for deployment...")
    
    await airdrop.waitForDeployment()
    const airdropAddress = await airdrop.getAddress()
    
    console.log("🎉 Airdrop deployed to:", airdropAddress)
    
    // Verify deployment
    const stats = await airdrop.getStats()
    console.log("✅ Deployment verified:")
    console.log("- Airdrop amount:", hre.ethers.formatEther(stats[0]), "RGC")
    console.log("- Claim fee:", hre.ethers.formatEther(stats[1]), "MATIC")
    console.log("- Total claimed:", hre.ethers.formatEther(stats[2]), "RGC")
    console.log("- Contract balance:", hre.ethers.formatEther(stats[4]), "RGC")
    
    return airdropAddress
    
  } catch (error) {
    console.error("❌ Airdrop deployment failed:", error.message)
    throw error
  }
}

main()
  .then((address) => {
    console.log("\n🎯 Airdrop Contract Address:", address)
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })