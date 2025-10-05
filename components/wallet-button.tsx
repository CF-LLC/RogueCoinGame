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
import WalletSelector from "./wallet-selector"

export function WalletButton() {
  const { account, chainId, isConnecting, error, connectWallet, disconnectWallet, nativeBalance, rgcBalance, refreshBalances, availableWallets, connectedWallet } = useWeb3()
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

  const handleWalletSwitch = async (walletType: any) => {
    try {
      await connectWallet(walletType)
    } catch (error) {
      console.error("Wallet switch failed:", error)
    }
  }

  const getCurrentWalletInfo = () => {
    if (connectedWallet) {
      const wallet = availableWallets.find(w => w.type === connectedWallet)
      return wallet || { name: connectedWallet, icon: '💳' }
    }
    return { name: 'Wallet', icon: '💳' }
  }

  // If not connected, show wallet selector dropdown
  if (!account) {
    const hasInstalledWallets = availableWallets.some(w => w.installed)
    
    if (hasInstalledWallets) {
      return <WalletSelector variant="dropdown" buttonText="Connect Wallet" />
    }
    
    return (
      <div className="relative">
        <Button
          onClick={handleConnectWallet}
          disabled={isConnecting}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          size="sm"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
        {error && (
          <div className="absolute top-full right-0 mt-1 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md max-w-xs z-50">
            {error}
          </div>
        )}
      </div>
    )
  }

  const currentWallet = getCurrentWalletInfo()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1 sm:gap-2 bg-transparent text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2" size="sm">
          <span>{currentWallet.icon}</span>
          <span className="hidden sm:inline">{currentWallet.name}</span>
          <span className="sm:hidden text-xs">💳</span>
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 sm:w-64">
        <DropdownMenuLabel>Connected: {currentWallet.name}</DropdownMenuLabel>
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

        <DropdownMenuLabel className="text-sm font-medium">Switch Wallet</DropdownMenuLabel>
        {availableWallets.filter(wallet => wallet.installed && wallet.type !== connectedWallet).map((wallet) => (
          <DropdownMenuItem 
            key={wallet.type} 
            onClick={() => handleWalletSwitch(wallet.type)}
            className="cursor-pointer"
          >
            <span className="mr-2">{wallet.icon}</span>
            {wallet.name}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={disconnectWallet} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
