"use client"

import { useState, useEffect } from "react"
import { useSimpleWeb3 } from "@/contexts/simple-web3-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, ExternalLink, Loader2 } from "lucide-react"
import { ethers } from "ethers"

const TRADING_ABI = [
  "function tradingEnabled() external view returns (bool)",
  "function enableTrading() external",
  "function owner() external view returns (address)"
]

const CONTRACT_ADDRESS = "0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e"

export function EnableTradingCard() {
  const { signer, account, isCorrectChain } = useSimpleWeb3()
  const [isLoading, setIsLoading] = useState(false)
  const [tradingEnabled, setTradingEnabled] = useState<boolean | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [txHash, setTxHash] = useState<string>("")
  const [error, setError] = useState<string>("")

  const checkTradingStatus = async () => {
    if (!signer || !isCorrectChain) return
    
    setIsLoading(true)
    setError("")

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, TRADING_ABI, signer)
      const [enabled, owner] = await Promise.all([
        contract.tradingEnabled(),
        contract.owner()
      ])
      
      setTradingEnabled(enabled)
      setIsOwner(account?.toLowerCase() === owner.toLowerCase())
      
    } catch (err: any) {
      setError(`Failed to check trading status: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const enableTrading = async () => {
    if (!signer || !isCorrectChain || !isOwner) return

    setIsLoading(true)
    setError("")
    setTxHash("")

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, TRADING_ABI, signer)
      const tx = await contract.enableTrading()
      setTxHash(tx.hash)
      
      console.log("⏳ Transaction sent:", tx.hash)
      
      const receipt = await tx.wait()
      if (receipt.status === 1) {
        setTradingEnabled(true)
        console.log("✅ Trading enabled successfully!")
      } else {
        throw new Error("Transaction failed")
      }
      
    } catch (err: any) {
      setError(`Failed to enable trading: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-check on mount and when wallet changes
  useEffect(() => {
    if (signer && isCorrectChain) {
      checkTradingStatus()
    }
  }, [signer, isCorrectChain, account])

  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Trading Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connect your wallet to check trading status</p>
        </CardContent>
      </Card>
    )
  }

  if (!isCorrectChain) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Trading Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please switch to Polygon network to check trading status
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {tradingEnabled ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          )}
          RGC Trading Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trading Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Trading:</span>
          {tradingEnabled === null ? (
            <Badge variant="secondary">Checking...</Badge>
          ) : tradingEnabled ? (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              ✅ Enabled
            </Badge>
          ) : (
            <Badge variant="destructive">
              ❌ Disabled
            </Badge>
          )}
        </div>

        {/* Owner Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium">You are owner:</span>
          <Badge variant={isOwner ? "default" : "secondary"}>
            {isOwner ? "Yes" : "No"}
          </Badge>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={checkTradingStatus}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Refresh Status
          </Button>

          {!tradingEnabled && isOwner && (
            <Button
              onClick={enableTrading}
              disabled={isLoading || Boolean(tradingEnabled)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Enable Trading
            </Button>
          )}

          {!tradingEnabled && !isOwner && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only the contract owner can enable trading. Owner address: 0x8DA112...BebF2
              </AlertDescription>
            </Alert>
          )}
        </div>

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

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Trading Info */}
        {tradingEnabled && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              🎉 Trading is enabled! RGC can now be traded on DEXs like Uniswap and QuickSwap.
              Next step: Add liquidity to create a trading pair.
            </AlertDescription>
          </Alert>
        )}

        {/* Contract Links */}
        <div className="pt-4 border-t space-y-2">
          <a
            href={`https://polygonscan.com/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
          >
            View Contract on Polygonscan
            <ExternalLink className="h-3 w-3" />
          </a>
          {isOwner && (
            <br />
          )}
          {isOwner && (
            <a
              href={`https://polygonscan.com/address/${CONTRACT_ADDRESS}#writeContract`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
            >
              Interact with Contract (Polygonscan)
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}