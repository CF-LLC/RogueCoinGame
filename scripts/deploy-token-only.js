const hre = require("hardhat")

async function main() {
  console.log("🚀 Deploying RogueCoin Token Only...")

  const [deployer] = await hre.ethers.getSigners()
  console.log("Deploying with account:", deployer.address)

  const balance = await hre.ethers.provider.getBalance(deployer.address)
  console.log("Account balance:", hre.ethers.formatEther(balance), "MATIC")
  console.log("Network:", hre.network.name)

  try {
    // Deploy only RGC token
    console.log("\n📦 Deploying RogueCoin Token...")
    const RGCToken = await hre.ethers.getContractFactory("RogueCoin")
    
    console.log("⏳ Sending deployment transaction...")
    const rgcToken = await RGCToken.deploy()
    
    console.log("⏳ Waiting for deployment confirmation...")
    await rgcToken.waitForDeployment()
    
    const rgcTokenAddress = await rgcToken.getAddress()
    console.log("✅ RogueCoin Token deployed to:", rgcTokenAddress)

    // Get basic token info
    const name = await rgcToken.name()
    const symbol = await rgcToken.symbol()
    const totalSupply = await rgcToken.totalSupply()
    
    console.log("\n📊 Token Info:")
    console.log("- Name:", name)
    console.log("- Symbol:", symbol)
    console.log("- Total Supply:", hre.ethers.formatEther(totalSupply), "RGC")
    
    console.log("\n🎉 Token deployment successful!")
    console.log("📝 Save this address:", rgcTokenAddress)
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message)
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })