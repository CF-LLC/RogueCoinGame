"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/contexts/web3-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Gift, CheckCircle2, AlertCircle } from "lucide-react"
import { ethers } from "ethers"
import { CONTRACTS, AIRDROP_ABI } from "@/lib/contracts"
import ContractStatus from "@/components/contract-status"
import WalletSelector from "@/components/wallet-selector"
import { GetPOLGuide } from "@/components/get-pol-guide"
import { WelcomeScreen } from "@/components/welcome-screen"
import Image from "next/image"

export default function AirdropPage() {
  const { account, signer, provider, refreshBalances, nativeBalance } = useWeb3()
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
    if (!provider) return

    try {
      const network = await provider.getNetwork()
      console.log('Current network:', Number(network.chainId))
      
      // Check if airdrop contract is configured
      if (!CONTRACTS.AIRDROP || CONTRACTS.AIRDROP === "") {
        console.warn("Airdrop contract not configured")
        setError("Airdrop contract not configured. Please check environment variables.")
        return
      }

      console.log('Airdrop contract address:', CONTRACTS.AIRDROP)
      
      // Check if contract exists on this network
      const code = await provider.getCode(CONTRACTS.AIRDROP)
      console.log('Contract bytecode length:', code.length)
      
      if (code === "0x") {
        console.warn("Airdrop contract not deployed on this network")
        setError(`Airdrop contract not deployed on network ${Number(network.chainId)}. Please deploy contracts or switch to the correct network.`)
        return
      }

      const airdropContract = new ethers.Contract(CONTRACTS.AIRDROP, AIRDROP_ABI, provider)

      // Test basic contract calls
      try {
        console.log('Testing contract calls...')
        const stats = await airdropContract.getStats()
        console.log('Contract stats:', stats)
        
        const airdropAmt = await airdropContract.airdropAmount()
        const fee = await airdropContract.claimFee()
        console.log('Airdrop amount:', ethers.formatEther(airdropAmt), 'RGC')
        console.log('Claim fee:', ethers.formatEther(fee), 'POL')
        
        setAirdropAmount(ethers.formatEther(airdropAmt))
        setClaimFee(ethers.formatEther(fee))
        
        if (account) {
          console.log('Checking if account has claimed:', account)
          const claimed = await airdropContract.hasClaimed(account)
          console.log('Has claimed:', claimed)
          setHasClaimed(claimed)
        }
        
        // Update stats display
        setStats({
          totalClaimed: ethers.formatEther(stats[2]),
          totalFees: ethers.formatEther(stats[3]), 
          remaining: ethers.formatEther(stats[4])
        })
        
      } catch (contractError) {
        console.error("Contract call failed:", contractError)
        setError("Contract calls failed. The contract may not be properly configured.")
      }
    } catch (err) {
      console.error("Error loading airdrop data:", err)
      setError("Failed to load airdrop data: " + (err as Error).message)
    }
  }

  const handleClaim = async () => {
    if (!signer || !account) {
      setError("Please connect your wallet")
      return
    }

    // Check if contracts are configured
    if (!CONTRACTS.AIRDROP || CONTRACTS.AIRDROP === "") {
      setError("Airdrop contract not configured. Please deploy contracts first.")
      return
    }

    // Check if user has sufficient POL for gas + claim fee
    const requiredAmount = ethers.parseEther(claimFee)
    const userBalance = ethers.parseEther(nativeBalance)
    const estimatedGas = ethers.parseEther("0.001") // Rough gas estimate
    
    if (userBalance < requiredAmount + estimatedGas) {
      setError(`Insufficient POL balance. You need at least ${ethers.formatEther(requiredAmount + estimatedGas)} POL (${claimFee} for claim fee + ~0.001 for gas). Current balance: ${nativeBalance} POL`)
      return
    }

    setLoading(true)
    setError(null)
    setTxHash(null)

    try {
      // Validate contract deployment first
      if (!signer.provider) {
        throw new Error("No provider available")
      }
      
      const code = await signer.provider.getCode(CONTRACTS.AIRDROP)
      if (code === "0x") {
        throw new Error("Airdrop contract not deployed on this network. Please switch to the correct network or deploy contracts.")
      }

      const airdropContract = new ethers.Contract(CONTRACTS.AIRDROP, AIRDROP_ABI, signer)

      // Check if user already claimed
      try {
        console.log('Checking claim status for account:', account)
        const alreadyClaimed = await airdropContract.hasClaimed(account)
        console.log('Already claimed result:', alreadyClaimed)
        if (alreadyClaimed) {
          throw new Error("You have already claimed your airdrop")
        }
      } catch (checkError) {
        console.warn("Could not verify claim status:", checkError)
      }

      // Additional debugging checks
      try {
        console.log('Performing additional contract checks...')
        
        // Check if the contract has the expected stats
        const debugStats = await airdropContract.getStats()
        console.log('Contract debug stats:', {
          totalClaims: debugStats[0].toString(),
          totalClaimAmount: ethers.formatEther(debugStats[1]),
          totalClaimed: ethers.formatEther(debugStats[2]),
          totalFees: ethers.formatEther(debugStats[3]),
          remaining: ethers.formatEther(debugStats[4])
        })
        
        if (debugStats[4].toString() === "0") {
          throw new Error("The airdrop has no remaining tokens. All tokens have been distributed.")
        }
        
      } catch (debugError) {
        console.warn("Debug checks failed (this may be normal):", debugError)
      }

      // Estimate gas first to catch contract errors early
      try {
        console.log('Estimating gas for claimAirdrop with fee:', claimFee, 'POL')
        const gasEstimate = await airdropContract.claimAirdrop.estimateGas({
          value: ethers.parseEther(claimFee),
        })
        console.log("Gas estimate:", gasEstimate.toString())
      } catch (gasError: any) {
        console.error("Gas estimation failed:", gasError)
        
        // More specific error handling
        if (gasError.code === "CALL_EXCEPTION") {
          if (gasError.message && gasError.message.includes("missing revert data")) {
            throw new Error("Contract call failed. This usually means: 1) You've already claimed the airdrop, 2) The airdrop is paused/ended, or 3) You don't meet the claim requirements. Please check the contract status.")
          }
          throw new Error("Contract function would fail. The smart contract rejected this transaction. Please check: your claim eligibility, airdrop status, and network connection.")
        }
        
        if (gasError.message && gasError.message.includes("missing revert data")) {
          throw new Error("Contract function would fail. This usually means the contract is not properly deployed or configured on this network.")
        }
        throw new Error("Transaction would fail: " + (gasError.reason || gasError.message || "Unknown error"))
      }

      // Call claimAirdrop with POL fee
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
      } else if (err.code === "INSUFFICIENT_FUNDS") {
        setError(`Insufficient POL for transaction. You need POL to pay for gas fees and the claim fee (${claimFee} POL). Please add POL to your wallet.`)
      } else if (err.code === "CALL_EXCEPTION") {
        setError("Contract call failed. The airdrop contract may not be properly deployed or configured.")
      } else if (err.message.includes("missing revert data")) {
        setError("Contract call failed without specific error. Please check if contracts are deployed and you meet all requirements.")
      } else if (err.message.includes("Already claimed")) {
        setError("You have already claimed the airdrop")
      } else if (err.message.includes("Insufficient fee")) {
        setError("Insufficient POL for claim fee")
      } else if (err.message.includes("insufficient funds")) {
        setError(`Insufficient POL balance. You need ${claimFee} POL for the claim fee plus additional POL for gas fees.`)
      } else {
        setError(err.message || "Failed to claim airdrop")
      }
    } finally {
      setLoading(false)
    }
  }

  if (!account) {
    return <WelcomeScreen />
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-8">
      <ContractStatus />
      
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 mb-4">
            <Image
              src={`${process.env.NODE_ENV === 'production' ? '/RogueCoinGame' : ''}/My_Coin.png`}
              alt="RogueCoin"
              width={96}
              height={96}
              className="sm:w-32 sm:h-32 object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-balance">RogueCoin Airdrop</h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground text-balance">
            Claim your free RGC tokens and start playing the crash game
          </p>
        </div>

        {/* Main Claim Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Claim Your Tokens</CardTitle>
            <CardDescription className="text-sm sm:text-base">Pay a small POL fee to receive RGC tokens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Airdrop Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 sm:p-4 rounded-lg bg-muted/50">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Airdrop Amount</p>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Image src={`${process.env.NODE_ENV === 'production' ? '/RogueCoinGame' : ''}/My_Coin.png`} alt="RGC" width={20} height={20} className="sm:w-6 sm:h-6 object-contain" />
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                    {Number.parseFloat(airdropAmount).toLocaleString()} RGC
                  </p>
                </div>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-muted/50">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Claim Fee</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-secondary">{claimFee} POL</p>
              </div>
            </div>
            
            {/* Balance Info */}
            <div className="p-3 sm:p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Your POL Balance</p>
              <p className="text-base sm:text-lg font-semibold">{Number.parseFloat(nativeBalance).toFixed(4)} POL</p>
              <p className="text-xs text-muted-foreground mt-1">
                You need {claimFee} POL for the claim fee + additional POL for gas fees
              </p>
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
                    href={`https://polygonscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    View on PolygonScan
                  </a>
                </AlertDescription>
              </Alert>
            )}

            {/* Claim Button */}
            <Button onClick={handleClaim} disabled={loading || hasClaimed} className="w-full h-10 sm:h-12 text-sm sm:text-base lg:text-lg" size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="hidden sm:inline">Claiming...</span>
                  <span className="sm:hidden">Claiming...</span>
                </>
              ) : hasClaimed ? (
                <>
                  <CheckCircle2 className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Already Claimed</span>
                  <span className="sm:hidden">Claimed</span>
                </>
              ) : (
                <>
                  <Gift className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Claim {airdropAmount} RGC</span>
                  <span className="sm:hidden">Claim RGC</span>
                </>
              )}
            </Button>

            {/* Instructions */}
            {!hasClaimed && (
              <div className="text-xs sm:text-sm text-muted-foreground space-y-2">
                <p className="font-semibold">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Make sure you have enough POL in your wallet</li>
                  <li>Click the claim button above</li>
                  <li>Approve the transaction in your wallet</li>
                  <li>Pay {claimFee} POL as a claim fee</li>
                  <li>Receive {airdropAmount} RGC tokens instantly</li>
                  <li>Use your RGC to play the crash game</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Total Claimed</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">{Number.parseFloat(stats.totalClaimed).toLocaleString()} RGC</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Total Fees Collected</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">{Number.parseFloat(stats.totalFees).toFixed(4)} POL</p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Remaining Supply</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">{Number.parseFloat(stats.remaining).toLocaleString()} RGC</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">About the Airdrop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs sm:text-sm text-muted-foreground">
            <p>
              The RogueCoin airdrop provides new users with tokens to start playing the crash game. Each wallet can
              claim once.
            </p>
            <p>
              The small POL fee helps prevent abuse and covers gas costs on Polygon network. All fees go to the contract owner to maintain
              the platform.
            </p>
            <p>
              After claiming, you can use your RGC tokens to place bets in the crash game and potentially multiply your
              holdings.
            </p>
          </CardContent>
        </Card>

        {/* POL Guide - Show when user has insufficient balance */}
        {Number.parseFloat(nativeBalance) < Number.parseFloat(claimFee) + 0.001 && (
          <GetPOLGuide />
        )}
      </div>
    </div>
  )
}
