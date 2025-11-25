require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("dotenv").config({ path: '.env.local' })

// Function to get accounts 
function getAccounts() {
  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey) {
    console.warn("⚠️  PRIVATE_KEY not set - using default hardhat account")
    return []
  }
  
  // Remove 'v0x' prefix if present and ensure '0x' prefix
  const cleanKey = privateKey.replace(/^v?0x/, '0x')
  return [cleanKey]
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    polygonMumbai: {
      url: process.env.POLYGON_MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: getAccounts(),
      chainId: 80001,
      gasPrice: 20000000000, // 20 gwei
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-mainnet.g.alchemy.com/v2/nBAwpGnF4mqnMRtGxC4Pi",
      accounts: getAccounts(),
      chainId: 137,
      gasPrice: 60000000000, // 60 gwei - higher than current network
      gas: 10000000, // 10M gas limit - very high for deployment
      timeout: 120000,
      confirmations: 2,
    },
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
}
