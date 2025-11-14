"use client"

import { SimpleWeb3Provider } from "@/contexts/simple-web3-context"
import { AdvancedWalletConnector } from "@/components/advanced-wallet-connector"
import { EnableTradingCard } from "@/components/enable-trading-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Zap, ArrowRight, Crown, Shield } from "lucide-react"

export default function WalletTestPage() {
  return (
    <SimpleWeb3Provider>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Advanced Wallet Manager
            </h1>
            <p className="text-muted-foreground">
              Connect, switch, and manage your Web3 wallets with admin controls
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Wallet Connection */}
            <div className="space-y-4">
              <AdvancedWalletConnector />
            </div>

            {/* Trading Control */}
            <div className="space-y-4">
              <EnableTradingCard />
            </div>
          </div>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Enhanced Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Wallet className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Multi-Account Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically detects all accounts in your wallet and lets you switch between them
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                    <Crown className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold">Admin Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically identifies and highlights the admin wallet for contract management
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Contract Controls</h3>
                  <p className="text-sm text-muted-foreground">
                    Direct access to enable trading and manage contract settings when using admin wallet
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Status */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle>Current Contract Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <h3 className="font-semibold text-purple-800 mb-2">🎯 RGC Token</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Address:</strong> 0x0708...bC5e</p>
                      <p><strong>Trading:</strong> <span className="text-red-600">❌ Disabled</span></p>
                      <p><strong>Supply:</strong> 1B RGC</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border">
                    <h3 className="font-semibold text-purple-800 mb-2">🪂 Airdrop</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Address:</strong> 0xd2D4...77f9</p>
                      <p><strong>Status:</strong> <span className="text-green-600">✅ Active</span></p>
                      <p><strong>Amount:</strong> 1,000 RGC</p>
                      <p><strong>Fee:</strong> 0.001 POL</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800">⚠️ Action Required</h3>
                  <p className="text-yellow-700 mt-1">
                    Connect the admin wallet (0x8DA112...BebF2) to enable trading and unlock full functionality.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Connect Admin Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Make sure you have the admin wallet imported in your Web3 wallet (MetaMask, etc.)</li>
                  <li>Click "Connect Wallet" above</li>
                  <li>If multiple accounts are detected, they'll appear in the "Switch Account" section</li>
                  <li>Click on the admin account (marked with 👑) to switch to it</li>
                  <li>Your wallet will prompt you to select the account</li>
                  <li>Once connected with admin, you can enable trading and manage contracts</li>
                </ol>

                <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-blue-800">Need to Import the Admin Wallet?</h4>
                  <p className="text-blue-700 mt-1 text-sm">
                    If you don't see the admin account, you'll need to import it into your Web3 wallet using the private key or seed phrase.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SimpleWeb3Provider>
  )
}