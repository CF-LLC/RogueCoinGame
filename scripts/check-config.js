#!/usr/bin/env node

// Simple configuration check without importing TypeScript modules
const fs = require('fs')
const path = require('path')

console.log('🚀 RogueCoin Contract Configuration Check\n')

// Read environment variables directly
const envPath = path.join(__dirname, '..', '.env.local')
const envExamplePath = path.join(__dirname, '..', '.env.example')

let envVars = {}

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      envVars[key.trim()] = value.trim()
    }
  })
} else {
  console.log('⚠️  No .env.local file found')
}

const contracts = {
  RGC_TOKEN: envVars.NEXT_PUBLIC_RGC_TOKEN_ADDRESS || process.env.NEXT_PUBLIC_RGC_TOKEN_ADDRESS || '',
  AIRDROP: envVars.NEXT_PUBLIC_AIRDROP_ADDRESS || process.env.NEXT_PUBLIC_AIRDROP_ADDRESS || '',
  CRASH_GAME: envVars.NEXT_PUBLIC_CRASH_GAME_ADDRESS || process.env.NEXT_PUBLIC_CRASH_GAME_ADDRESS || ''
}

console.log('📋 Current Configuration:')
console.log(`   RGC Token: ${contracts.RGC_TOKEN || '❌ Not configured'}`)
console.log(`   Airdrop: ${contracts.AIRDROP || '❌ Not configured'}`)
console.log(`   Crash Game: ${contracts.CRASH_GAME || '❌ Not configured'}\n`)

const missing = []
if (!contracts.RGC_TOKEN) missing.push('RGC_TOKEN')
if (!contracts.AIRDROP) missing.push('AIRDROP')
if (!contracts.CRASH_GAME) missing.push('CRASH_GAME')

if (missing.length === 0) {
  console.log('✅ All contracts configured!')
  console.log('   Your app is ready to use on Polygon mainnet.\n')
} else {
  console.log('❌ Missing contract addresses:')
  missing.forEach(contract => {
    console.log(`   • ${contract}`)
  })
  console.log('\n📚 Next steps:')
  console.log('   1. Deploy contracts using: npx hardhat run scripts/deploy.js --network polygon')
  console.log('   2. Copy the deployed addresses to your .env.local file')
  console.log('   3. See DEPLOYMENT_GUIDE.md for detailed instructions\n')
}

console.log('🔧 Environment Variables Needed in .env.local:')
console.log('   NEXT_PUBLIC_RGC_TOKEN_ADDRESS=0x...')
console.log('   NEXT_PUBLIC_AIRDROP_ADDRESS=0x...')
console.log('   NEXT_PUBLIC_CRASH_GAME_ADDRESS=0x...')

if (!fs.existsSync(envPath)) {
  console.log('\n💡 Quick start:')
  console.log('   cp .env.example .env.local')
  console.log('   # Then edit .env.local with your contract addresses')
}

console.log('\n📖 For full deployment instructions, see DEPLOYMENT_GUIDE.md')