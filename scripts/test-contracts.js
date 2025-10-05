#!/usr/bin/env node

const { ethers } = require('ethers')

// Contract addresses from .env.local
const CONTRACTS = {
  RGC_TOKEN: '0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e',
  AIRDROP: '0xd2D45bdf0e4C8393E9BC57bAd363b01Eaeb377f9',
  CRASH_GAME: '0xf8f6F8f1c656DbD0540C26B3Bfa1969B500AdB5c'
}

const RGC_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)"
]

const AIRDROP_ABI = [
  "function airdropAmount() view returns (uint256)",
  "function claimFee() view returns (uint256)",
  "function getStats() view returns (uint256, uint256, uint256, uint256, uint256)"
]

const CRASH_GAME_ABI = [
  "function minBet() view returns (uint256)",
  "function maxBet() view returns (uint256)",
  "function houseEdge() view returns (uint256)"
]

async function testContracts() {
  console.log('🔍 Testing RogueCoin Contracts on Polygon Mainnet...\n')
  
  const provider = new ethers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/nBAwpGnF4mqnMRtGxC4Pi')
  
  try {
    // Test RGC Token
    console.log('📊 RGC Token Contract:', CONTRACTS.RGC_TOKEN)
    const tokenContract = new ethers.Contract(CONTRACTS.RGC_TOKEN, RGC_TOKEN_ABI, provider)
    
    const [name, symbol, totalSupply, decimals] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.totalSupply(),
      tokenContract.decimals()
    ])
    
    console.log('  ✅ Name:', name)
    console.log('  ✅ Symbol:', symbol)
    console.log('  ✅ Total Supply:', ethers.formatEther(totalSupply), 'tokens')
    console.log('  ✅ Decimals:', decimals.toString())
    
    // Test Airdrop Contract
    console.log('\n🪂 Airdrop Contract:', CONTRACTS.AIRDROP)
    const airdropContract = new ethers.Contract(CONTRACTS.AIRDROP, AIRDROP_ABI, provider)
    
    const [airdropAmount, claimFee, stats] = await Promise.all([
      airdropContract.airdropAmount(),
      airdropContract.claimFee(),
      airdropContract.getStats()
    ])
    
    console.log('  ✅ Airdrop Amount:', ethers.formatEther(airdropAmount), 'RGC')
    console.log('  ✅ Claim Fee:', ethers.formatEther(claimFee), 'POL')
    console.log('  ✅ Total Claimed:', ethers.formatEther(stats[2]), 'RGC')
    console.log('  ✅ Remaining Balance:', ethers.formatEther(stats[4]), 'RGC')
    
    // Test Crash Game Contract
    console.log('\n🎮 Crash Game Contract:', CONTRACTS.CRASH_GAME)
    const gameContract = new ethers.Contract(CONTRACTS.CRASH_GAME, CRASH_GAME_ABI, provider)
    
    const [minBet, maxBet, houseEdge] = await Promise.all([
      gameContract.minBet(),
      gameContract.maxBet(),
      gameContract.houseEdge()
    ])
    
    console.log('  ✅ Min Bet:', ethers.formatEther(minBet), 'RGC')
    console.log('  ✅ Max Bet:', ethers.formatEther(maxBet), 'RGC')
    console.log('  ✅ House Edge:', Number(houseEdge) / 100, '%')
    
    console.log('\n🎉 All contracts are working correctly!')
    console.log('\n🔗 Verification Links:')
    console.log('  • RGC Token: https://polygonscan.com/address/' + CONTRACTS.RGC_TOKEN)
    console.log('  • Airdrop: https://polygonscan.com/address/' + CONTRACTS.AIRDROP)
    console.log('  • Crash Game: https://polygonscan.com/address/' + CONTRACTS.CRASH_GAME)
    
  } catch (error) {
    console.error('❌ Error testing contracts:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('  1. Check if contracts are deployed correctly')
    console.log('  2. Verify contract addresses in .env.local')
    console.log('  3. Ensure Polygon RPC is accessible')
  }
}

testContracts()