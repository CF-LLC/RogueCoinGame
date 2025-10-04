"use client"

import { useWeb3 } from "@/contexts/web3-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Wallet, ChevronDown, Copy, LogOut, RefreshCw } from "lucide-react"
import { useState } from "react"
import { CHAIN_CURRENCY } from "@/lib/contracts"

export function WalletButton() {
  const { account, chainId, isConnecting, error, connectWallet, disconnectWallet, nativeBalance, rgcBalance, refreshBalances } = useWeb3()
  const [copied, setCopied] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyAddress = async () => {
    if (account) {
      await navigator.clipboard.writeText(account)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshBalances()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleConnectWallet = async () => {
    try {
      await connectWallet()
    } catch (error) {
      console.error("Connection failed:", error)
    }
  }

  if (!account) {
    return (
      <div className="space-y-2">
        <Button
          onClick={handleConnectWallet}
          disabled={isConnecting}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md max-w-xs">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">{formatAddress(account)}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Address</span>
            <button onClick={copyAddress} className="text-sm font-mono hover:text-primary transition-colors">
              {copied ? "Copied!" : formatAddress(account)}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{chainId ? CHAIN_CURRENCY[chainId] || "ETH" : "ETH"}</span>
            <span className="text-sm font-mono">{Number.parseFloat(nativeBalance).toFixed(4)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">RGC</span>
            <span className="text-sm font-mono">{Number.parseFloat(rgcBalance).toFixed(2)}</span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          {copied ? "Copied!" : "Copy Address"}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Balances
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={disconnectWallet} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
