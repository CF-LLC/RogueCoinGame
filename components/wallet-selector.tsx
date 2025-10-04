"use client"

import { useWeb3, type WalletType } from "@/contexts/web3-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function WalletSelector() {
  const { availableWallets, connectWallet, isConnecting, account } = useWeb3()

  if (account) {
    return null // Don't show selector when already connected
  }

  const handleWalletConnect = async (walletType: WalletType) => {
    try {
      await connectWallet(walletType)
    } catch (error) {
      console.error(`Failed to connect ${walletType}:`, error)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
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