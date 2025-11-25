# Crash Game Backend Server

This server automatically reveals crash points for the on-chain crash game.

## Why is this needed?

The crash game contract uses a two-step process for provable fairness:
1. Player places bet with client seed
2. Owner reveals crash using server seed
3. Player cashes out or settles loss

This server automates step 2, listening for new bets and revealing crashes after a random delay (3-10 seconds).

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Add to your `.env` file (in project root):**
   ```env
   # Admin wallet private key (DO NOT COMMIT THIS!)
   ADMIN_PRIVATE_KEY=your_admin_wallet_private_key_here
   ```
   
   ⚠️ **IMPORTANT**: Never commit your private key! Add `.env` to `.gitignore`

3. **Get your private key:**
   - Open MetaMask
   - Click three dots → Account details → Show private key
   - Copy your admin wallet's private key
   - Paste it in `.env` as `ADMIN_PRIVATE_KEY`

## Running the Server

**Development (auto-restart on changes):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## What it does

- 🎧 Listens for `BetPlaced` events from the contract
- ⏱️ Waits 3-10 seconds (simulates game duration)
- 🎲 Reveals crash point using `revealCrash()`
- 🔍 On startup, checks for any unrevealed rounds and reveals them
- ✅ Enables players to cash out or settle their rounds

## Production Deployment

For production, deploy this server to:
- **Heroku** (free tier)
- **Railway** (free tier)
- **Render** (free tier)
- **AWS Lambda** (serverless)
- **DigitalOcean Droplet** ($5/month)

Keep it running 24/7 so players can complete their games on-chain.

## Security Notes

- Private key should NEVER be in source code
- Use environment variables only
- In production, consider using AWS Secrets Manager or similar
- Server should only be accessible to you (no public endpoints needed)
