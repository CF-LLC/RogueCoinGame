"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/contexts/web3-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, ExternalLink, AlertCircle, TrendingUp, TrendingDown } from "lucide-react"
import { GameManager, GameRound } from "@/lib/game-manager"
import { validateGameContract } from "@/lib/game-manager"

interface EnhancedRound extends GameRound {
  status: "pending" | "won" | "lost" | "crashed"
  displayCrashMultiplier: number
  displayCashOutMultiplier: number
  winningsAmount?: number
  profitLoss?: number
}

export function GameHistory() {
  const { account, signer } = useWeb3()
  const [rounds, setRounds] = useState<EnhancedRound[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gameManager, setGameManager] = useState<GameManager | null>(null)
  const [contractValid, setContractValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (signer) {
      const manager = new GameManager(signer)
      setGameManager(manager)
      checkContract()
      loadHistory(manager)
    }
  }, [account, signer])

  const checkContract = async () => {
    if (!signer?.provider) return
    
    try {
      const isValid = await validateGameContract(signer.provider)
      setContractValid(isValid)
    } catch (error) {
      console.error("Contract validation error:", error)
      setContractValid(false)
    }
  }

  const loadHistory = async (manager?: GameManager) => {
    if (!account || !signer) return

    const gameManagerToUse = manager || gameManager
    if (!gameManagerToUse) return

    if (contractValid === false) {
      setError("Game contract not deployed on this network")
      setRounds([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get player's round IDs
      const roundIds = await gameManagerToUse.getPlayerRounds(account)
      
      if (roundIds.length === 0) {
        setRounds([])
        return
      }

      // Load last 10 rounds
      const recentRoundIds = roundIds.slice(-10).reverse()
      const roundsData: EnhancedRound[] = []

      for (const roundId of recentRoundIds) {
        try {
          const round = await gameManagerToUse.getRound(roundId)
          if (!round) continue

          // Calculate display values
          const displayCrashMultiplier = round.crashMultiplier > 0 ? round.crashMultiplier / 100 : 0
          const displayCashOutMultiplier = round.cashOutMultiplier > 0 ? round.cashOutMultiplier / 100 : 0
          
          // Determine status
          let status: EnhancedRound["status"] = "pending"
          let winningsAmount = 0
          let profitLoss = 0

          if (round.settled) {
            if (round.won) {
              status = "won"
              // Calculate winnings with house edge
              const betAmount = Number.parseFloat(round.betAmount)
              const grossWinnings = betAmount * displayCashOutMultiplier
              const houseEdge = 0.02 // 2%
              winningsAmount = grossWinnings * (1 - houseEdge)
              profitLoss = winningsAmount - betAmount
            } else {
              status = displayCrashMultiplier > 0 ? "crashed" : "lost"
              profitLoss = -Number.parseFloat(round.betAmount)
            }
          } else if (round.crashMultiplier > 0) {
            // Crash revealed but not settled yet
            if (round.cashOutMultiplier > 0) {
              status = "won" // Cashed out successfully
            } else {
              status = "crashed" // Didn't cash out in time
            }
          }

          const enhancedRound: EnhancedRound = {
            ...round,
            status,
            displayCrashMultiplier,
            displayCashOutMultiplier,
            winningsAmount,
            profitLoss
          }

          roundsData.push(enhancedRound)
        } catch (roundError) {
          console.warn(`Could not load round ${roundId}:`, roundError)
        }
      }

      setRounds(roundsData)
    } catch (err) {
      console.error("Error loading history:", err)
      setError("Failed to load game history. Contract may not be deployed.")
      setRounds([])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const formatNumber = (value: number, decimals = 2) => {
    return value.toFixed(decimals)
  }

  const getStatusBadge = (round: EnhancedRound) => {
    switch (round.status) {
      case "won":
        return <Badge className="bg-green-600 text-white">Won</Badge>
      case "lost":
        return <Badge variant="destructive">Lost</Badge>
      case "crashed":
        return <Badge variant="destructive">Crashed</Badge>
      case "pending":
        return <Badge variant="outline" className="animate-pulse">Pending</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStatusDetails = (round: EnhancedRound) => {
    switch (round.status) {
      case "won":
        return (
          <div className="text-right space-y-1">
            <p className="text-xs text-green-600 font-medium">
              Cashed out at {formatNumber(round.displayCashOutMultiplier)}x
            </p>
            <p className="text-xs text-green-600">
              +{formatNumber(round.profitLoss!)} RGC
            </p>
          </div>
        )
      case "crashed":
        return (
          <div className="text-right space-y-1">
            <p className="text-xs text-red-600 font-medium">
              Crashed at {formatNumber(round.displayCrashMultiplier)}x
            </p>
            <p className="text-xs text-red-600">
              {formatNumber(round.profitLoss!)} RGC
            </p>
          </div>
        )
      case "lost":
        return (
          <div className="text-right space-y-1">
            <p className="text-xs text-red-600 font-medium">Round lost</p>
            <p className="text-xs text-red-600">
              {formatNumber(round.profitLoss!)} RGC
            </p>
          </div>
        )
      case "pending":
        return (
          <div className="text-right space-y-1">
            <p className="text-xs text-muted-foreground">
              {round.crashMultiplier > 0 
                ? `Crash: ${formatNumber(round.displayCrashMultiplier)}x` 
                : "Waiting for crash..."}
            </p>
            <p className="text-xs text-muted-foreground">Processing...</p>
          </div>
        )
      default:
        return null
    }
  }

  if (!account) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Your Game History
              {contractValid === false && (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </CardTitle>
            <CardDescription>
              {rounds.length > 0 
                ? `Last ${rounds.length} rounds` 
                : "No games played yet"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadHistory()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {contractValid === false ? (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Game contract not found on this network. History not available.
            </AlertDescription>
          </Alert>
        ) : error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading history...</p>
          </div>
        ) : rounds.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎮</div>
            <p className="text-muted-foreground mb-4">No games played yet</p>
            <p className="text-sm text-muted-foreground">
              Place your first bet to start your gaming history!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rounds.map((round) => (
              <div 
                key={round.roundId} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border transition-colors hover:bg-muted/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Round #{round.roundId}</p>
                    {getStatusBadge(round)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bet: {formatNumber(Number.parseFloat(round.betAmount))} RGC
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(round.timestamp)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusDetails(round)}
                  
                  {round.profitLoss !== undefined && (
                    <div className="flex items-center">
                      {round.profitLoss > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : round.profitLoss < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Summary Stats */}
            {rounds.length > 0 && (
              <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="text-sm font-medium mb-2">Session Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold">
                      {rounds.filter(r => r.status === "won").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Wins</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {rounds.filter(r => r.status === "crashed" || r.status === "lost").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Losses</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${
                      rounds.reduce((sum, r) => sum + (r.profitLoss || 0), 0) > 0 
                        ? "text-green-600" 
                        : "text-red-600"
                    }`}>
                      {formatNumber(rounds.reduce((sum, r) => sum + (r.profitLoss || 0), 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Net P&L</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
