/**
 * Crash Game Backend Server
 * Automatically reveals crash points for pending rounds
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Configuration
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/nBAwpGnF4mqnMRtGxC4Pi';
const CRASH_GAME_ADDRESS = process.env.NEXT_PUBLIC_CRASH_GAME_ADDRESS;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || process.env.PRIVATE_KEY;

const CRASH_GAME_ABI = [
  "event BetPlaced(uint256 indexed roundId, address indexed player, uint256 amount, uint256 clientSeed)",
  "function revealCrash(uint256 roundId, uint256 serverSeed) external",
  "function rounds(uint256) view returns (address player, uint256 betAmount, uint256 clientSeed, uint256 serverSeed, bytes32 serverSeedHash, uint256 crashMultiplier, uint256 cashOutMultiplier, uint256 timestamp, bool settled, bool won)",
  "function currentRoundId() view returns (uint256)"
];

class CrashRevealer {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CRASH_GAME_ADDRESS, CRASH_GAME_ABI, this.wallet);
    this.processedRounds = new Set();
  }

  async start() {
    console.log('🚀 Crash Revealer Server Started');
    console.log(`📍 Contract: ${CRASH_GAME_ADDRESS}`);
    console.log(`👤 Admin: ${this.wallet.address}\n`);

    // Listen for new bets
    this.contract.on("BetPlaced", async (roundId, player, amount, clientSeed) => {
      console.log(`\n🎲 New Bet Placed:`);
      console.log(`   Round ID: ${roundId}`);
      console.log(`   Player: ${player}`);
      console.log(`   Amount: ${ethers.formatEther(amount)} RGC`);
      
      // Wait a short delay (simulate game duration)
      const gameDelay = 3000 + Math.random() * 7000; // 3-10 seconds
      console.log(`   ⏱️  Waiting ${(gameDelay/1000).toFixed(1)}s before revealing...`);
      
      setTimeout(() => this.revealCrash(roundId), gameDelay);
    });

    // Check for any pending rounds on startup
    await this.checkPendingRounds();

    console.log('👂 Listening for new bets...\n');
  }

  async checkPendingRounds() {
    try {
      const currentRoundId = await this.contract.currentRoundId();
      console.log(`🔍 Checking for pending rounds (current: ${currentRoundId})...\n`);

      // Check last 10 rounds for any unrevealed
      const startRound = Math.max(0, Number(currentRoundId) - 10);
      for (let i = startRound; i < currentRoundId; i++) {
        const round = await this.contract.rounds(i);
        
        if (round.betAmount > 0 && round.crashMultiplier === 0n && !round.settled) {
          console.log(`   ⚠️  Found unrevealed round #${i}, revealing now...`);
          await this.revealCrash(i);
        }
      }
    } catch (error) {
      console.error('❌ Error checking pending rounds:', error.message);
    }
  }

  async revealCrash(roundId) {
    // Prevent duplicate processing
    if (this.processedRounds.has(roundId.toString())) {
      return;
    }
    this.processedRounds.add(roundId.toString());

    try {
      // Get round info
      const round = await this.contract.rounds(roundId);
      
      // Check if already revealed
      if (round.crashMultiplier > 0n) {
        console.log(`   ℹ️  Round ${roundId} already revealed`);
        return;
      }

      // Generate server seed (in production, use a secure random source)
      const serverSeed = Math.floor(Math.random() * 1000000000);

      console.log(`\n🎯 Revealing Crash for Round ${roundId}:`);
      console.log(`   Server Seed: ${serverSeed}`);
      
      // Call revealCrash
      const tx = await this.contract.revealCrash(roundId, serverSeed, {
        gasLimit: 200000 // Set reasonable gas limit
      });
      
      console.log(`   📤 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`   ✅ Crash revealed! Gas used: ${receipt.gasUsed.toString()}`);
      
      // Get the revealed crash point
      const updatedRound = await this.contract.rounds(roundId);
      const crashPoint = Number(updatedRound.crashMultiplier) / 100;
      console.log(`   💥 Crash Point: ${crashPoint.toFixed(2)}x\n`);

    } catch (error) {
      console.error(`❌ Error revealing crash for round ${roundId}:`, error.message);
      this.processedRounds.delete(roundId.toString()); // Allow retry
    }
  }

  stop() {
    this.contract.removeAllListeners();
    console.log('\n👋 Crash Revealer Server Stopped');
  }
}

// Start server
const revealer = new CrashRevealer();
revealer.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  revealer.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  revealer.stop();
  process.exit(0);
});
