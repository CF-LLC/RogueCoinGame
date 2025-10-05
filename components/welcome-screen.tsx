"use client"

import { useState } from "react"
import { useWeb3 } from "@/contexts/web3-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rocket, Coins, TrendingUp, Shield, Users, Gamepad2 } from "lucide-react"
import Image from "next/image"
import WalletSelector from "./wallet-selector"

export function WelcomeScreen() {
  const { account, isConnecting } = useWeb3()
  const [showWallets, setShowWallets] = useState(false)

  // Don't show welcome screen if wallet is already connected
  if (account) return null

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        
        {/* Logo and Title Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-4">
            <Image 
              src={`${process.env.NODE_ENV === 'production' ? '/RogueCoinGame' : ''}/Rogue Logo.png`} 
              alt="RogueCoin Logo" 
              width={80} 
              height={80} 
              className="object-contain" 
            />
            <div className="text-left">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                RogueCoin
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-semibold">
                Crash Game
              </p>
            </div>
          </div>

          {/* Animated Coin */}
          <div className="flex justify-center">
            <Image
              src={`${process.env.NODE_ENV === 'production' ? '/RogueCoinGame' : ''}/MyCoin.gif`}
              alt="RogueCoin"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>

          {/* Tagline */}
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              🚀 The Ultimate On-Chain Crash Game 🚀
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Bet RGC tokens, watch the multiplier rise, and cash out before the rocket crashes! 
              Will you have the nerve to hold on for massive multipliers?
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Rocket className="h-12 w-12 text-purple-400 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Thrilling Gameplay</h3>
              <p className="text-sm text-muted-foreground">
                Watch the rocket soar and decide when to cash out before it crashes!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Coins className="h-12 w-12 text-blue-400 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">RGC Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Bet and win RogueCoin tokens with multipliers up to 100x!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-cyan-400 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">100% On-Chain</h3>
              <p className="text-sm text-muted-foreground">
                Provably fair gameplay powered by blockchain technology.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-border/50">
          <h3 className="text-xl font-bold mb-4 text-center">Game Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-400">2%</div>
              <div className="text-sm text-muted-foreground">House Edge</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">100x</div>
              <div className="text-sm text-muted-foreground">Max Multiplier</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">Instant</div>
              <div className="text-sm text-muted-foreground">Payouts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">24/7</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
          </div>
        </div>

        {/* Wallet Connection Section */}
        <div className="space-y-6">
          {!showWallets ? (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Ready to Play?</h3>
              <p className="text-muted-foreground">
                Connect your wallet to start playing and earning RGC tokens!
              </p>
              <Button 
                onClick={() => setShowWallets(true)}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 text-lg shadow-2xl transform transition-all duration-200 hover:scale-105"
              >
                <Gamepad2 className="mr-3 h-6 w-6" />
                Connect Wallet & Play
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Choose Your Wallet</h3>
              <div className="max-w-md mx-auto">
                <WalletSelector variant="card" />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowWallets(false)}
                className="mt-4"
              >
                Back
              </Button>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="space-y-4 pt-8 border-t border-border/30">
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Multiplayer</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Real-time</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Secure</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            RogueCoin Crash Game is a provably fair gambling game. Play responsibly. 
            Must be 18+ to play. Ensure you're in a jurisdiction where cryptocurrency gambling is legal.
          </p>
        </div>
      </div>
    </div>
  )
}