const hre = require("hardhat")

async function main() {
  console.log("🧪 Testing Simple Transaction...")

  try {
    const [deployer] = await hre.ethers.getSigners()
    console.log("📡 Sending from:", deployer.address)
    
    const balance = await hre.ethers.provider.getBalance(deployer.address)
    console.log("💰 Balance:", hre.ethers.formatEther(balance), "MATIC")
    
    console.log("🔄 Sending 0.001 MATIC to self as test...")
    
    const tx = await deployer.sendTransaction({
      to: deployer.address,
      value: hre.ethers.parseEther("0.001"),
      gasLimit: 21000,
      gasPrice: hre.ethers.parseUnits("50", "gwei")
    })
    
    console.log("✅ Transaction sent! Hash:", tx.hash)
    console.log("⏳ Waiting for confirmation...")
    
    const receipt = await tx.wait()
    console.log("🎉 Transaction confirmed! Block:", receipt.blockNumber)
    
  } catch (error) {
    console.error("❌ Transaction failed:", error.message)
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Not enough MATIC for gas")
    } else if (error.message.includes("gas")) {
      console.log("💡 Gas price issue")
    } else if (error.message.includes("nonce")) {
      console.log("💡 Nonce problem")
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })