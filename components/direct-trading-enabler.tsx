"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, ExternalLink, Loader2, Zap } from "lucide-react"
import { ethers } from "ethers"

const CONTRACT_ADDRESS = "0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e"
const ADMIN_ADDRESS = "0x8DA112FcA23e31785e9c69cA92C8f00e999BebF2"

// Minimal ABI for enableTrading
const ENABLE_TRADING_ABI = [
  "function enableTrading()",
  "function tradingEnabled() view returns (bool)",
  "function owner() view returns (address)"
]

interface Window {
  ethereum?: any;
}

export function DirectTradingEnabler() {
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const enableTrading = async () => {
    setLoading(true)
    setError("")
    setTxHash("")
    setSuccess(false)

    try {
      // Check if MetaMask/wallet is available
      if (typeof window === "undefined" || !window.ethereum || !window.ethereum.request) {
        throw new Error("No Web3 wallet detected. Please install MetaMask or another Web3 wallet.")
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[]

      if (accounts.length === 0) {
        throw new Error("No wallet accounts available")
      }

      const currentAccount = accounts[0]
      
      // Check if current account is admin
      if (currentAccount.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
        throw new Error(`You must connect with the admin wallet. Current: ${currentAccount.slice(0,8)}..., Required: ${ADMIN_ADDRESS.slice(0,8)}...`)
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()
      
      // Check network (should be Polygon)
      const network = await provider.getNetwork()
      if (network.chainId !== BigInt(137)) {
        throw new Error("Please switch to Polygon Mainnet (Chain ID: 137)")
      }

      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ENABLE_TRADING_ABI, signer)

      // Double-check we're the owner
      const owner = await contract.owner()
      if (owner.toLowerCase() !== currentAccount.toLowerCase()) {
        throw new Error(`Account mismatch. Contract owner: ${owner}, Connected: ${currentAccount}`)
      }

      // Check if trading is already enabled
      const tradingEnabled = await contract.tradingEnabled()
      if (tradingEnabled) {
        setSuccess(true)
        setError("Trading is already enabled! 🎉")
        return
      }

      console.log("🚀 Calling enableTrading function...")
      
      // Call enableTrading function
      const tx = await contract.enableTrading()
      setTxHash(tx.hash)
      
      console.log("✅ Transaction sent:", tx.hash)
      console.log("⏳ Waiting for confirmation...")
      
      // Wait for transaction confirmation
      const receipt = await tx.wait()
      
      if (receipt.status === 1) {
        setSuccess(true)
        console.log("🎉 Trading enabled successfully!")
      } else {
        throw new Error("Transaction failed")
      }

    } catch (err: any) {
      console.error("❌ Error enabling trading:", err)
      
      if (err.code === "ACTION_REJECTED") {
        setError("Transaction was rejected by user")
      } else if (err.message?.includes("missing revert data")) {
        setError("Contract call failed. This usually means trading is already enabled or there's a network issue.")
      } else if (err.message?.includes("Trading already enabled")) {
        setSuccess(true)
        setError("Trading is already enabled! 🎉")
      } else {
        setError(err.message || "Failed to enable trading")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Enable RGC Trading
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>This will enable trading for the RGC token, allowing it to be traded on DEXs.</p>
          <p className="mt-2 font-medium">Required: Admin wallet ({ADMIN_ADDRESS.slice(0,8)}...)</p>
        </div>

        <Button
          onClick={enableTrading}
          disabled={loading || success}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enabling Trading...
            </>
          ) : success ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Trading Enabled!
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Enable Trading Now
            </>
          )}
        </Button>

        {/* Transaction Hash */}
        {txHash && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Transaction submitted!{" "}
              <a
                href={`https://polygonscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
              >
                View on Polygonscan
                <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>
        )}

        {/* Success */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              🎉 Trading enabled successfully! RGC can now be traded on DEXs like Uniswap and QuickSwap.
            </AlertDescription>
          </Alert>
        )}

        {/* Error */}
        {error && !success && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Backup Link */}
        <div className="text-center">
          <a
            href={`https://polygonscan.com/address/${CONTRACT_ADDRESS}#writeContract`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
          >
            Alternative: Use Polygonscan directly
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}