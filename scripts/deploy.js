const hre = require("hardhat")
const fs = require("fs")
const path = require("path")

async function main() {
  console.log("Starting deployment...")

  const [deployer] = await hre.ethers.getSigners()
  console.log("Deploying contracts with account:", deployer.address)

  const balance = await hre.ethers.provider.getBalance(deployer.address)
  const networkName = hre.network.name
  const currency = networkName.includes("polygon") ? "MATIC" : "ETH"
  console.log("Account balance:", hre.ethers.formatEther(balance), currency)
  console.log("Network:", networkName)

  // Deploy production RGC token
  console.log("\nDeploying RogueCoin Token...")
  const RGCToken = await hre.ethers.getContractFactory("RogueCoin")
  const rgcToken = await RGCToken.deploy()
  await rgcToken.waitForDeployment()
  const rgcTokenAddress = await rgcToken.getAddress()
  console.log("RogueCoin Token deployed to:", rgcTokenAddress)

  // Get token distribution info
  const distribution = await rgcToken.getTokenDistribution()
  console.log("Token Distribution:")
  console.log("- Total Supply:", hre.ethers.formatEther(distribution[0]), "RGC")
  console.log("- Team Allocation:", hre.ethers.formatEther(distribution[1]), "RGC (vested)")
  console.log("- Liquidity:", hre.ethers.formatEther(distribution[2]), "RGC")
  console.log("- Community:", hre.ethers.formatEther(distribution[3]), "RGC")
  console.log("- Airdrop:", hre.ethers.formatEther(distribution[4]), "RGC")
  console.log("- Game Treasury:", hre.ethers.formatEther(distribution[5]), "RGC")

  // Deploy Airdrop Contract
  console.log("\nDeploying Airdrop Contract...")
  const airdropAmount = hre.ethers.parseEther("1000") // 1000 RGC per claim
  const claimFee = hre.ethers.parseEther("0.001") // 0.001 MATIC fee for Polygon

  const RogueCoinAirdrop = await hre.ethers.getContractFactory("RogueCoinAirdrop")
  const airdrop = await RogueCoinAirdrop.deploy(rgcTokenAddress, airdropAmount, claimFee)
  await airdrop.waitForDeployment()
  const airdropAddress = await airdrop.getAddress()
  console.log("Airdrop Contract deployed to:", airdropAddress)

  // Deploy Crash Game Contract
  console.log("\nDeploying Crash Game Contract...")
  const minBet = hre.ethers.parseEther("10") // 10 RGC min
  const maxBet = hre.ethers.parseEther("10000") // 10000 RGC max
  const houseEdge = 200 // 2%

  const CrashGame = await hre.ethers.getContractFactory("CrashGame")
  const crashGame = await CrashGame.deploy(rgcTokenAddress, minBet, maxBet, houseEdge)
  await crashGame.waitForDeployment()
  const crashGameAddress = await crashGame.getAddress()
  console.log("Crash Game Contract deployed to:", crashGameAddress)

  // Fund airdrop contract with tokens
  console.log("\nFunding Airdrop Contract...")
  const airdropFunding = hre.ethers.parseEther("1000000") // 1M RGC
  await rgcToken.transfer(airdropAddress, airdropFunding)
  console.log("Transferred", hre.ethers.formatEther(airdropFunding), "RGC to Airdrop")

  // Fund crash game contract with liquidity
  console.log("\nFunding Crash Game Contract...")
  const gameFunding = hre.ethers.parseEther("500000") // 500K RGC
  await rgcToken.transfer(crashGameAddress, gameFunding)
  console.log("Transferred", hre.ethers.formatEther(gameFunding), "RGC to Crash Game")

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    rgcToken: rgcTokenAddress,
    airdrop: airdropAddress,
    crashGame: crashGameAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  }

  const deploymentsDir = path.join(__dirname, "..", "deployments")
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir)
  }

  const filename = `${hre.network.name}-${Date.now()}.json`
  fs.writeFileSync(path.join(deploymentsDir, filename), JSON.stringify(deploymentInfo, null, 2))

  console.log("\n✅ Deployment complete!")
  console.log("Deployment info saved to:", filename)
  console.log("\nContract Addresses:")
  console.log("-------------------")
  console.log("RGC Token:", rgcTokenAddress)
  console.log("Airdrop:", airdropAddress)
  console.log("Crash Game:", crashGameAddress)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
