"use client"

import { useWeb3 } from "@/contexts/web3-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Wifi, WifiOff } from "lucide-react"
import { SUPPORTED_CHAINS, CHAIN_NAMES, validateContracts, CONTRACTS } from "@/lib/contracts"
import WalletSelector from "@/components/wallet-selector"

export default function ContractStatus() {
  const { chainId, isConnecting, error, connectWallet, switchNetwork, addPolygonNetwork, account, availableWallets } = useWeb3()

  // Check if contracts are configured
  const missingContracts = validateContracts()
  const hasContracts = missingContracts.length === 0

  // Check if on correct network
  const isCorrectNetwork = chainId === SUPPORTED_CHAINS.POLYGON_MAINNET

  if (!account) {
    const hasInstalledWallets = availableWallets.some(w => w.installed)
    
    return (
      <div className="mb-6 space-y-4">
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>Connect your wallet to access the RogueCoin ecosystem</span>
              {!hasInstalledWallets && (
                <Button onClick={() => connectWallet()} disabled={isConnecting} size="sm">
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
        
        {hasInstalledWallets && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Multiple wallets detected</p>
          </div>
        )}
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Wrong Network</p>
              <p className="text-sm">
                Please switch to Polygon Mainnet. Currently on:{" "}
                {chainId ? CHAIN_NAMES[chainId] || `Chain ${chainId}` : "Unknown"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => switchNetwork(SUPPORTED_CHAINS.POLYGON_MAINNET)} size="sm">
                Switch Network
              </Button>
              <Button onClick={addPolygonNetwork} variant="outline" size="sm">
                Add Polygon
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (!hasContracts) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div>
            <p className="font-medium">Contracts Not Configured</p>
            <p className="text-sm">Missing contracts: {missingContracts.join(", ")}</p>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium">Connection Error</p>
          <p className="text-sm">{error}</p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-6 border-green-500/50 bg-green-500/10">
      <CheckCircle className="h-4 w-4 text-green-500" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-500" />
            <span>Connected to Polygon Mainnet</span>
            <Badge variant="outline" className="bg-green-100 text-green-700">
              RGC: {CONTRACTS.RGC_TOKEN?.slice(0, 6)}...{CONTRACTS.RGC_TOKEN?.slice(-4)}
            </Badge>
          </div>
          <span className="text-xs font-mono bg-background/50 px-2 py-1 rounded">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
      </AlertDescription>
    </Alert>
  )
}