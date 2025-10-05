"use client"

import { useState } from "react"
import { useWeb3, type WalletType } from "@/contexts/web3-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Wallet, ChevronDown } from "lucide-react"

interface WalletSelectorProps {
  variant?: "card" | "dropdown"
  buttonText?: string
  className?: string
}

export default function WalletSelector({ 
  variant = "card", 
  buttonText = "Choose Wallet",
  className = ""
}: WalletSelectorProps) {
  const { availableWallets, connectWallet, isConnecting, account } = useWeb3()
  const [isOpen, setIsOpen] = useState(false)

  if (account) {
    return null // Don't show selector when already connected
  }

  const handleWalletConnect = async (walletType: WalletType) => {
    try {
      await connectWallet(walletType)
      setIsOpen(false) // Close dropdown after connecting
    } catch (error) {
      console.error(`Failed to connect ${walletType}:`, error)
    }
  }

  const installedWallets = availableWallets.filter(w => w.installed)
  const hasInstalledWallets = installedWallets.length > 0

  if (variant === "dropdown") {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={`gap-2 ${className}`}>
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">{buttonText}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Choose Your Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {hasInstalledWallets ? (
            <div className="p-2 space-y-1">
              {installedWallets.map((wallet) => (
                <DropdownMenuItem
                  key={wallet.type}
                  onClick={() => handleWalletConnect(wallet.type)}
                  disabled={isConnecting}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{wallet.icon}</span>
                    <div>
                      <div className="font-medium">{wallet.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Ready to connect
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-primary font-medium">
                    {isConnecting ? "Connecting..." : "Connect"}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <p className="mb-2">No compatible wallets detected</p>
              <p className="text-xs">
                Please install MetaMask, Phantom, Coinbase Wallet, or Trust Wallet
              </p>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Original card variant for existing usage
  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="text-center">Choose Your Wallet</CardTitle>
        <CardDescription className="text-center">
          Connect to Polygon network with your preferred wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableWallets.map((wallet) => (
          <div key={wallet.type} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{wallet.icon}</span>
              <div>
                <div className="font-medium">{wallet.name}</div>
                <div className="text-sm text-muted-foreground">
                  {wallet.installed ? "Ready to connect" : "Not installed"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {wallet.installed ? (
                <Button
                  onClick={() => handleWalletConnect(wallet.type)}
                  disabled={isConnecting}
                  size="sm"
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </Button>
              ) : (
                <Badge variant="secondary">Not Installed</Badge>
              )}
            </div>
          </div>
        ))}
        
        {availableWallets.filter(w => w.installed).length === 0 && (
          <div className="text-center p-6 text-muted-foreground">
            <p className="mb-3">No compatible wallets detected</p>
            <p className="text-sm">
              Please install MetaMask, Phantom, Coinbase Wallet, or Trust Wallet to continue
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}