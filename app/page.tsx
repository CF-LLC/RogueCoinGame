"use client"

import { useState, useEffect, useRef } from "react"
import { useWeb3 } from "@/contexts/web3-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Rocket, TrendingUp, AlertCircle } from "lucide-react"
import { ethers } from "ethers"
import { CONTRACTS, CRASH_GAME_ABI, RGC_TOKEN_ABI } from "@/lib/contracts"
import { RocketAnimation } from "@/components/rocket-animation"
import { GameHistory } from "@/components/game-history"
import ContractStatus from "@/components/contract-status"
import Image from "next/image"

type GameState = "idle" | "betting" | "playing" | "crashed" | "won"

export default function GamePage() {
  const { account, signer, rgcBalance, refreshBalances } = useWeb3()
  const [gameState, setGameState] = useState<GameState>("idle")
  const [betAmount, setBetAmount] = useState("")
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0)
  const [crashPoint, setCrashPoint] = useState<number | null>(null)
  const [currentRoundId, setCurrentRoundId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [minBet, setMinBet] = useState("0")
  const [maxBet, setMaxBet] = useState("0")
  const [winnings, setWinnings] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (signer) {
      loadGameData()
    }
  }, [signer])

  useEffect(() => {
    if (gameState === "playing") {
      startMultiplierAnimation()
    } else {
      stopMultiplierAnimation()
    }

    return () => stopMultiplierAnimation()
  }, [gameState])

  const loadGameData = async () => {
    if (!signer) return

    // Check if contracts are configured
    if (!CONTRACTS.CRASH_GAME || CONTRACTS.CRASH_GAME === "0x0000000000000000000000000000000000000000") {
      console.warn("Crash game contract not configured")
      setMinBet("0.001") // Default values for UI
      setMaxBet("10")
      return
    }

    try {
      const gameContract = new ethers.Contract(CONTRACTS.CRASH_GAME, CRASH_GAME_ABI, signer)
      
      // Test contract connectivity first
      try {
        const min = await gameContract.minBet()
        const max = await gameContract.maxBet()
        setMinBet(ethers.formatEther(min))
        setMaxBet(ethers.formatEther(max))
      } catch (contractError: any) {
        console.warn("Contract not accessible:", contractError.message)
        // Set sensible defaults if contract isn't available
        setMinBet("0.001")
        setMaxBet("10")
        // Don't show error to user for this, just log it
      }
    } catch (err) {
      console.error("Error loading game data:", err)
      // Set defaults for UI functionality
      setMinBet("0.001")
      setMaxBet("10")
    }
  }

  const startMultiplierAnimation = () => {
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const multiplier = 1.0 + elapsed / 1000
      setCurrentMultiplier(multiplier)

      if (crashPoint && multiplier >= crashPoint) {
        setGameState("crashed")
        setCurrentMultiplier(crashPoint)
        stopMultiplierAnimation()
      } else {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    animationRef.current = requestAnimationFrame(animate)
  }

  const stopMultiplierAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  const handlePlaceBet = async () => {
    if (!signer || !account) {
      setError("Please connect your wallet")
      return
    }

    const amount = Number.parseFloat(betAmount)
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid bet amount")
      return
    }

    if (amount < Number.parseFloat(minBet) || amount > Number.parseFloat(maxBet)) {
      setError(`Bet must be between ${minBet} and ${maxBet} RGC`)
      return
    }

    // Check if contracts are configured
    if (!CONTRACTS.CRASH_GAME || !CONTRACTS.RGC_TOKEN) {
      setError("Game contracts not configured. Switching to demo mode.")
      setDemoMode(true)
      // In demo mode, simulate the game without blockchain
      setLoading(true)
      setTimeout(() => {
        setGameState("playing")
        setCurrentMultiplier(1.0)
        const simulatedCrash = 1.5 + Math.random() * 8.5
        setCrashPoint(simulatedCrash)
        setLoading(false)
        setError(null)
      }, 1000)
      return
    }

    setLoading(true)
    setError(null)
    setTxHash(null)
    setWinnings(null)

    try {
      const gameContract = new ethers.Contract(CONTRACTS.CRASH_GAME, CRASH_GAME_ABI, signer)
      const tokenContract = new ethers.Contract(CONTRACTS.RGC_TOKEN, RGC_TOKEN_ABI, signer)

      const betAmountWei = ethers.parseEther(betAmount)

      // Check token balance first
      const balance = await tokenContract.balanceOf(account)
      if (balance < betAmountWei) {
        setError("Insufficient RGC balance")
        return
      }

      // Check if contracts are valid by testing a simple call
      try {
        const [minBetCheck, maxBetCheck, houseEdge] = await Promise.all([
          gameContract.minBet(),
          gameContract.maxBet(), 
          gameContract.houseEdge()
        ])
        console.log('Game contract status:', {
          minBet: ethers.formatEther(minBetCheck),
          maxBet: ethers.formatEther(maxBetCheck),
          houseEdge: Number(houseEdge) / 100 + '%'
        })
      } catch (contractError) {
        console.error('Game contract check failed:', contractError)
        setError("Game contract not available. Please check if contracts are deployed.")
        return
      }

      // Check allowance
      const allowance = await tokenContract.allowance(account, CONTRACTS.CRASH_GAME)
      if (allowance < betAmountWei) {
        try {
          // Approve tokens
          const approveTx = await tokenContract.approve(CONTRACTS.CRASH_GAME, betAmountWei)
          await approveTx.wait()
        } catch (approveError: any) {
          setError("Failed to approve tokens: " + (approveError.message || "Unknown error"))
          return
        }
      }

      // Generate client seed
      const clientSeed = Math.floor(Math.random() * 1000000)

      // Place bet
      console.log('Placing bet:', {
        amount: ethers.formatEther(betAmountWei) + ' RGC',
        clientSeed,
        balance: ethers.formatEther(balance) + ' RGC',
        allowance: ethers.formatEther(allowance) + ' RGC'
      })
      
      // Try to estimate gas first to catch errors early
      try {
        const gasEstimate = await gameContract.placeBet.estimateGas(betAmountWei, clientSeed)
        console.log('Gas estimate successful:', gasEstimate.toString())
      } catch (gasError: any) {
        console.error('Gas estimation failed:', gasError)
        if (gasError.message.includes('missing revert data')) {
          setError('Bet validation failed. Please check: 1) You have enough RGC tokens, 2) Your bet is within limits, 3) The game is not paused')
        } else {
          setError('Transaction will fail: ' + (gasError.reason || gasError.message || 'Unknown error'))
        }
        return
      }
      
      const tx = await gameContract.placeBet(betAmountWei, clientSeed)
      setTxHash(tx.hash)

      const receipt = await tx.wait()

      // Get round ID from event
      const betPlacedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = gameContract.interface.parseLog(log)
          return parsed?.name === "BetPlaced"
        } catch {
          return false
        }
      })

      if (betPlacedEvent) {
        const parsed = gameContract.interface.parseLog(betPlacedEvent)
        const roundId = parsed?.args[0]
        setCurrentRoundId(Number(roundId))
      }

      await refreshBalances()

      // Simulate game start
      setGameState("playing")
      setCurrentMultiplier(1.0)

      // Simulate crash point (in production, this comes from backend)
      const simulatedCrash = 1.5 + Math.random() * 8.5 // 1.5x to 10x
      setCrashPoint(simulatedCrash)
    } catch (err: any) {
      console.error("Bet error:", err)
      if (err.code === "ACTION_REJECTED") {
        setError("Transaction rejected by user")
      } else if (err.code === "CALL_EXCEPTION") {
        if (err.message.includes("missing revert data")) {
          setError("Transaction failed. This may be due to: insufficient RGC balance, insufficient allowance, or the game contract being paused. Please check your RGC balance and try again.")
        } else {
          setError("Contract call failed. The game may not be available or contracts not deployed.")
        }
      } else if (err.message.includes("Insufficient balance")) {
        setError("Insufficient RGC balance")
      } else if (err.message.includes("User denied")) {
        setError("Transaction rejected by user")
      } else if (err.message.includes("missing revert data")) {
        setError("Transaction failed without specific error. Common causes: insufficient RGC tokens, tokens not approved, or bet amount outside limits.")
      } else {
        setError(err.message || "Failed to place bet")
      }
      setGameState("idle")
    } finally {
      setLoading(false)
    }
  }

  const handleCashOut = async () => {
    if (demoMode) {
      // Demo mode - simulate successful cash out
      const betAmountNum = Number.parseFloat(betAmount) || 1
      const winningsAmount = betAmountNum * currentMultiplier
      setWinnings(winningsAmount.toFixed(2))
      setGameState("won")
      stopMultiplierAnimation()
      return
    }

    if (!signer || currentRoundId === null) return

    setLoading(true)
    setError(null)

    try {
      const gameContract = new ethers.Contract(CONTRACTS.CRASH_GAME, CRASH_GAME_ABI, signer)

      // Cash out at current multiplier
      const multiplierInt = Math.floor(currentMultiplier * 100)
      const tx = await gameContract.cashOut(currentRoundId, multiplierInt)
      await tx.wait()

      // Calculate winnings
      const betAmountNum = Number.parseFloat(betAmount)
      const winningsAmount = betAmountNum * currentMultiplier
      setWinnings(winningsAmount.toFixed(2))

      await refreshBalances()

      setGameState("won")
      stopMultiplierAnimation()
    } catch (err: any) {
      console.error("Cash out error:", err)
      if (err.message.includes("Multiplier too high")) {
        setError("Too late! The rocket crashed.")
        setGameState("crashed")
      } else {
        setError(err.message || "Failed to cash out")
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePlayAgain = () => {
    setGameState("idle")
    setCurrentMultiplier(1.0)
    setCrashPoint(null)
    setCurrentRoundId(null)
    setError(null)
    setTxHash(null)
    setWinnings(null)
    // Keep demo mode state
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ContractStatus />
      
      {/* Demo Mode Indicator */}
      {demoMode && (
        <div className="mb-6">
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>🎮 <strong>Demo Mode</strong> - Playing with simulated blockchain interactions</span>
                <Button 
                  onClick={() => setDemoMode(false)} 
                  variant="outline" 
                  size="sm"
                  className="ml-2"
                >
                  Exit Demo
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Game Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Game Display */}
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="relative aspect-video bg-gradient-to-br from-background via-muted/20 to-background rounded-lg overflow-hidden border border-border">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <Image
                    src={`${process.env.NODE_ENV === 'production' ? '/RogueCoinGame' : ''}/MyCoin.gif`}
                    alt="RogueCoin"
                    width={300}
                    height={300}
                    className="object-contain"
                    unoptimized
                  />
                </div>

                <RocketAnimation
                  multiplier={currentMultiplier}
                  isPlaying={gameState === "playing"}
                  hasCrashed={gameState === "crashed"}
                  hasWon={gameState === "won"}
                />

                {/* Multiplier Display */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                  <div
                    className={`text-6xl font-bold font-mono ${
                      gameState === "crashed"
                        ? "text-destructive"
                        : gameState === "won"
                          ? "text-green-500"
                          : "text-primary"
                    }`}
                  >
                    {currentMultiplier.toFixed(2)}x
                  </div>
                </div>

                {/* Status Messages */}
                {gameState === "crashed" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 backdrop-blur-sm">
                    <div className="text-center space-y-2">
                      <p className="text-4xl font-bold text-destructive">CRASHED!</p>
                      <p className="text-xl text-muted-foreground">Better luck next time</p>
                    </div>
                  </div>
                )}

                {gameState === "won" && winnings && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm">
                    <div className="text-center space-y-2">
                      <p className="text-4xl font-bold text-green-500">YOU WON!</p>
                      <p className="text-2xl text-foreground">+{winnings} RGC</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Game History */}
          <GameHistory />
        </div>

        {/* Betting Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Place Your Bet</CardTitle>
              <CardDescription>Bet RGC and cash out before the crash</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!account ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Connect your wallet to play</AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Balance Display */}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Your RGC Balance</p>
                    <div className="flex items-center gap-2">
                      <Image
                        src={`${process.env.NODE_ENV === 'production' ? '/RogueCoinGame' : ''}/My_Coin.png`}
                        alt="RGC"
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      <p className="text-2xl font-bold">{Number.parseFloat(rgcBalance).toFixed(2)} RGC</p>
                    </div>
                  </div>

                  {/* Bet Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="betAmount">Bet Amount (RGC)</Label>
                    <Input
                      id="betAmount"
                      type="number"
                      placeholder={`Min: ${minBet}, Max: ${maxBet}`}
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      disabled={gameState !== "idle" || loading}
                      className="text-lg"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBetAmount((Number.parseFloat(rgcBalance) * 0.25).toFixed(2))}
                        disabled={gameState !== "idle"}
                      >
                        25%
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBetAmount((Number.parseFloat(rgcBalance) * 0.5).toFixed(2))}
                        disabled={gameState !== "idle"}
                      >
                        50%
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBetAmount((Number.parseFloat(rgcBalance) * 0.75).toFixed(2))}
                        disabled={gameState !== "idle"}
                      >
                        75%
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBetAmount(rgcBalance)}
                        disabled={gameState !== "idle"}
                      >
                        Max
                      </Button>
                    </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Transaction Hash */}
                  {txHash && (
                    <Alert className="border-primary/50 bg-primary/10">
                      <AlertDescription className="text-sm">
                        <a
                          href={`https://polygonscan.com/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-primary"
                        >
                          View transaction
                        </a>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  {gameState === "idle" && (
                    <Button onClick={handlePlaceBet} disabled={loading} className="w-full h-12 text-lg" size="lg">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Placing Bet...
                        </>
                      ) : (
                        <>
                          <Rocket className="mr-2 h-5 w-5" />
                          Place Bet
                        </>
                      )}
                    </Button>
                  )}

                  {gameState === "playing" && (
                    <Button
                      onClick={handleCashOut}
                      disabled={loading}
                      className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Cashing Out...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="mr-2 h-5 w-5" />
                          Cash Out {currentMultiplier.toFixed(2)}x
                        </>
                      )}
                    </Button>
                  )}

                  {(gameState === "crashed" || gameState === "won") && (
                    <Button onClick={handlePlayAgain} className="w-full h-12 text-lg" size="lg">
                      Play Again
                    </Button>
                  )}

                  {/* Game Info */}
                  <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                    <p>Min Bet: {minBet} RGC</p>
                    <p>Max Bet: {maxBet} RGC</p>
                    <p>House Edge: 2%</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* How to Play */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">How to Play</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ol className="list-decimal list-inside space-y-1">
                <li>Enter your bet amount in RGC</li>
                <li>Click "Place Bet" and approve the transaction</li>
                <li>Watch the multiplier rise</li>
                <li>Click "Cash Out" before the rocket crashes</li>
                <li>Win your bet × the multiplier!</li>
              </ol>
              
              {!demoMode && (
                <div className="pt-3 border-t">
                  <Button 
                    onClick={() => setDemoMode(true)} 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    🎮 Try Demo Mode
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
