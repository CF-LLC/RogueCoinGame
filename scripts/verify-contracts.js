const { ethers } = require("ethers")
require("dotenv").config()

async function verifyContracts() {
  console.log("🔍 Verifying contract deployment on Polygon mainnet...\n")
  
  // Connect to Polygon mainnet
  const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com")
  
  const contracts = {
    "RGC Token": "0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e",
    "Airdrop": "0xd2D45bdf0e4C8393E9BC57bAd363b01Eaeb377f9",
    "Crash Game": "0xf8f6F8f1c656DbD0540C26B3Bfa1969B500AdB5c"
  }
  
  for (const [name, address] of Object.entries(contracts)) {
    if (!address) {
      console.log(`❌ ${name}: Not configured`)
      continue
    }
    
    try {
      const code = await provider.getCode(address)
      if (code === "0x") {
        console.log(`❌ ${name}: Contract not found at ${address}`)
      } else {
        console.log(`✅ ${name}: Contract deployed at ${address}`)
        console.log(`   Bytecode length: ${code.length} characters`)
      }
    } catch (error) {
      console.log(`❌ ${name}: Error checking ${address} - ${error.message}`)
    }
  }
  
  console.log("\n🌐 Network Info:")
  try {
    const network = await provider.getNetwork()
    console.log(`   Chain ID: ${network.chainId}`)
    console.log(`   Chain Name: ${network.name}`)
  } catch (error) {
    console.log(`   Error getting network info: ${error.message}`)
  }
}

verifyContracts().catch(console.error)