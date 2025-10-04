"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Info } from "lucide-react"

export function GetPOLGuide() {
  return (
    <Card className="border-blue-500/20 bg-blue-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Need POL Tokens?
        </CardTitle>
        <CardDescription>
          You need POL (Polygon's native token) to pay for transaction fees and claim the airdrop
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>POL</strong> is the native token of Polygon network, formerly known as MATIC. You need it to pay for gas fees.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <h4 className="font-semibold">How to get POL:</h4>
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
              <div>
                <p className="font-medium">1. Buy on Exchanges</p>
                <p className="text-sm text-muted-foreground">Purchase POL on Binance, Coinbase, or other exchanges</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="https://coinmarketcap.com/currencies/polygon/markets/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
              <div>
                <p className="font-medium">2. Bridge from Ethereum</p>
                <p className="text-sm text-muted-foreground">Use Polygon Bridge to move ETH/USDC to Polygon</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="https://portal.polygon.technology/bridge" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
              <div>
                <p className="font-medium">3. Polygon Faucet (Testnet)</p>
                <p className="text-sm text-muted-foreground">Get free test POL for development</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="https://faucet.polygon.technology/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
        
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertDescription>
            💡 <strong>Tip:</strong> You only need a small amount of POL (~0.001-0.01) for gas fees. The airdrop claim fee varies based on the contract settings.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}