# 🎮 Enabling Full On-Chain Game Settlement

## The Problem

The crash game was running in "demo mode" because it needs a backend server to reveal crash points. Without this, games couldn't settle on-chain and stats stayed at 0.

## The Solution

I've created a backend server (`server/crash-revealer.js`) that:
- Listens for new bets on the blockchain
- Automatically reveals crash points after 3-10 seconds
- Enables players to cash out and settle games on-chain
- Updates totalWinnings and totalLosses in the contract

## Setup Instructions

### 1. Install Server Dependencies

```bash
cd server
npm install
```

### 2. Add Your Private Key to `.env`

**⚠️ CRITICAL SECURITY WARNING:**
- NEVER commit your private key to git
- NEVER share your `.env` file
- Add `.env` to `.gitignore` if not already there

Add this line to `/Users/cooperfeatherstone/Documents/github/RogueCoinGame/.env`:

```env
ADMIN_PRIVATE_KEY=your_admin_wallet_private_key_here
```

**To get your private key:**
1. Open MetaMask
2. Click the 3 dots on your admin account
3. Account details → Show private key
4. Enter your password
5. Copy the private key (64 character hex string)
6. Paste it in `.env`

### 3. Run the Backend Server

**For development (in the `server` folder):**
```bash
npm run dev
```

**For production:**
```bash
npm start
```

You'll see:
```
🚀 Crash Revealer Server Started
📍 Contract: 0xf8f6F8f1c656DbD0540C26B3Bfa1969B500AdB5c
👤 Admin: 0x8DA112FcA23e31785e9c69cA92C8f00e999BebF2
👂 Listening for new bets...
```

### 4. Test the Full Flow

1. **Start the backend server** (in one terminal)
2. **Start your Next.js app** (in another terminal): `npm run dev`
3. **Place a bet** in the game
4. **Watch the backend** reveal the crash after 3-10 seconds
5. **Cash out** - this will now settle ON-CHAIN ⛓️
6. **Check admin stats** - totalWinnings/totalLosses will update!

## What Changes

### Before (Demo Mode):
- ❌ Games simulated client-side
- ❌ No on-chain settlement
- ❌ Stats always show 0
- ❌ Message: "[DEMO MODE] Would have won..."

### After (Production Mode):
- ✅ Games settle on blockchain
- ✅ Real transactions with gas fees
- ✅ Stats show actual winnings/losses
- ✅ Message: "Cashed out at X.XXx! Won XXX RGC (settled on-chain)"

## Production Deployment

For 24/7 operation, deploy the backend server to:

### Free Options:
- **Railway.app** - Easy deployment, free tier
- **Render.com** - Free tier with 750hrs/month
- **Fly.io** - Free tier available

### Paid Options:
- **DigitalOcean Droplet** - $5/month
- **AWS EC2** - Pay as you go
- **Heroku** - $7/month

### Deployment Steps (Railway example):

1. Push your code to GitHub
2. Go to railway.app
3. Click "New Project" → "Deploy from GitHub"
4. Select your repo
5. Add environment variables:
   - `NEXT_PUBLIC_RPC_URL`
   - `NEXT_PUBLIC_CRASH_GAME_CONTRACT`
   - `ADMIN_PRIVATE_KEY`
6. Set start command: `cd server && npm start`
7. Deploy!

## Monitoring

The server logs all activity:
- 🎲 New bets detected
- ⏱️ Countdown to reveal
- 💥 Crash points revealed
- ✅ Gas used per transaction

## Costs

Each `revealCrash()` call costs gas:
- **Polygon**: ~$0.001 - $0.01 per reveal
- Paid from admin wallet
- Consider adding a small fee to game to cover gas

## Security Notes

1. **Private Key Security:**
   - Never commit to git
   - Use environment variables only
   - Consider AWS Secrets Manager for production

2. **Server Security:**
   - No public endpoints (event listener only)
   - Only needs RPC access
   - Can run behind VPN

3. **Monitoring:**
   - Set up alerts for failed transactions
   - Monitor admin wallet balance
   - Log all reveals for auditing

## Troubleshooting

**"Insufficient funds for gas"**
- Add POL to your admin wallet

**"Invalid server seed"**
- Contract expects specific seed generation
- Check the revealCrash implementation

**"Round already revealed"**
- Normal - prevents duplicate reveals
- Server skips already-revealed rounds

**Backend not detecting bets**
- Check RPC_URL is correct
- Verify contract address
- Ensure websocket connection isn't blocked

## Alternative: Auto-Reveal on Cash Out

If you don't want to run a backend server, you could modify the contract to auto-reveal when players cash out. This would require redeploying the contract. Let me know if you want this approach instead!
