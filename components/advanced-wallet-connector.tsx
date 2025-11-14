"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSimpleWeb3 } from "@/contexts/simple-web3-context"
import { Wallet, AlertCircle, RefreshCw, Users, Crown } from "lucide-react"

interface WalletAccount {
  address: string
  isAdmin: boolean
  nickname: string
}

export function AdvancedWalletConnector() {
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

  const [availableAccounts, setAvailableAccounts] = useState<WalletAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>("")

  // Known addresses
  const adminAddress = "0x8DA112FcA23e31785e9c69cA92C8f00e999BebF2"

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

  // Detect all available accounts in wallet
  const detectAccounts = async () => {
    if (!window.ethereum?.request) return

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      })

      const walletAccounts: WalletAccount[] = accounts.map((address: string) => ({
        address,
        isAdmin: address.toLowerCase() === adminAddress.toLowerCase(),
        nickname: address.toLowerCase() === adminAddress.toLowerCase() 
          ? "Admin Wallet" 
          : `Wallet ${address.slice(-4)}`
      }))

      setAvailableAccounts(walletAccounts)
      
      // Auto-select admin if available
      const adminAccount = walletAccounts.find(acc => acc.isAdmin)
      if (adminAccount && !selectedAccount) {
        setSelectedAccount(adminAccount.address)
      }

    } catch (error) {
      console.error("Error detecting accounts:", error)
    }
  }

  // Switch to specific account
  const switchAccount = async (targetAddress: string) => {
    if (!window.ethereum?.request) return

    try {
      // Request to switch to specific account
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      })

      // This will trigger account selection in wallet
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      console.log("Available accounts after switch:", accounts)
      
    } catch (error) {
      console.error("Error switching account:", error)
    }
  }

  // Connect to wallet and detect accounts
  const handleConnect = async () => {
    await connectWallet()
    setTimeout(detectAccounts, 1000) // Give time for connection
  }

  // Effect to detect accounts when wallet connects
  useEffect(() => {
    if (account) {
      detectAccounts()
    }
  }, [account])

  // Effect to update selected account when account changes
  useEffect(() => {
    if (account && account !== selectedAccount) {
      setSelectedAccount(account)
    }
  }, [account])

  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>🎯 Need to connect admin wallet?</p>
            <p>Make sure it's available in your Web3 wallet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentAccount = availableAccounts.find(acc => 
    acc.address.toLowerCase() === account.toLowerCase()
  )

  return (
    <div className="space-y-4">
      {/* Current Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connected Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentAccount?.isAdmin && <Crown className="h-4 w-4 text-yellow-500" />}
                <span className="font-mono text-sm">{formatAddress(account)}</span>
                {currentAccount?.isAdmin && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Admin
                  </Badge>
                )}
              </div>
              
              {isCorrectChain ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Polygon
                </Badge>
              ) : (
                <Badge variant="destructive">
                  Wrong Network
                </Badge>
              )}
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

          {/* Actions */}
          <div className="flex gap-2">
            {!isCorrectChain ? (
              <Button
                onClick={switchToPolygon}
                variant="default"
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
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
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Selector */}
      {availableAccounts.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Switch Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {availableAccounts.map((acc) => (
                <div
                  key={acc.address}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    acc.address.toLowerCase() === account.toLowerCase()
                      ? 'border-purple-200 bg-purple-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => switchAccount(acc.address)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {acc.isAdmin && <Crown className="h-4 w-4 text-yellow-500" />}
                      <div>
                        <p className="font-mono text-sm">{formatAddress(acc.address)}</p>
                        <p className="text-xs text-muted-foreground">{acc.nickname}</p>
                      </div>
                    </div>
                    {acc.isAdmin && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Click on an account above to switch to it. Your wallet will prompt you to select the account.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Admin Help */}
      {!currentAccount?.isAdmin && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <Crown className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-yellow-800 font-medium">Need Admin Access?</p>
                <p className="text-yellow-700 mt-1">
                  To enable trading and manage contracts, you need to connect with the admin wallet:
                </p>
                <p className="text-yellow-800 font-mono text-xs mt-1">
                  {adminAddress}
                </p>
                <p className="text-yellow-700 mt-2">
                  Make sure this address is available in your Web3 wallet, then reconnect.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}