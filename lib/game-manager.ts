import { ethers } from "ethers"
import { CONTRACTS, CRASH_GAME_ABI } from "./contracts"

export interface GameRound {
  roundId: number
  player: string
  betAmount: string
  clientSeed: number
  serverSeed: number
  serverSeedHash: string
  crashMultiplier: number
  cashOutMultiplier: number
  timestamp: number
  settled: boolean
  won: boolean
}

export interface GameStats {
  totalBets: string
  totalWinnings: string
  totalLosses: string
  liquidity: string
  currentRoundId: number
}

export class GameManager {
  private contract: ethers.Contract
  private signer: ethers.Signer

  constructor(signer: ethers.Signer) {
    this.signer = signer
    this.contract = new ethers.Contract(CONTRACTS.CRASH_GAME, CRASH_GAME_ABI, signer)
  }

  async placeBet(amount: string, clientSeed: number): Promise<{
    success: boolean
    roundId?: number
    txHash?: string
    error?: string
  }> {
    try {
      const betAmountWei = ethers.parseEther(amount)
      
      // Estimate gas first
      const gasEstimate = await this.contract.placeBet.estimateGas(betAmountWei, clientSeed)
      
      // Place bet with gas limit
      const tx = await this.contract.placeBet(betAmountWei, clientSeed, {
        gasLimit: gasEstimate + BigInt(50000) // Add buffer
      })
      
      const receipt = await tx.wait()
      
      // Parse the BetPlaced event to get round ID
      const betPlacedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract.interface.parseLog(log)
          return parsed?.name === "BetPlaced"
        } catch {
          return false
        }
      })
      
      if (betPlacedEvent) {
        const parsed = this.contract.interface.parseLog(betPlacedEvent)
        const roundId = Number(parsed?.args[0])
        
        // Automatically reveal crash after a short delay (simulating server processing)
        setTimeout(() => {
          this.autoRevealCrash(roundId).catch(console.error)
        }, 2000)
        
        return {
          success: true,
          roundId,
          txHash: tx.hash
        }
      }
      
      return {
        success: false,
        error: "Could not determine round ID from transaction"
      }
    } catch (error: any) {
      console.error("Place bet error:", error)
      return {
        success: false,
        error: this.parseError(error)
      }
    }
  }

  async cashOut(roundId: number, multiplier: number): Promise<{
    success: boolean
    winnings?: string
    txHash?: string
    error?: string
  }> {
    try {
      // Get round details first
      const round = await this.contract.getRound(roundId)
      
      // Check if already cashed out
      if (round.cashOutMultiplier > 0) {
        return {
          success: false,
          error: "Already cashed out this round"
        }
      }
      
      // Check if round is settled
      if (round.settled) {
        return {
          success: false,
          error: "Round already settled"
        }
      }
      
      // Execute cash out on-chain (contract will auto-reveal crash if needed)
      const multiplierInt = Math.floor(multiplier)
      console.log(`📤 Cashing out at ${(multiplier / 100).toFixed(2)}x...`)
      const tx = await this.contract.cashOut(roundId, multiplierInt)
      console.log(`⏳ Waiting for confirmation... TX: ${tx.hash}`)
      const receipt = await tx.wait()
      
      // Parse CashOut event to get actual winnings
      const cashOutEvent = receipt.logs
        .map((log: any) => {
          try {
            return this.contract.interface.parseLog(log)
          } catch {
            return null
          }
        })
        .find((event: any) => event?.name === "CashedOut")
      
      if (cashOutEvent) {
        const winnings = ethers.formatUnits(cashOutEvent.args.winnings, 18)
        console.log(`✅ Cashed out! Won ${winnings} RGC`)
        
        return {
          success: true,
          winnings,
          txHash: receipt.hash
        }
      }
      
      // Fallback: calculate winnings if event not found
      const betAmount = Number(ethers.formatEther(round.betAmount))
      const grossWinnings = betAmount * (multiplier / 100)
      const houseEdge = 2 // 2%
      const netWinnings = grossWinnings * (1 - houseEdge / 100)
      
      console.log(`✅ Cashed out! Won ${netWinnings.toFixed(6)} RGC`)
      
      return {
        success: true,
        winnings: netWinnings.toFixed(6),
        txHash: receipt.hash
      }
    } catch (error: any) {
      console.error("Cash out error:", error)
      
      // Check if error is about crash
      if (error.message?.includes("Multiplier too high")) {
        return {
          success: false,
          error: "Too late! Rocket already crashed"
        }
      }
      
      return {
        success: false,
        error: this.parseError(error)
      }
    }
  }

  async getRound(roundId: number): Promise<GameRound | null> {
    try {
      const round = await this.contract.getRound(roundId)
      
      return {
        roundId,
        player: round.player,
        betAmount: ethers.formatEther(round.betAmount),
        clientSeed: Number(round.clientSeed),
        serverSeed: Number(round.serverSeed),
        serverSeedHash: round.serverSeedHash,
        crashMultiplier: Number(round.crashMultiplier),
        cashOutMultiplier: Number(round.cashOutMultiplier),
        timestamp: Number(round.timestamp),
        settled: round.settled,
        won: round.won
      }
    } catch (error) {
      console.error("Get round error:", error)
      return null
    }
  }

  async getPlayerRounds(playerAddress: string): Promise<number[]> {
    try {
      const roundIds = await this.contract.getPlayerRounds(playerAddress)
      return roundIds.map((id: any) => Number(id))
    } catch (error) {
      console.error("Get player rounds error:", error)
      return []
    }
  }

  async getGameStats(): Promise<GameStats | null> {
    try {
      const stats = await this.contract.getStats()
      
      return {
        totalBets: ethers.formatEther(stats[0]),
        totalWinnings: ethers.formatEther(stats[1]),
        totalLosses: ethers.formatEther(stats[2]),
        liquidity: ethers.formatEther(stats[3]),
        currentRoundId: Number(stats[4])
      }
    } catch (error) {
      console.error("Get stats error:", error)
      return null
    }
  }

  async getBetLimits(): Promise<{ min: string; max: string } | null> {
    try {
      const [minBet, maxBet] = await Promise.all([
        this.contract.minBet(),
        this.contract.maxBet()
      ])
      
      return {
        min: ethers.formatEther(minBet),
        max: ethers.formatEther(maxBet)
      }
    } catch (error) {
      console.error("Get bet limits error:", error)
      return null
    }
  }

  // Auto-reveal crash (simulates server-side processing)
  private async autoRevealCrash(roundId: number): Promise<void> {
    try {
      // Generate a server seed (in production this would be pre-committed)
      const serverSeed = Math.floor(Math.random() * 1000000000)
      
      // Check if we're the owner (only owner can reveal)
      const signerAddress = await this.signer.getAddress()
      const owner = await this.contract.owner()
      
      if (signerAddress.toLowerCase() !== owner.toLowerCase()) {
        console.log("Not owner, cannot reveal crash automatically")
        // In production, this would be done by the backend
        return
      }
      
      // Reveal the crash
      await this.contract.revealCrash(roundId, serverSeed)
      console.log(`Crash revealed for round ${roundId}`)
      
      // Wait a bit then settle any unclaimed losses
      setTimeout(async () => {
        try {
          const round = await this.contract.getRound(roundId)
          if (!round.settled && round.cashOutMultiplier === 0) {
            await this.contract.settleLoss(roundId)
            console.log(`Round ${roundId} settled as loss`)
          }
        } catch (error) {
          console.error("Error settling loss:", error)
        }
      }, 5000) // 5 second grace period for cash outs
      
    } catch (error) {
      console.error("Auto reveal error:", error)
    }
  }

  private parseError(error: any): string {
    if (error.code === "ACTION_REJECTED") {
      return "Transaction rejected by user"
    }
    
    if (error.code === "CALL_EXCEPTION") {
      if (error.reason) {
        return error.reason
      }
      if (error.message?.includes("missing revert data")) {
        return "Transaction failed. Check your balance and try again."
      }
      return "Contract call failed"
    }
    
    if (error.message?.includes("Insufficient balance")) {
      return "Insufficient RGC balance"
    }
    
    if (error.message?.includes("Insufficient allowance")) {
      return "Please approve RGC tokens first"
    }
    
    if (error.message?.includes("Invalid bet amount")) {
      return "Bet amount is outside allowed limits"
    }
    
    if (error.message?.includes("Multiplier too high")) {
      return "Rocket crashed! Cannot cash out at this multiplier"
    }
    
    if (error.message?.includes("Already cashed out")) {
      return "You already cashed out this round"
    }
    
    if (error.message?.includes("Round already settled")) {
      return "This round has already ended"
    }
    
    return error.message || "An unknown error occurred"
  }
}

// Helper function to generate crash point from seeds (for client-side simulation)
export function generateCrashPoint(clientSeed: number, serverSeed: number): number {
  const combinedSeed = parseInt(
    ethers.keccak256(
      ethers.solidityPacked(["uint256", "uint256"], [clientSeed, serverSeed])
    ).slice(0, 10),
    16
  )
  
  // Generate crash point between 1.00x and 10.00x
  const crashPoint = 100 + (combinedSeed % 900) // 100 to 1000 (1.00x to 10.00x)
  return crashPoint / 100 // Convert to decimal
}

// Helper to check if contract is properly deployed
export async function validateGameContract(provider: ethers.Provider): Promise<boolean> {
  try {
    const code = await provider.getCode(CONTRACTS.CRASH_GAME)
    return code !== "0x"
  } catch {
    return false
  }
}