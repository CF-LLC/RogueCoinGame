const hre = require("hardhat")

async function main() {
  console.log("💰 Funding Deployed Contracts with RGC Tokens...")

  try {
    const [deployer] = await hre.ethers.getSigners()
    console.log("📡 Funding from:", deployer.address)
    
    const balance = await hre.ethers.provider.getBalance(deployer.address)
    console.log("💰 MATIC Balance:", hre.ethers.formatEther(balance), "MATIC")
    
    // Contract addresses
    const rgcTokenAddress = "0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e"
    const airdropAddress = "0xd2D45bdf0e4C8393E9BC57bAd363b01Eaeb377f9"
    const gameAddress = "0xf8f6F8f1c656DbD0540C26B3Bfa1969B500AdB5c"
    
    console.log("📋 Contract Addresses:")
    console.log("- RGC Token:", rgcTokenAddress)
    console.log("- Airdrop:", airdropAddress)
    console.log("- Game:", gameAddress)
    
    // Get RGC token contract
    const RGCToken = await hre.ethers.getContractFactory("RogueCoin")
    const rgcToken = RGCToken.attach(rgcTokenAddress)
    
    // Check deployer's RGC balance
    const deployerRGCBalance = await rgcToken.balanceOf(deployer.address)
    console.log("🪙 Deployer RGC Balance:", hre.ethers.formatEther(deployerRGCBalance), "RGC")
    
    // Funding amounts
    const airdropFunding = hre.ethers.parseEther("1000000") // 1M RGC for airdrops
    const gameFunding = hre.ethers.parseEther("500000") // 500K RGC for game liquidity
    
    console.log("📦 Funding Plan:")
    console.log("- Airdrop:", hre.ethers.formatEther(airdropFunding), "RGC")
    console.log("- Game:", hre.ethers.formatEther(gameFunding), "RGC")
    
    // Get current gas price and nonce
    const feeData = await hre.ethers.provider.getFeeData()
    let nonce = await hre.ethers.provider.getTransactionCount(deployer.address)
    const gasPrice = feeData.gasPrice + hre.ethers.parseUnits("5", "gwei")
    
    console.log("⛽ Using gas price:", hre.ethers.formatUnits(gasPrice, "gwei"), "gwei")
    
    // Fund Airdrop Contract
    console.log("\n🪂 Funding Airdrop Contract...")
    const airdropTx = await rgcToken.transfer(airdropAddress, airdropFunding, {
      gasPrice: gasPrice,
      nonce: nonce++
    })
    console.log("📋 Airdrop funding tx:", airdropTx.hash)
    await airdropTx.wait()
    console.log("✅ Airdrop funded successfully!")
    
    // Fund Game Contract
    console.log("\n🎮 Funding Game Contract...")
    const gameTx = await rgcToken.transfer(gameAddress, gameFunding, {
      gasPrice: gasPrice,
      nonce: nonce++
    })
    console.log("📋 Game funding tx:", gameTx.hash)
    await gameTx.wait()
    console.log("✅ Game funded successfully!")
    
    // Verify balances
    console.log("\n📊 Final Contract Balances:")
    const airdropBalance = await rgcToken.balanceOf(airdropAddress)
    const gameBalance = await rgcToken.balanceOf(gameAddress)
    const finalDeployerBalance = await rgcToken.balanceOf(deployer.address)
    
    console.log("- Airdrop Contract:", hre.ethers.formatEther(airdropBalance), "RGC")
    console.log("- Game Contract:", hre.ethers.formatEther(gameBalance), "RGC")
    console.log("- Deployer Remaining:", hre.ethers.formatEther(finalDeployerBalance), "RGC")
    
    console.log("\n🎉 All contracts funded successfully!")
    
  } catch (error) {
    console.error("❌ Funding failed:", error.message)
    throw error
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })