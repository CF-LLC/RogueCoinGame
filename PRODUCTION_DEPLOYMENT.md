# 🚀 Production Deployment Guide - RogueCoin on Polygon

## ✅ Production-Ready Features

Your RogueCoin token is now production-ready with the following features:

### 🪙 **Token Features**
- **Total Supply**: 1 billion RGC tokens (fixed, no minting)
- **Deflationary**: Burnable tokens for supply reduction
- **Anti-Whale**: Transaction and wallet limits (2% of supply initially)
- **Team Vesting**: 15% locked for 24 months with linear release
- **Emergency Controls**: Pausable and blacklist functionality
- **Gas Optimized**: Built for Polygon's low-cost environment

### 📊 **Token Distribution**
- **30%** (300M) - Game Treasury & Rewards
- **20%** (200M) - Liquidity Pool
- **30%** (300M) - Community Rewards
- **15%** (150M) - Team (24-month vesting)
- **5%** (50M) - Airdrop

### 🛡️ **Security Features**
- Anti-bot protection during launch
- Trading can be enabled only once
- Blacklist functionality for bad actors
- Reentrancy protection
- Emergency pause mechanism
- Vesting smart contract for team tokens

## 🎯 **Pre-Launch Checklist**

### 1. **Security Audit** ⚠️ CRITICAL
```bash
# Recommended audit firms:
# - OpenZeppelin Security
# - ConsenSys Diligence  
# - Trail of Bits
# - Hacken
```

### 2. **Test on Mumbai First**
```bash
# Switch to testnet
sed -i 's/NEXT_PUBLIC_CHAIN_ID=137/NEXT_PUBLIC_CHAIN_ID=80001/' .env

# Deploy to Mumbai
npm run compile
npm run deploy:mumbai

# Test all functionality
# - Token transfers
# - Game mechanics
# - Airdrop system
# - Admin functions
```

### 3. **Prepare Polygon Mainnet**
```bash
# You need MATIC for gas fees
# Minimum: 100 MATIC for deployment + operations
# Get MATIC from exchanges: Binance, Coinbase, etc.
```

## 🚀 **Production Deployment Steps**

### Step 1: Final Configuration
```bash
# Ensure mainnet settings
export NEXT_PUBLIC_CHAIN_ID=137
export POLYGON_RPC_URL="https://polygon-rpc.com"

# Double-check private key has sufficient MATIC
```

### Step 2: Deploy to Polygon Mainnet
```bash
# Compile contracts
npm run compile

# Deploy to Polygon mainnet
npm run deploy:polygon
```

### Step 3: Verify Contracts
```bash
# Verify on Polygonscan (automatic in script)
# Manual verification if needed:
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
```

### Step 4: Update Environment
```bash
# Update .env with deployed addresses
NEXT_PUBLIC_RGC_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_AIRDROP_ADDRESS=0x...
NEXT_PUBLIC_CRASH_GAME_ADDRESS=0x...
```

### Step 5: Configure Token
```bash
# Important: Set correct team wallet
# Call setTeamWallet() with actual team address

# Configure initial limits if needed
# Default: 2% max transaction/wallet

# DO NOT enable trading yet!
```

## 🎮 **Post-Deployment Configuration**

### 1. **Liquidity Setup**
```bash
# Add liquidity to DEX (QuickSwap, SushiSwap, etc.)
# Recommended: 50-100 ETH worth of MATIC + equivalent RGC
# Lock liquidity for minimum 6 months
```

### 2. **Team Wallet Configuration**
```bash
# Set proper team wallet (multisig recommended)
# Configure vesting parameters
# Test team token release functionality
```

### 3. **Game Treasury Setup**
```bash
# Transfer game treasury tokens to game contract
# Configure reward mechanisms
# Set up automated distribution
```

### 4. **Airdrop Preparation**
```bash
# Fund airdrop contract with RGC tokens
# Prepare airdrop list
# Set appropriate claim fees
```

### 5. **Enable Trading** ⚠️ FINAL STEP
```bash
# Only after everything is ready:
# - Liquidity added
# - Team configured  
# - Game mechanics tested
# - Community announced

# Call enableTrading() - THIS CANNOT BE UNDONE!
```

## 🛠️ **Admin Functions**

### Token Management
```solidity
// Pause trading (emergency only)
contract.pause()

// Set transaction limits
contract.setMaxTransactionAmount(amount)
contract.setMaxWalletAmount(amount)

// Blacklist addresses
contract.setBlacklisted(address, true)

// Remove limits (after stable launch)
contract.removeLimits()
```

### Team Vesting
```solidity
// Release vested tokens
contract.releaseTeamTokens()

// Check available tokens
contract.getReleasableTeamTokens()
```

## 🔐 **Security Best Practices**

### 1. **Use Multisig Wallets**
- Owner wallet should be multisig (3/5 or 5/7)
- Team wallet should be multisig
- Consider timelock for critical functions

### 2. **Gradual Decentralization**
- Start with more control, gradually reduce
- Remove limits after price stabilizes
- Transfer ownership to DAO when ready

### 3. **Monitoring**
- Set up transaction monitoring
- Watch for unusual trading patterns
- Monitor contract interactions

## 📈 **Launch Strategy**

### Phase 1: Soft Launch (Days 1-7)
- Deploy contracts
- Add initial liquidity
- Enable trading for whitelisted addresses
- Test all systems

### Phase 2: Public Launch (Week 2)
- Enable public trading
- Announce to community
- Start airdrop campaign
- Begin game rewards

### Phase 3: Growth (Month 1+)
- Remove transaction limits
- Increase game rewards
- Partner integrations
- Marketing campaigns

## ⚠️ **Important Warnings**

1. **NEVER** share your private key
2. **ALWAYS** test on Mumbai first
3. **GET** a security audit before launch
4. **DOUBLE-CHECK** all addresses before deployment
5. **VERIFY** contracts on Polygonscan
6. **BACKUP** deployment information
7. **ENABLE TRADING ONLY ONCE** - cannot be reversed

## 📞 **Emergency Procedures**

If issues arise:
1. `pause()` - Stops all transfers immediately
2. `setBlacklisted()` - Block specific addresses
3. Contact audit firm if exploit suspected
4. Communicate transparently with community

---

Your RogueCoin is now ready for production deployment on Polygon! 🎉

**Estimated Gas Costs on Polygon:**
- Token deployment: ~$2-5
- Game contracts: ~$3-8
- Total deployment: ~$10-20

**Next Step**: Deploy to Mumbai testnet first for final testing!