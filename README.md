# 🚀 RogueCoin - Polygon Crash Game

A decentralized crash game built on Polygon blockchain with RogueCoin (RGC) token.

## 🌐 Live Demo

**Production Site:** [https://cf-llc.github.io/RogueCoinGame/](https://cf-llc.github.io/RogueCoinGame/)

## 🪙 Contract Addresses (Polygon Mainnet)

- **RGC Token:** `0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e`
- **Airdrop Contract:** `0xd2D45bdf0e4C8393E9BC57bAd363b01Eaeb377f9`
- **Crash Game Contract:** `0xf8f6F8f1c656DbD0540C26B3Bfa1969B500AdB5c`

## ✨ Features

### 🎮 **Crash Game**
- Place bets using RGC tokens
- Watch the multiplier rise in real-time
- Cash out before the crash to win
- Provably fair randomness
- Anti-whale protection

### 🪂 **Token Airdrop**
- Claim 1,000 RGC tokens
- Small MATIC fee (0.001)
- One claim per wallet
- Funded with 1M RGC

### 🪙 **RGC Token Features**
- **Total Supply:** 1 billion RGC
- **Team Vesting:** 24-month linear release
- **Anti-whale limits:** 2% max transaction/wallet
- **Burnable & Pausable**
- **Trading controls**

## 🔧 Technology Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, Radix UI
- **Blockchain:** Polygon (MATIC), Ethers.js v6
- **Smart Contracts:** Solidity 0.8.20, OpenZeppelin v5
- **Development:** Hardhat, GitHub Actions
- **Deployment:** GitHub Pages (Static Export)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- MATIC tokens for gas fees

### Installation

```bash
# Clone the repository
git clone https://github.com/CF-LLC/RogueCoinGame.git
cd RogueCoinGame

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Build and export static files
npm run build

# The static files will be in the 'out' directory
```

## 🎮 How to Play

1. **Connect Wallet:** Connect MetaMask to Polygon Mainnet
2. **Get RGC Tokens:** Claim from airdrop or buy on exchanges
3. **Place Bet:** Enter bet amount and click "Place Bet"
4. **Watch Multiplier:** See the rocket fly and multiplier rise
5. **Cash Out:** Click "Cash Out" before the crash to win!

## 📱 Mobile Support

Fully responsive design works on:
- Desktop browsers
- Mobile web browsers
- MetaMask mobile app

## 🔒 Security Features

- **Smart Contract Audited:** Professional tokenomics
- **ReentrancyGuard:** Protection against reentrancy attacks
- **Pausable Contracts:** Emergency stop functionality
- **Access Controls:** Owner-only administrative functions
- **Rate Limiting:** Anti-spam protection

## 🌍 Network Information

### Polygon Mainnet
- **Chain ID:** 137
- **RPC URL:** https://polygon-rpc.com
- **Explorer:** https://polygonscan.com
- **Currency:** MATIC

### Adding Polygon to MetaMask
The app will automatically prompt you to add Polygon network.

## 📊 Token Distribution

- **Team (Vested):** 200M RGC (20%) - 24 months
- **Liquidity:** 300M RGC (30%)
- **Community:** 250M RGC (25%)
- **Airdrop:** 150M RGC (15%)
- **Game Treasury:** 100M RGC (10%)

## 🛠️ Development

### Environment Variables

Create a `.env.local` file:

```bash
# Contract addresses are already configured for mainnet
NEXT_PUBLIC_RGC_TOKEN_ADDRESS=0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e
NEXT_PUBLIC_AIRDROP_ADDRESS=0xd2D45bdf0e4C8393E9BC57bAd363b01Eaeb377f9
NEXT_PUBLIC_CRASH_GAME_ADDRESS=0xf8f6F8f1c656DbD0540C26B3Bfa1969B500AdB5c
NEXT_PUBLIC_CHAIN_ID=137
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run compile      # Compile smart contracts
npm run test         # Run contract tests
```

### Smart Contract Development

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Polygon mainnet (admin only)
npm run deploy:polygon
```

## 🚀 Deployment

### Automatic Deployment
- **GitHub Actions** automatically deploys to GitHub Pages
- **Trigger:** Push to `main` branch
- **URL:** https://cf-llc.github.io/RogueCoinGame/

### Manual Deployment

```bash
# Build static export
npm run build

# Deploy the 'out' directory to your hosting provider
```

## 🔗 Links

- **Live App:** https://cf-llc.github.io/RogueCoinGame/
- **RGC Token:** https://polygonscan.com/address/0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e
- **Airdrop:** https://polygonscan.com/address/0xd2D45bdf0e4C8393E9BC57bAd363b01Eaeb377f9
- **Game Contract:** https://polygonscan.com/address/0xf8f6F8f1c656DbD0540C26B3Bfa1969B500AdB5c

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/CF-LLC/RogueCoinGame/issues)
- **Twitter:** [@RogueCoinGame](https://twitter.com/RogueCoinGame)
- **Telegram:** [RogueCoin Community](https://t.me/RogueCoinGame)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**⚠️ Disclaimer:** This is a game of chance. Only bet what you can afford to lose. Smart contracts are provided as-is.
