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
import { Badge } from "@/components/ui/badge"
import { Network, ChevronDown, Plus, AlertCircle } from "lucide-react"
import { SUPPORTED_CHAINS, CHAIN_NAMES } from "@/lib/contracts"

export function NetworkIndicator() {
  const { chainId, switchNetwork, addPolygonNetwork, error } = useWeb3()

  const handleNetworkSwitch = async (targetChainId: number) => {
    await switchNetwork(targetChainId)
  }

  const handleAddPolygon = async () => {
    await addPolygonNetwork()
  }

  if (!chainId) return null

  const targetChainId = Number.parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "80001") // Default to Mumbai
  const isCorrectNetwork = chainId === targetChainId
  const networkName = CHAIN_NAMES[chainId] || `Chain ${chainId}`
  const isSupported = Object.values(SUPPORTED_CHAINS).includes(chainId)

  if (isCorrectNetwork) {
    return (
      <Badge variant="outline" className="gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        {networkName}
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="destructive" size="sm" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Wrong Network
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Switch to Supported Network</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => handleNetworkSwitch(SUPPORTED_CHAINS.POLYGON_MUMBAI)}>
            <div className="flex items-center justify-between w-full">
              <span>Polygon Mumbai (Testnet)</span>
              {chainId === SUPPORTED_CHAINS.POLYGON_MUMBAI && (
                <Badge variant="default" className="text-xs">
                  Current
                </Badge>
              )}
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleNetworkSwitch(SUPPORTED_CHAINS.POLYGON_MAINNET)}>
            <div className="flex items-center justify-between w-full">
              <span>Polygon Mainnet</span>
              {chainId === SUPPORTED_CHAINS.POLYGON_MAINNET && (
                <Badge variant="default" className="text-xs">
                  Current
                </Badge>
              )}
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleNetworkSwitch(SUPPORTED_CHAINS.LOCALHOST)}>
            <div className="flex items-center justify-between w-full">
              <span>Localhost</span>
              {chainId === SUPPORTED_CHAINS.LOCALHOST && (
                <Badge variant="default" className="text-xs">
                  Current
                </Badge>
              )}
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleAddPolygon}>
            <Plus className="mr-2 h-4 w-4" />
            Add Polygon Networks to Wallet
          </DropdownMenuItem>

          {error && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
