"use client"

import Link from "next/link"
import { WalletButton } from "./wallet-button"
import { NetworkIndicator } from "./network-indicator"
import Image from "next/image"
import { useWeb3 } from "@/contexts/web3-context"
import { ADMIN_WALLET } from "@/lib/contracts"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu } from "lucide-react"

export function Header() {
  const { account } = useWeb3()
  const isAdmin = account?.toLowerCase() === ADMIN_WALLET.toLowerCase()

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src={`${process.env.NODE_ENV === 'production' ? '/RogueCoinGame' : ''}/Rogue Logo.png`} alt="RogueCoin" width={32} height={32} className="object-contain" />
          <span className="font-bold text-xl">RogueCoin</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm hover:text-primary transition-colors">
            Game
          </Link>
          <Link href="/airdrop" className="text-sm hover:text-primary transition-colors">
            Airdrop
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-sm hover:text-primary transition-colors">
              Admin
            </Link>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/" className="w-full">
                  Game
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/airdrop" className="w-full">
                  Airdrop
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="w-full">
                    Admin
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3">
          <NetworkIndicator />
          <WalletButton />
        </div>
      </div>
    </header>
  )
}
