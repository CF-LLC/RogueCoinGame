"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/contexts/web3-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ethers } from "ethers"
import { CONTRACTS, CRASH_GAME_ABI } from "@/lib/contracts"

interface Round {
  roundId: number
  betAmount: string
  crashMultiplier: number
  cashOutMultiplier: number
  won: boolean
  settled: boolean
  timestamp: number
}

export function GameHistory() {
  const { account, signer } = useWeb3()
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (account && signer) {
      loadHistory()
    }
  }, [account, signer])

  const loadHistory = async () => {
    if (!signer || !account) return

    // Check if contracts are configured
    if (!CONTRACTS.CRASH_GAME || CONTRACTS.CRASH_GAME === "0x0000000000000000000000000000000000000000") {
      console.warn("Crash game contract not configured")
      setRounds([])
      return
    }

    setLoading(true)
    try {
      const gameContract = new ethers.Contract(CONTRACTS.CRASH_GAME, CRASH_GAME_ABI, signer)

      // Get player's round IDs
      const roundIds = await gameContract.getPlayerRounds(account)

      // Load last 10 rounds
      const recentRoundIds = roundIds.slice(-10).reverse()
      const roundsData: Round[] = []

      for (const roundId of recentRoundIds) {
        const round = await gameContract.getRound(roundId)
        roundsData.push({
          roundId: Number(roundId),
          betAmount: ethers.formatEther(round.betAmount),
          crashMultiplier: Number(round.crashMultiplier) / 100,
          cashOutMultiplier: Number(round.cashOutMultiplier) / 100,
          won: round.won,
          settled: round.settled,
          timestamp: Number(round.timestamp),
        })
      }

      setRounds(roundsData)
    } catch (err) {
      console.error("Error loading history:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!account) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Game History</CardTitle>
        <CardDescription>Last 10 rounds</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading history...</p>
        ) : rounds.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No games played yet</p>
        ) : (
          <div className="space-y-3">
            {rounds.map((round) => (
              <div key={round.roundId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Round #{round.roundId}</p>
                  <p className="text-xs text-muted-foreground">
                    Bet: {Number.parseFloat(round.betAmount).toFixed(2)} RGC
                  </p>
                </div>

                <div className="text-right space-y-1">
                  {round.settled ? (
                    <>
                      {round.won ? (
                        <>
                          <Badge className="bg-green-600">Won</Badge>
                          <p className="text-xs text-muted-foreground">{round.cashOutMultiplier.toFixed(2)}x</p>
                        </>
                      ) : (
                        <>
                          <Badge variant="destructive">Lost</Badge>
                          <p className="text-xs text-muted-foreground">
                            Crashed at {round.crashMultiplier.toFixed(2)}x
                          </p>
                        </>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
