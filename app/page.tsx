"use client"

import { useState, useEffect, useRef } from "react"
import { useWeb3 } from "@/contexts/web3-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Rocket, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import { ethers } from "ethers"
import { CONTRACTS, RGC_TOKEN_ABI } from "@/lib/contracts"
import { GameManager, generateCrashPoint } from "@/lib/game-manager"
import { RocketAnimation } from "@/components/rocket-animation"
import { GameHistory } from "@/components/game-history"
import { WelcomeScreen } from "@/components/welcome-screen"
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
  const [success, setSuccess] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [minBet, setMinBet] = useState("0")
  const [maxBet, setMaxBet] = useState("0")
  const [winnings, setWinnings] = useState<string | null>(null)
  const [gameManager, setGameManager] = useState<GameManager | null>(null)
  const [crashRevealed, setCrashRevealed] = useState(false)
  const animationRef = useRef<number | null>(null)
  const gameStartTime = useRef<number | null>(null)

  useEffect(() => {
    if (signer) {
      const manager = new GameManager(signer)
      setGameManager(manager)
      loadGameData(manager)
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

  const loadGameData = async (manager?: GameManager) => {
    const gameManagerToUse = manager || gameManager
    if (!gameManagerToUse) {
      setMinBet("0.001") // Default values for UI
      setMaxBet("10")
      return
    }

    try {
      const limits = await gameManagerToUse.getBetLimits()
      if (limits) {
        setMinBet(limits.min)
        setMaxBet(limits.max)
      } else {
        setMinBet("0.001")
        setMaxBet("10")
      }
    } catch (err) {
      console.error("Error loading game data:", err)
      setMinBet("0.001")
      setMaxBet("10")
    }
  }

  const startMultiplierAnimation = () => {
    gameStartTime.current = Date.now()
    setCrashRevealed(false)
    
    const animate = () => {
      if (!gameStartTime.current) return
      
      const elapsed = Date.now() - gameStartTime.current
      const newMultiplier = 1.0 + elapsed / 2000 // Slower animation: 1x per 2 seconds
      setCurrentMultiplier(newMultiplier)

      // Check if we have a crash point and reached it
      if (crashPoint && newMultiplier >= crashPoint && !crashRevealed) {
        setCrashRevealed(true)
        setGameState("crashed")
        setCurrentMultiplier(crashPoint)
        stopMultiplierAnimation()
        
        // Auto-settle loss after a short delay
        setTimeout(() => {
          if (currentRoundId && gameManager) {
            gameManager.getRound(currentRoundId).then(round => {
              if (round && !round.settled && round.cashOutMultiplier === 0) {
                setError("Round settled as loss - rocket crashed!")
              }
            }).catch(console.error)
          }
        }, 2000)
        
        return
      }

      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
  }

  const stopMultiplierAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    gameStartTime.current = null
  }

  const handlePlaceBet = async () => {
    if (!gameManager || !account) {
      setError("Game not available - please ensure wallet is connected")
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

    if (amount > Number.parseFloat(rgcBalance)) {
      setError("Insufficient RGC balance")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setTxHash(null)
    setWinnings(null)
    setGameState("betting")

    try {
      // Check and approve tokens if needed
      const tokenContract = new ethers.Contract(CONTRACTS.RGC_TOKEN, RGC_TOKEN_ABI, signer!)
      const betAmountWei = ethers.parseEther(betAmount)
      
      // Check allowance
      const allowance = await tokenContract.allowance(account, CONTRACTS.CRASH_GAME)
      if (allowance < betAmountWei) {
        setSuccess("Approving RGC tokens...")
        const approveTx = await tokenContract.approve(CONTRACTS.CRASH_GAME, betAmountWei)
        await approveTx.wait()
        setSuccess("Tokens approved! Placing bet...")
      }

      // Generate client seed
      const clientSeed = Math.floor(Math.random() * 1000000)

      // Place bet using game manager
      const result = await gameManager.placeBet(betAmount, clientSeed)
      
      if (!result.success) {
        setError(result.error || "Failed to place bet")
        setGameState("idle")
        return
      }

      setCurrentRoundId(result.roundId!)
      setTxHash(result.txHash!)
      setSuccess("🚀 Bet placed! Rocket launching...")

      await refreshBalances()

      // Generate crash point for client-side simulation
      const serverSeed = Math.floor(Math.random() * 1000000000) // This would come from server in production
      const simulatedCrashPoint = generateCrashPoint(clientSeed, serverSeed)
      setCrashPoint(simulatedCrashPoint)

      // Start game
      setGameState("playing")
      setCurrentMultiplier(1.0)

    } catch (err: any) {
      console.error("Bet error:", err)
      setError(err.message || "Failed to place bet")
      setGameState("idle")
    } finally {
      setLoading(false)
    }
  }

  const handleCashOut = async () => {
    if (!gameManager || currentRoundId === null) {
      setError("No active round to cash out")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Cash out at current multiplier (convert to integer format expected by contract)
      const multiplierInt = Math.floor(currentMultiplier * 100)
      const result = await gameManager.cashOut(currentRoundId, multiplierInt)
      
      if (!result.success) {
        setError(result.error || "Failed to cash out")
        
        // If the error is about crashing, update game state
        if (result.error?.includes("crashed") || result.error?.includes("Too late")) {
          setGameState("crashed")
        }
        return
      }

      // Success!
      setWinnings(result.winnings!)
      setSuccess(`🎉 Cashed out at ${currentMultiplier.toFixed(2)}x! Won ${result.winnings} RGC`)
      setTxHash(result.txHash!)
      
      await refreshBalances()

      setGameState("won")
      stopMultiplierAnimation()
    } catch (err: any) {
      console.error("Cash out error:", err)
      setError(err.message || "Failed to cash out")
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
    setSuccess(null)
    setTxHash(null)
    setWinnings(null)
    setCrashRevealed(false)
    stopMultiplierAnimation()
  }

  return (
    <>
      {/* Show Welcome Screen if no wallet connected */}
      <WelcomeScreen />
      
      {/* Show Game only if wallet is connected */}
      {account && (
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-8">
          <ContractStatus />
          
          {/* Mobile Layout: How to Play at the top */}
          <div className="lg:hidden mb-4">
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">How to Play</CardTitle>
              </CardHeader>
              <CardContent className="text-xs sm:text-sm text-muted-foreground space-y-2">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Enter your bet amount in RGC</li>
                  <li>Click "Place Bet" and approve the transaction</li>
                  <li>Watch the multiplier rise</li>
                  <li>Click "Cash Out" before the rocket crashes</li>
                  <li>Win your bet × the multiplier!</li>
                </ol>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Game Display */}
              <Card className="border-primary/20 shadow-2xl">
                <CardContent className="p-2 sm:p-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-purple-500/30">
                    <RocketAnimation
                      multiplier={currentMultiplier}
                      isPlaying={gameState === "playing"}
                      hasCrashed={gameState === "crashed"}
                      hasWon={gameState === "won"}
                    />

                    {/* Status Messages Overlay */}
                    {gameState === "crashed" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 backdrop-blur-sm">
                        <div className="text-center space-y-2 sm:space-y-4 animate-pulse px-4">
                          <div className="text-4xl sm:text-6xl lg:text-8xl">💥</div>
                          <p className="text-2xl sm:text-4xl lg:text-5xl font-bold text-red-400 drop-shadow-lg">CRASHED!</p>
                          <p className="text-lg sm:text-xl lg:text-2xl text-red-300">At {currentMultiplier.toFixed(2)}x multiplier</p>
                          <p className="text-sm sm:text-base lg:text-lg text-red-200">Better luck next time!</p>
                        </div>
                      </div>
                    )}

                    {gameState === "won" && winnings && (
                      <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 backdrop-blur-sm">
                        <div className="text-center space-y-2 sm:space-y-4 animate-bounce px-4">
                          <div className="text-4xl sm:text-6xl lg:text-8xl">🎉</div>
                          <p className="text-2xl sm:text-4xl lg:text-5xl font-bold text-green-400 drop-shadow-lg">YOU WON!</p>
                          <p className="text-xl sm:text-2xl lg:text-3xl text-green-300">+{winnings} RGC</p>
                          <p className="text-sm sm:text-lg lg:text-xl text-green-200">Cashed out at {currentMultiplier.toFixed(2)}x</p>
                        </div>
                      </div>
                    )}

                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                        <div className="text-center space-y-2 sm:space-y-4 px-4">
                          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary mx-auto" />
                          <p className="text-sm sm:text-lg lg:text-xl text-white">🚀 Preparing launch...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Game History - Hidden on mobile, shown on desktop */}
              <div className="hidden lg:block">
                <GameHistory />
              </div>
            </div>

            {/* Betting Panel */}
            <div className="space-y-4 sm:space-y-6">
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
                      <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Your RGC Balance</p>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Image
                            src={`${process.env.NODE_ENV === 'production' ? '/RogueCoinGame' : ''}/My_Coin.png`}
                            alt="RGC"
                            width={20}
                            height={20}
                            className="sm:w-6 sm:h-6 object-contain"
                          />
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold">{Number.parseFloat(rgcBalance).toFixed(2)} RGC</p>
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
                        <div className="grid grid-cols-4 gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBetAmount((Number.parseFloat(rgcBalance) * 0.25).toFixed(2))}
                            disabled={gameState !== "idle"}
                            className="text-xs sm:text-sm px-1 sm:px-3"
                          >
                            25%
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBetAmount((Number.parseFloat(rgcBalance) * 0.5).toFixed(2))}
                            disabled={gameState !== "idle"}
                            className="text-xs sm:text-sm px-1 sm:px-3"
                          >
                            50%
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBetAmount((Number.parseFloat(rgcBalance) * 0.75).toFixed(2))}
                            disabled={gameState !== "idle"}
                            className="text-xs sm:text-sm px-1 sm:px-3"
                          >
                            75%
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBetAmount(rgcBalance)}
                            disabled={gameState !== "idle"}
                            className="text-xs sm:text-sm px-1 sm:px-3"
                          >
                            Max
                          </Button>
                        </div>
                      </div>

                      {/* Success Display */}
                      {success && (
                        <Alert className="border-green-500/50 bg-green-500/10">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <AlertDescription className="text-green-700">{success}</AlertDescription>
                        </Alert>
                      )}

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
                        <Button onClick={handlePlaceBet} disabled={loading} className="w-full h-10 sm:h-12 text-sm sm:text-base lg:text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg transform transition-all duration-200 hover:scale-105" size="lg">
                          {loading ? (
                            <>
                              <Loader2 className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                              <span className="hidden sm:inline">Launching Rocket...</span>
                              <span className="sm:hidden">Launching...</span>
                            </>
                          ) : (
                            <>
                              <Rocket className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                              <span className="hidden sm:inline">🚀 LAUNCH ROCKET ({betAmount} RGC) 🚀</span>
                              <span className="sm:hidden">🚀 LAUNCH ({betAmount}) 🚀</span>
                            </>
                          )}
                        </Button>
                      )}

                      {gameState === "playing" && (
                        <Button
                          onClick={handleCashOut}
                          disabled={loading}
                          className="w-full h-10 sm:h-12 text-sm sm:text-base lg:text-lg bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-lg transform transition-all duration-200 hover:scale-105 animate-pulse"
                          size="lg"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                              <span className="hidden sm:inline">Cashing Out...</span>
                              <span className="sm:hidden">Cashing...</span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                              <span className="hidden sm:inline">🚀 CASH OUT {currentMultiplier.toFixed(2)}x 🚀</span>
                              <span className="sm:hidden">🚀 CASH OUT {currentMultiplier.toFixed(2)}x</span>
                            </>
                          )}
                        </Button>
                      )}

                      {(gameState === "crashed" || gameState === "won") && (
                        <Button onClick={handlePlayAgain} className="w-full h-10 sm:h-12 text-sm sm:text-base lg:text-lg" size="lg">
                          Play Again
                        </Button>
                      )}

                      {/* Game Info */}
                      <div className="text-xs sm:text-sm text-muted-foreground space-y-1 pt-2 border-t">
                        <p>Min Bet: <span className="text-primary font-semibold">{minBet} RGC</span></p>
                        <p>Max Bet: <span className="text-primary font-semibold">{maxBet} RGC</span></p>
                        <p>House Edge: <span className="text-destructive font-semibold">2%</span></p>
                        <p className="text-xs sm:text-sm mt-2 text-white">🎯 Your bet: <span className="font-bold">{betAmount || '0'} RGC</span></p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* How to Play - Desktop only */}
              <div className="hidden lg:block">
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">How to Play</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs sm:text-sm text-muted-foreground space-y-2">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Enter your bet amount in RGC</li>
                      <li>Click "Place Bet" and approve the transaction</li>
                      <li>Watch the multiplier rise</li>
                      <li>Click "Cash Out" before the rocket crashes</li>
                      <li>Win your bet × the multiplier!</li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          {/* Mobile Layout: Game History at the bottom */}
          <div className="lg:hidden mt-4">
            <GameHistory />
          </div>
        </div>
      )}
    </>
  )
}
