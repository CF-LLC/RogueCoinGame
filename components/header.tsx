"use client"

import Link from "next/link"
import { WalletButton } from "./wallet-button"
import { NetworkIndicator } from "./network-indicator"
import Image from "next/image"
import { useWeb3 } from "@/contexts/web3-context"
import { ADMIN_WALLET } from "@/lib/contracts"

export function Header() {
  const { account } = useWeb3()
  const isAdmin = account?.toLowerCase() === ADMIN_WALLET.toLowerCase()

  // Always show header, but with different layouts based on connection state
  const isConnected = !!account

  return (
    <header className="border-b border-border bg-card/90 backdrop-blur-sm z-50 shadow-sm">
      {/* Connected state - full header with navigation */}
      {isConnected && (
        <div className="container mx-auto px-4 flex items-center justify-between min-h-[4rem] max-sm:flex-col max-sm:py-3 max-sm:gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src={`${process.env.NODE_ENV === 'production' ? '/RogueCoinGame' : ''}/Rogue Logo.png`} alt="RogueCoin" width={32} height={32} className="object-contain" />
            <span className="font-bold text-xl text-foreground">RogueCoin</span>
          </Link>

          {/* Navigation - horizontal on larger screens, vertical on small screens */}
          <nav className="flex items-center gap-2 sm:gap-4 max-sm:flex-col max-sm:w-full max-sm:max-w-xs">
            <Link 
              href="/" 
              className="text-sm sm:text-base font-bold text-primary hover:text-primary/80 transition-all duration-200 px-2 sm:px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 flex items-center gap-1 min-w-fit max-sm:w-full max-sm:justify-center"
            >
              <span className="text-lg sm:text-xl">🎮</span>
              <span>Game</span>
            </Link>
            <Link 
              href="/airdrop" 
              className="text-sm sm:text-base font-bold text-green-600 hover:text-green-500 transition-all duration-200 px-2 sm:px-4 py-2 rounded-lg bg-green-600/10 hover:bg-green-600/20 border border-green-600/20 hover:border-green-600/40 flex items-center gap-1 min-w-fit max-sm:w-full max-sm:justify-center"
            >
              <span className="text-lg sm:text-xl">🪂</span>
              <span>Airdrop</span>
            </Link>
            <Link 
              href="/tokenomics" 
              className="text-sm sm:text-base font-bold text-purple-600 hover:text-purple-500 transition-all duration-200 px-2 sm:px-4 py-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/20 hover:border-purple-600/40 flex items-center gap-1 min-w-fit max-sm:w-full max-sm:justify-center"
            >
              <span className="text-lg sm:text-xl">📊</span>
              <span>Tokenomics</span>
            </Link>
            {isAdmin && (
              <Link 
                href="/admin" 
                className="text-sm sm:text-base font-bold text-orange-600 hover:text-orange-500 transition-all duration-200 px-2 sm:px-4 py-2 rounded-lg bg-orange-600/10 hover:bg-orange-600/20 border border-orange-600/20 hover:border-orange-600/40 flex items-center gap-1 min-w-fit max-sm:w-full max-sm:justify-center"
              >
                <span className="text-lg sm:text-xl">⚙️</span>
                <span>Admin</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <NetworkIndicator />
            <WalletButton />
          </div>
        </div>
      )}

      {/* Disconnected state - minimal header with reconnect option */}
      {!isConnected && (
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src={`${process.env.NODE_ENV === 'production' ? '/RogueCoinGame' : ''}/Rogue Logo.png`} alt="RogueCoin" width={32} height={32} className="object-contain" />
            <span className="font-bold text-xl text-foreground">RogueCoin</span>
          </Link>

          <div className="flex items-center gap-3">
            <WalletButton />
          </div>
        </div>
      )}
    </header>
  )
}
