"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/contexts/web3-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Gift, CheckCircle2, AlertCircle } from "lucide-react"
import { ethers } from "ethers"
import { CONTRACTS, AIRDROP_ABI } from "@/lib/contracts"
import Image from "next/image"

export default function AirdropPage() {
  const { account, signer, refreshBalances } = useWeb3()
  const [loading, setLoading] = useState(false)
  const [hasClaimed, setHasClaimed] = useState(false)
  const [airdropAmount, setAirdropAmount] = useState("0")
  const [claimFee, setClaimFee] = useState("0")
  const [stats, setStats] = useState({
    totalClaimed: "0",
    totalFees: "0",
    remaining: "0",
  })
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (account && signer) {
      loadAirdropData()
    }
  }, [account, signer])

  const loadAirdropData = async () => {
    if (!signer || !account) return

    try {
      const airdropContract = new ethers.Contract(CONTRACTS.AIRDROP, AIRDROP_ABI, signer)

      // Check if user has claimed
      const claimed = await airdropContract.hasClaimed(account)
      setHasClaimed(claimed)

      // Get airdrop amount and fee
      const amount = await airdropContract.airdropAmount()
      const fee = await airdropContract.claimFee()
      setAirdropAmount(ethers.formatEther(amount))
      setClaimFee(ethers.formatEther(fee))

      // Get stats
      const contractStats = await airdropContract.getStats()
      setStats({
        totalClaimed: ethers.formatEther(contractStats[2]),
        totalFees: ethers.formatEther(contractStats[3]),
        remaining: ethers.formatEther(contractStats[4]),
      })
    } catch (err: any) {
      console.error("Error loading airdrop data:", err)
      setError("Failed to load airdrop data")
    }
  }

  const handleClaim = async () => {
    if (!signer || !account) {
      setError("Please connect your wallet")
      return
    }

    setLoading(true)
    setError(null)
    setTxHash(null)

    try {
      const airdropContract = new ethers.Contract(CONTRACTS.AIRDROP, AIRDROP_ABI, signer)

      // Call claimAirdrop with ETH fee
      const tx = await airdropContract.claimAirdrop({
        value: ethers.parseEther(claimFee),
      })

      setTxHash(tx.hash)

      // Wait for transaction confirmation
      await tx.wait()

      // Refresh data
      await loadAirdropData()
      await refreshBalances()

      setHasClaimed(true)
    } catch (err: any) {
      console.error("Claim error:", err)
      if (err.code === "ACTION_REJECTED") {
        setError("Transaction rejected by user")
      } else if (err.message.includes("Already claimed")) {
        setError("You have already claimed the airdrop")
      } else if (err.message.includes("Insufficient fee")) {
        setError("Insufficient ETH for claim fee")
      } else {
        setError(err.message || "Failed to claim airdrop")
      }
    } finally {
      setLoading(false)
    }
  }

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to claim the RGC airdrop</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-32 h-32 mb-4">
            <Image
              src="/My_Coin.png"
              alt="RogueCoin"
              width={128}
              height={128}
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-balance">RogueCoin Airdrop</h1>
          <p className="text-xl text-muted-foreground text-balance">
            Claim your free RGC tokens and start playing the crash game
          </p>
        </div>

        {/* Main Claim Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Claim Your Tokens</CardTitle>
            <CardDescription>Pay a small ETH fee to receive RGC tokens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Airdrop Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Airdrop Amount</p>
                <div className="flex items-center gap-2">
                  <Image src="/My_Coin.png" alt="RGC" width={24} height={24} className="object-contain" />
                  <p className="text-2xl font-bold text-primary">
                    {Number.parseFloat(airdropAmount).toLocaleString()} RGC
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Claim Fee</p>
                <p className="text-2xl font-bold text-secondary">{claimFee} ETH</p>
              </div>
            </div>

            {/* Status Messages */}
            {hasClaimed && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">
                  You have already claimed your airdrop! Check your wallet balance.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {txHash && (
              <Alert className="border-primary/50 bg-primary/10">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertDescription>
                  Transaction submitted!{" "}
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    View on Etherscan
                  </a>
                </AlertDescription>
              </Alert>
            )}

            {/* Claim Button */}
            <Button onClick={handleClaim} disabled={loading || hasClaimed} className="w-full h-12 text-lg" size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Claiming...
                </>
              ) : hasClaimed ? (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Already Claimed
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-5 w-5" />
                  Claim {airdropAmount} RGC
                </>
              )}
            </Button>

            {/* Instructions */}
            {!hasClaimed && (
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-semibold">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Click the claim button above</li>
                  <li>Approve the transaction in your wallet</li>
                  <li>Pay {claimFee} ETH as a claim fee</li>
                  <li>Receive {airdropAmount} RGC tokens instantly</li>
                  <li>Use your RGC to play the crash game</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Claimed</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{Number.parseFloat(stats.totalClaimed).toLocaleString()} RGC</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Fees Collected</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{Number.parseFloat(stats.totalFees).toFixed(4)} ETH</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Remaining Supply</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{Number.parseFloat(stats.remaining).toLocaleString()} RGC</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">About the Airdrop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              The RogueCoin airdrop provides new users with tokens to start playing the crash game. Each wallet can
              claim once.
            </p>
            <p>
              The small ETH fee helps prevent abuse and covers gas costs. All fees go to the contract owner to maintain
              the platform.
            </p>
            <p>
              After claiming, you can use your RGC tokens to place bets in the crash game and potentially multiply your
              holdings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
