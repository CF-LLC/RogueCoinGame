const hre = require("hardhat")

async function main() {
  console.log("🔍 Debug Contract Deployment...")

  try {
    const [deployer] = await hre.ethers.getSigners()
    console.log("📡 Deployer:", deployer.address)
    
    const balance = await hre.ethers.provider.getBalance(deployer.address)
    console.log("💰 Balance:", hre.ethers.formatEther(balance), "MATIC")
    
    console.log("🏗️  Getting contract factory...")
    const RGCToken = await hre.ethers.getContractFactory("RogueCoin")
    console.log("✅ Contract factory created")
    
    console.log("📦 Getting deployment transaction...")
    const deployTx = await RGCToken.getDeployTransaction()
    console.log("✅ Deployment transaction created")
    console.log("📊 Gas estimate:", deployTx.gasLimit?.toString() || "auto")
    
    console.log("💸 Estimating gas...")
    const gasEstimate = await hre.ethers.provider.estimateGas(deployTx)
    console.log("✅ Gas estimate:", gasEstimate.toString())
    
    console.log("🚀 Attempting deployment...")
    const rgcToken = await RGCToken.deploy()
    console.log("✅ Deploy function called")
    
    console.log("⏳ Waiting for deployment...")
    await rgcToken.waitForDeployment()
    
    const address = await rgcToken.getAddress()
    console.log("🎉 Deployed to:", address)
    
  } catch (error) {
    console.error("❌ Error details:")
    console.error("Message:", error.message)
    console.error("Code:", error.code)
    console.error("Stack:", error.stack)
    
    if (error.message.includes("gas")) {
      console.log("💡 Gas-related issue detected")
    } else if (error.message.includes("revert")) {
      console.log("💡 Contract execution reverted")
    } else if (error.message.includes("network")) {
      console.log("💡 Network connectivity issue")
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Uncaught error:", error)
    process.exit(1)
  })