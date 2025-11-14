"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/contexts/web3-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, CheckCircle2, Settings, DollarSign, TrendingUp } from "lucide-react"
import { ethers } from "ethers"
import { CONTRACTS, AIRDROP_ABI, CRASH_GAME_ABI, ADMIN_WALLET } from "@/lib/contracts"
import { WelcomeScreen } from "@/components/welcome-screen"
import { DirectTradingEnabler } from "@/components/direct-trading-enabler"

export default function AdminPage() {
  const { account, signer } = useWeb3()
  const isAdmin = account?.toLowerCase() === ADMIN_WALLET.toLowerCase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Airdrop state
  const [airdropStats, setAirdropStats] = useState({
    airdropAmount: "0",
    claimFee: "0",
    totalClaimed: "0",
    totalFees: "0",
    remaining: "0",
  })
  const [newAirdropAmount, setNewAirdropAmount] = useState("")
  const [newClaimFee, setNewClaimFee] = useState("")

  // Game state
  const [gameStats, setGameStats] = useState({
    totalBets: "0",
    totalWinnings: "0",
    totalLosses: "0",
    liquidity: "0",
    currentRoundId: "0",
    minBet: "0",
    maxBet: "0",
    houseEdge: "0",
  })
  const [newMinBet, setNewMinBet] = useState("")
  const [newMaxBet, setNewMaxBet] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")

  useEffect(() => {
    if (isAdmin && signer && CONTRACTS.AIRDROP && CONTRACTS.CRASH_GAME) {
      loadStats()
    }
  }, [isAdmin, signer])

  const loadStats = async () => {
    if (!signer) return

    try {
      // Load airdrop stats
      const airdropContract = new ethers.Contract(CONTRACTS.AIRDROP, AIRDROP_ABI, signer)
      const aStats = await airdropContract.getStats()
      setAirdropStats({
        airdropAmount: ethers.formatEther(aStats[0]),
        claimFee: ethers.formatEther(aStats[1]),
        totalClaimed: ethers.formatEther(aStats[2]),
        totalFees: ethers.formatEther(aStats[3]),
        remaining: ethers.formatEther(aStats[4]),
      })

      // Load game stats
      const gameContract = new ethers.Contract(CONTRACTS.CRASH_GAME, CRASH_GAME_ABI, signer)
      const gStats = await gameContract.getStats()
      const minBet = await gameContract.minBet()
      const maxBet = await gameContract.maxBet()
      const houseEdge = await gameContract.houseEdge()

      setGameStats({
        totalBets: ethers.formatEther(gStats[0]),
        totalWinnings: ethers.formatEther(gStats[1]),
        totalLosses: ethers.formatEther(gStats[2]),
        liquidity: ethers.formatEther(gStats[3]),
        currentRoundId: gStats[4].toString(),
        minBet: ethers.formatEther(minBet),
        maxBet: ethers.formatEther(maxBet),
        houseEdge: (Number(houseEdge) / 100).toString(),
      })
    } catch (err) {
      console.error("Error loading stats:", err)
      setError("Failed to load contract data. Make sure contracts are deployed and addresses are configured.")
    }
  }

  const handleUpdateAirdropAmount = async () => {
    if (!signer) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const airdropContract = new ethers.Contract(CONTRACTS.AIRDROP, AIRDROP_ABI, signer)
      const tx = await airdropContract.setAirdropAmount(ethers.parseEther(newAirdropAmount))
      await tx.wait()

      setSuccess("Airdrop amount updated successfully")
      await loadStats()
      setNewAirdropAmount("")
    } catch (err: any) {
      setError(err.message || "Failed to update airdrop amount")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateClaimFee = async () => {
    if (!signer) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const airdropContract = new ethers.Contract(CONTRACTS.AIRDROP, AIRDROP_ABI, signer)
      const tx = await airdropContract.setClaimFee(ethers.parseEther(newClaimFee))
      await tx.wait()

      setSuccess("Claim fee updated successfully")
      await loadStats()
      setNewClaimFee("")
    } catch (err: any) {
      setError(err.message || "Failed to update claim fee")
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawETH = async () => {
    if (!signer) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const airdropContract = new ethers.Contract(CONTRACTS.AIRDROP, AIRDROP_ABI, signer)
      const tx = await airdropContract.withdrawETH()
      await tx.wait()

      setSuccess("POL withdrawn successfully")
      await loadStats()
    } catch (err: any) {
      setError(err.message || "Failed to withdraw POL")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBetLimits = async () => {
    if (!signer) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const gameContract = new ethers.Contract(CONTRACTS.CRASH_GAME, CRASH_GAME_ABI, signer)
      const tx = await gameContract.setBetLimits(ethers.parseEther(newMinBet), ethers.parseEther(newMaxBet))
      await tx.wait()

      setSuccess("Bet limits updated successfully")
      await loadStats()
      setNewMinBet("")
      setNewMaxBet("")
    } catch (err: any) {
      setError(err.message || "Failed to update bet limits")
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawTokens = async () => {
    if (!signer) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const gameContract = new ethers.Contract(CONTRACTS.CRASH_GAME, CRASH_GAME_ABI, signer)
      const tx = await gameContract.withdrawTokens(ethers.parseEther(withdrawAmount))
      await tx.wait()

      setSuccess("Tokens withdrawn successfully")
      await loadStats()
      setWithdrawAmount("")
    } catch (err: any) {
      setError(err.message || "Failed to withdraw tokens")
    } finally {
      setLoading(false)
    }
  }

  if (!account) {
    return <WelcomeScreen />
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have admin privileges</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only the admin wallet ({ADMIN_WALLET.slice(0, 6)}...{ADMIN_WALLET.slice(-4)}) can access this page
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!CONTRACTS.AIRDROP || !CONTRACTS.CRASH_GAME) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Contracts Not Configured</CardTitle>
            <CardDescription>Deploy contracts and set environment variables</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please deploy your contracts and add the contract addresses to your environment variables. See
                ENV_SETUP_GUIDE.md for instructions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage airdrop and game contracts</p>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">{success}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="airdrop">Airdrop</TabsTrigger>
            <TabsTrigger value="game">Game</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Airdrop Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Airdrop Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Claimed</span>
                    <span className="font-mono font-semibold">
                      {Number.parseFloat(airdropStats.totalClaimed).toLocaleString()} RGC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fees Collected</span>
                    <span className="font-mono font-semibold">{airdropStats.totalFees} POL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining Supply</span>
                    <span className="font-mono font-semibold">
                      {Number.parseFloat(airdropStats.remaining).toLocaleString()} RGC
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Game Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    Game Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Bets</span>
                    <span className="font-mono font-semibold">
                      {Number.parseFloat(gameStats.totalBets).toLocaleString()} RGC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Winnings</span>
                    <span className="font-mono font-semibold text-green-500">
                      {Number.parseFloat(gameStats.totalWinnings).toLocaleString()} RGC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Losses</span>
                    <span className="font-mono font-semibold text-destructive">
                      {Number.parseFloat(gameStats.totalLosses).toLocaleString()} RGC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Liquidity</span>
                    <span className="font-mono font-semibold">
                      {Number.parseFloat(gameStats.liquidity).toLocaleString()} RGC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Round</span>
                    <span className="font-mono font-semibold">#{gameStats.currentRoundId}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trading Tab */}
          <TabsContent value="trading" className="space-y-6">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Important:</strong> Trading must be enabled before users can claim airdrops or trade tokens.
                This is a one-time, irreversible action that allows RGC to be traded on DEXs.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <DirectTradingEnabler />
            </div>
          </TabsContent>

          {/* Airdrop Tab */}
          <TabsContent value="airdrop" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Airdrop Amount</span>
                    <span className="font-mono font-semibold">{airdropStats.airdropAmount} RGC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Claim Fee</span>
                    <span className="font-mono font-semibold">{airdropStats.claimFee} POL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining Supply</span>
                    <span className="font-mono font-semibold">
                      {Number.parseFloat(airdropStats.remaining).toLocaleString()} RGC
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Update Airdrop Amount */}
              <Card>
                <CardHeader>
                  <CardTitle>Update Airdrop Amount</CardTitle>
                  <CardDescription>Set the amount of RGC per claim</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newAirdropAmount">New Amount (RGC)</Label>
                    <Input
                      id="newAirdropAmount"
                      type="number"
                      placeholder="1000"
                      value={newAirdropAmount}
                      onChange={(e) => setNewAirdropAmount(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleUpdateAirdropAmount}
                    disabled={loading || !newAirdropAmount}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Settings className="mr-2 h-4 w-4" />
                    )}
                    Update Amount
                  </Button>
                </CardContent>
              </Card>

              {/* Update Claim Fee */}
              <Card>
                <CardHeader>
                  <CardTitle>Update Claim Fee</CardTitle>
                  <CardDescription>Set the POL fee required to claim</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newClaimFee">New Fee (POL)</Label>
                    <Input
                      id="newClaimFee"
                      type="number"
                      step="0.001"
                      placeholder="0.001"
                      value={newClaimFee}
                      onChange={(e) => setNewClaimFee(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleUpdateClaimFee} disabled={loading || !newClaimFee} className="w-full">
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Settings className="mr-2 h-4 w-4" />
                    )}
                    Update Fee
                  </Button>
                </CardContent>
              </Card>

              {/* Withdraw POL */}
              <Card>
                <CardHeader>
                  <CardTitle>Withdraw POL Fees</CardTitle>
                  <CardDescription>Withdraw collected claim fees</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Available to Withdraw</p>
                    <p className="text-2xl font-bold">{airdropStats.totalFees} POL</p>
                  </div>
                  <Button
                    onClick={handleWithdrawETH}
                    disabled={loading}
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <DollarSign className="mr-2 h-4 w-4" />
                    )}
                    Withdraw All POL
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Game Tab */}
          <TabsContent value="game" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Bet</span>
                    <span className="font-mono font-semibold">{gameStats.minBet} RGC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Bet</span>
                    <span className="font-mono font-semibold">{gameStats.maxBet} RGC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">House Edge</span>
                    <span className="font-mono font-semibold">{gameStats.houseEdge}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Liquidity</span>
                    <span className="font-mono font-semibold">
                      {Number.parseFloat(gameStats.liquidity).toLocaleString()} RGC
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Update Bet Limits */}
              <Card>
                <CardHeader>
                  <CardTitle>Update Bet Limits</CardTitle>
                  <CardDescription>Set minimum and maximum bet amounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newMinBet">Min Bet (RGC)</Label>
                    <Input
                      id="newMinBet"
                      type="number"
                      placeholder="10"
                      value={newMinBet}
                      onChange={(e) => setNewMinBet(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newMaxBet">Max Bet (RGC)</Label>
                    <Input
                      id="newMaxBet"
                      type="number"
                      placeholder="10000"
                      value={newMaxBet}
                      onChange={(e) => setNewMaxBet(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleUpdateBetLimits}
                    disabled={loading || !newMinBet || !newMaxBet}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Settings className="mr-2 h-4 w-4" />
                    )}
                    Update Limits
                  </Button>
                </CardContent>
              </Card>

              {/* Withdraw Tokens */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Withdraw RGC Tokens</CardTitle>
                  <CardDescription>Withdraw tokens from game contract liquidity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Available Liquidity</p>
                    <p className="text-2xl font-bold">{Number.parseFloat(gameStats.liquidity).toLocaleString()} RGC</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawAmount">Amount to Withdraw (RGC)</Label>
                    <Input
                      id="withdrawAmount"
                      type="number"
                      placeholder="1000"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleWithdrawTokens}
                    disabled={loading || !withdrawAmount}
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <DollarSign className="mr-2 h-4 w-4" />
                    )}
                    Withdraw Tokens
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
