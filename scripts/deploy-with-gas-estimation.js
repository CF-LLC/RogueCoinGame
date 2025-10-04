const hre = require("hardhat")

async function main() {
  console.log("🚀 Smart Contract Deployment with Gas Estimation...")

  try {
    const [deployer] = await hre.ethers.getSigners()
    console.log("📡 Deploying with:", deployer.address)
    
    const balance = await hre.ethers.provider.getBalance(deployer.address)
    console.log("💰 Balance:", hre.ethers.formatEther(balance), "MATIC")
    
    // Get current gas price from network
    const feeData = await hre.ethers.provider.getFeeData()
    console.log("⛽ Network gas price:", hre.ethers.formatUnits(feeData.gasPrice, "gwei"), "gwei")
    
    // Get current nonce
    const nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
    console.log("🔢 Current nonce:", nonce)
    
    console.log("🏗️  Getting RogueCoin factory...")
    const RGCToken = await hre.ethers.getContractFactory("RogueCoin")
    
    // Get deployment transaction for gas estimation
    console.log("📊 Estimating gas...")
    const deployTx = await RGCToken.getDeployTransaction()
    const gasEstimate = await hre.ethers.provider.estimateGas(deployTx)
    console.log("📈 Gas estimate:", gasEstimate.toString())
    
    // Add 20% buffer to gas estimate
    const gasLimit = gasEstimate * BigInt(120) / BigInt(100)
    console.log("🛡️  Gas limit (with buffer):", gasLimit.toString())
    
    // Use network gas price + 10 gwei buffer
    const gasPrice = feeData.gasPrice + hre.ethers.parseUnits("10", "gwei")
    console.log("💸 Using gas price:", hre.ethers.formatUnits(gasPrice, "gwei"), "gwei")
    
    console.log("🚀 Starting deployment...")
    const rgcToken = await RGCToken.deploy({
      gasLimit: gasLimit,
      gasPrice: gasPrice,
      nonce: nonce
    })
    
    console.log("📋 Transaction hash:", rgcToken.deploymentTransaction()?.hash)
    console.log("⏳ Waiting for deployment...")
    
    await rgcToken.waitForDeployment()
    const address = await rgcToken.getAddress()
    
    console.log("🎉 RogueCoin deployed to:", address)
    
    // Verify deployment
    const name = await rgcToken.name()
    const symbol = await rgcToken.symbol()
    const totalSupply = await rgcToken.totalSupply()
    
    console.log("✅ Deployment verified:")
    console.log("- Name:", name)
    console.log("- Symbol:", symbol)
    console.log("- Total Supply:", hre.ethers.formatEther(totalSupply), "RGC")
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message)
    
    if (error.message.includes("gas")) {
      console.log("💡 Try increasing gas limit or price")
    } else if (error.message.includes("nonce")) {
      console.log("💡 Nonce collision - wait and retry")
    } else if (error.message.includes("replacement")) {
      console.log("💡 Transaction replacement issue")
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })