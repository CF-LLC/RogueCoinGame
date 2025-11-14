"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSimpleWeb3 } from "@/contexts/simple-web3-context"
import { Wallet, Link, AlertCircle, RefreshCw } from "lucide-react"

export function SimpleWalletButton() {
  const {
    account,
    chainId,
    isConnecting,
    error,
    nativeBalance,
    rgcBalance,
    isCorrectChain,
    connectWallet,
    disconnectWallet,
    switchToPolygon,
    refreshBalances
  } = useSimpleWeb3()

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Format balance for display
  const formatBalance = (balance: string, decimals = 4) => {
    const num = parseFloat(balance)
    if (num === 0) return "0"
    return num < 0.0001 ? "< 0.0001" : num.toFixed(decimals)
  }

  if (!account) {
    return (
      <div className="space-y-4">
        <Button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          size="lg"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>Supports any Web3 wallet (MetaMask, Coinbase, etc.)</p>
          <p>Automatically stays in browser for transactions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Wallet Info Card */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {/* Account & Network */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span className="font-mono text-sm">{formatAddress(account)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                {isCorrectChain ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    Polygon
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    Wrong Network
                  </Badge>
                )}
              </div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">POL Balance</p>
                <p className="font-semibold">{formatBalance(nativeBalance)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">RGC Balance</p>
                <p className="font-semibold">{formatBalance(rgcBalance)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!isCorrectChain ? (
          <Button
            onClick={switchToPolygon}
            variant="default"
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            <Link className="mr-2 h-4 w-4" />
            Switch to Polygon
          </Button>
        ) : (
          <Button
            onClick={refreshBalances}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}

        <Button
          onClick={disconnectWallet}
          variant="outline"
          size="sm"
          className="px-3"
        >
          Disconnect
        </Button>
      </div>

      {/* Trading Status Alert */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-yellow-800 font-medium">Trading Currently Disabled</p>
              <p className="text-yellow-700 mt-1">
                RGC trading needs to be enabled by the contract owner before it can be traded on DEXs.
              </p>
              {account === "0x8DA112FcA23e31785e9c69cA92C8f00e999BebF2" && (
                <p className="text-yellow-800 font-medium mt-2">
                  💡 You are the owner! Visit{" "}
                  <a 
                    href="https://polygonscan.com/address/0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e#writeContract"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-yellow-900"
                  >
                    Polygonscan
                  </a>
                  {" "}to enable trading.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}