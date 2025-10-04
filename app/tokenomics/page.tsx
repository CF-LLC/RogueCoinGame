"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/contexts/web3-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ExternalLink, Coins, TrendingUp, Users, Zap, Shield, Globe, Copy, Check } from "lucide-react"
import { ethers } from "ethers"
import { CONTRACTS, RGC_TOKEN_ABI } from "@/lib/contracts"
import ContractStatus from "@/components/contract-status"
import Image from "next/image"

interface TokenStats {
  totalSupply: string
  tradingEnabled: boolean
  maxTransactionAmount: string
  maxWalletAmount: string
  releasableTeamTokens: string
  distribution: {
    publicSale: string
    liquidity: string
    team: string
    marketing: string
    development: string
    reserve: string
  }
}

export default function TokenomicsPage() {
  const { account, signer } = useWeb3()
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const contractAddress = CONTRACTS.RGC_TOKEN
  
  // Fallback static data for when contracts aren't available
  const staticTokenStats: TokenStats = {
    totalSupply: "1000000000", // 1 billion tokens
    tradingEnabled: true,
    maxTransactionAmount: "5000000", // 5M tokens
    maxWalletAmount: "20000000", // 20M tokens
    releasableTeamTokens: "0",
    distribution: {
      publicSale: "400000000", // 40%
      liquidity: "200000000", // 20%
      team: "150000000", // 15%
      marketing: "100000000", // 10%
      development: "100000000", // 10%
      reserve: "50000000" // 5%
    }
  }
  
  useEffect(() => {
    loadTokenStats()
    // Set page title for client component
    document.title = "RogueCoin Tokenomics - RGC Token Distribution & Utility"
  }, [signer])

  const loadTokenStats = async () => {
    // Always show static data first for immediate display
    setTokenStats(staticTokenStats)
    setLoading(false)
    
    if (!signer || !CONTRACTS.RGC_TOKEN) {
      console.log("Using static tokenomics data - no wallet or contract available")
      return
    }

    try {
      const tokenContract = new ethers.Contract(CONTRACTS.RGC_TOKEN, RGC_TOKEN_ABI, signer)
      
      // Try to load live data and update if successful
      const [
        totalSupply,
        tradingEnabled,
        maxTxAmount,
        maxWalletAmount,
        releasableTeam,
        distribution
      ] = await Promise.all([
        tokenContract.totalSupply(),
        tokenContract.tradingEnabled(),
        tokenContract.maxTransactionAmount(),
        tokenContract.maxWalletAmount(),
        tokenContract.getReleasableTeamTokens(),
        tokenContract.getTokenDistribution()
      ])

      // Update with live data
      setTokenStats({
        totalSupply: ethers.formatEther(totalSupply),
        tradingEnabled,
        maxTransactionAmount: ethers.formatEther(maxTxAmount),
        maxWalletAmount: ethers.formatEther(maxWalletAmount),
        releasableTeamTokens: ethers.formatEther(releasableTeam),
        distribution: {
          publicSale: ethers.formatEther(distribution[0]),
          liquidity: ethers.formatEther(distribution[1]),
          team: ethers.formatEther(distribution[2]),
          marketing: ethers.formatEther(distribution[3]),
          development: ethers.formatEther(distribution[4]),
          reserve: ethers.formatEther(distribution[5])
        }
      })
      console.log("Loaded live contract data successfully")
    } catch (error) {
      console.log("Using static tokenomics data - contract not available:", error)
      // Keep static data on error
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatNumber = (num: string) => {
    return Number.parseFloat(num).toLocaleString(undefined, { maximumFractionDigits: 0 })
  }

  const formatPercentage = (part: string, total: string) => {
    const percentage = (Number.parseFloat(part) / Number.parseFloat(total)) * 100
    return percentage.toFixed(1)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ContractStatus />
      
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-32 h-32 mb-4">
            <Image
              src={`${process.env.NODE_ENV === 'production' ? '/RogueCoinGame' : ''}/My_Coin.png`}
              alt="RogueCoin"
              width={128}
              height={128}
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            RogueCoin Tokenomics
          </h1>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
            Comprehensive overview of RGC token distribution, utility, and ecosystem mechanics
          </p>
        </div>

        {/* Contract Info */}
        <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              Contract Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Contract Address</p>
                <div className="flex items-center gap-2 p-2 bg-background rounded border">
                  <code className="text-sm flex-1 font-mono">{contractAddress}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(contractAddress)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Network</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                    Polygon Mainnet
                  </Badge>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://polygonscan.com/token/${contractAddress}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="utility">Utility</TabsTrigger>
            <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Total Supply
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">
                    {tokenStats ? formatNumber(tokenStats.totalSupply) : "Loading..."}
                  </p>
                  <p className="text-sm text-muted-foreground">RGC Tokens</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trading Status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant={tokenStats?.tradingEnabled ? "default" : "secondary"}>
                      {tokenStats ? (tokenStats.tradingEnabled ? "Enabled" : "Disabled") : "Loading..."}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Live on Polygon</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Max Transaction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {tokenStats ? formatNumber(tokenStats.maxTransactionAmount) : "Loading..."}
                  </p>
                  <p className="text-sm text-muted-foreground">RGC per transaction</p>
                </CardContent>
              </Card>
            </div>

            {/* Token Features */}
            <Card>
              <CardHeader>
                <CardTitle>Token Features</CardTitle>
                <CardDescription>Key characteristics of RogueCoin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Gaming Utility</h4>
                        <p className="text-sm text-muted-foreground">Primary currency for crash game betting and rewards</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Anti-Whale Protection</h4>
                        <p className="text-sm text-muted-foreground">Transaction and wallet limits prevent manipulation</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Polygon Network</h4>
                        <p className="text-sm text-muted-foreground">Fast, low-cost transactions on Polygon</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Community Driven</h4>
                        <p className="text-sm text-muted-foreground">Governance and ecosystem development</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            {/* Distribution Chart */}
            {tokenStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Token Distribution</CardTitle>
                  <CardDescription>Allocation breakdown of {formatNumber(tokenStats.totalSupply)} RGC tokens</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Distribution Items */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Public Sale</span>
                          <span className="text-sm text-muted-foreground">
                            {formatPercentage(tokenStats.distribution.publicSale, tokenStats.totalSupply)}%
                          </span>
                        </div>
                        <Progress 
                          value={Number.parseFloat(formatPercentage(tokenStats.distribution.publicSale, tokenStats.totalSupply))} 
                          className="h-2 bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(tokenStats.distribution.publicSale)} RGC
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Liquidity Pool</span>
                          <span className="text-sm text-muted-foreground">
                            {formatPercentage(tokenStats.distribution.liquidity, tokenStats.totalSupply)}%
                          </span>
                        </div>
                        <Progress 
                          value={Number.parseFloat(formatPercentage(tokenStats.distribution.liquidity, tokenStats.totalSupply))} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(tokenStats.distribution.liquidity)} RGC
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Team & Advisors</span>
                          <span className="text-sm text-muted-foreground">
                            {formatPercentage(tokenStats.distribution.team, tokenStats.totalSupply)}%
                          </span>
                        </div>
                        <Progress 
                          value={Number.parseFloat(formatPercentage(tokenStats.distribution.team, tokenStats.totalSupply))} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(tokenStats.distribution.team)} RGC
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Marketing</span>
                          <span className="text-sm text-muted-foreground">
                            {formatPercentage(tokenStats.distribution.marketing, tokenStats.totalSupply)}%
                          </span>
                        </div>
                        <Progress 
                          value={Number.parseFloat(formatPercentage(tokenStats.distribution.marketing, tokenStats.totalSupply))} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(tokenStats.distribution.marketing)} RGC
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Development</span>
                          <span className="text-sm text-muted-foreground">
                            {formatPercentage(tokenStats.distribution.development, tokenStats.totalSupply)}%
                          </span>
                        </div>
                        <Progress 
                          value={Number.parseFloat(formatPercentage(tokenStats.distribution.development, tokenStats.totalSupply))} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(tokenStats.distribution.development)} RGC
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Reserve Fund</span>
                          <span className="text-sm text-muted-foreground">
                            {formatPercentage(tokenStats.distribution.reserve, tokenStats.totalSupply)}%
                          </span>
                        </div>
                        <Progress 
                          value={Number.parseFloat(formatPercentage(tokenStats.distribution.reserve, tokenStats.totalSupply))} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(tokenStats.distribution.reserve)} RGC
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vesting Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Vesting Schedule</CardTitle>
                <CardDescription>Token release timeline for different allocations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Public Sale & Liquidity</h4>
                      <Badge variant="outline" className="bg-green-100 text-green-700">Immediate Release</Badge>
                      <p className="text-sm text-muted-foreground mt-2">Available at TGE (Token Generation Event)</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Team & Advisors</h4>
                      <Badge variant="outline" className="bg-orange-100 text-orange-700">12 Month Cliff</Badge>
                      <p className="text-sm text-muted-foreground mt-2">Linear vesting over 24 months after cliff</p>
                    </div>
                  </div>
                  
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Team tokens are locked to ensure long-term commitment and prevent early dumping.
                      {tokenStats && (
                        <span className="block mt-1 font-medium">
                          Currently releasable: {formatNumber(tokenStats.releasableTeamTokens)} RGC
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="utility" className="space-y-6">
            {/* Utility Overview */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Gaming Ecosystem
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-medium">Crash Game Currency</h4>
                    <p className="text-sm text-muted-foreground">Primary betting token for the crash game with multiplier rewards</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Airdrop Claims</h4>
                    <p className="text-sm text-muted-foreground">Free token distribution to bootstrap user adoption</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Tournament Entry</h4>
                    <p className="text-sm text-muted-foreground">Entry fees and prize pools for competitive gaming events</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Community Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-medium">Governance Rights</h4>
                    <p className="text-sm text-muted-foreground">Vote on game parameters, new features, and ecosystem direction</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Staking Rewards</h4>
                    <p className="text-sm text-muted-foreground">Earn additional RGC by staking tokens in liquidity pools</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">VIP Benefits</h4>
                    <p className="text-sm text-muted-foreground">Exclusive access to features based on token holdings</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Value Accrual */}
            <Card>
              <CardHeader>
                <CardTitle>Value Accrual Mechanisms</CardTitle>
                <CardDescription>How RGC captures value from the gaming ecosystem</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">Game Revenue</h4>
                    <p className="text-sm text-muted-foreground">House edge from crash game generates token buybacks</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Coins className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">Token Burns</h4>
                    <p className="text-sm text-muted-foreground">Regular burns reduce supply and increase scarcity</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Shield className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">Liquidity Mining</h4>
                    <p className="text-sm text-muted-foreground">Incentivize liquidity provision and token holding</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mechanics" className="space-y-6">
            {/* Technical Details */}
            <Card>
              <CardHeader>
                <CardTitle>Technical Specifications</CardTitle>
                <CardDescription>Smart contract features and security measures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Security Features</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Pausable contract for emergency stops</li>
                        <li>• Reentrancy protection on all functions</li>
                        <li>• Owner-only administrative functions</li>
                        <li>• OpenZeppelin battle-tested libraries</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Anti-Whale Measures</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Maximum transaction limits</li>
                        <li>• Maximum wallet holding limits</li>
                        <li>• Gradual limit removal mechanism</li>
                        <li>• Early trading restrictions</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Current Limits</h4>
                      {tokenStats ? (
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• Max Transaction: {formatNumber(tokenStats.maxTransactionAmount)} RGC</li>
                          <li>• Max Wallet: {formatNumber(tokenStats.maxWalletAmount)} RGC</li>
                          <li>• Trading: {tokenStats.tradingEnabled ? "Enabled" : "Disabled"}</li>
                          <li>• Network: Polygon Mainnet</li>
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">Loading contract data...</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Standard Compliance</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• ERC-20 standard implementation</li>
                        <li>• Full compatibility with DEXs</li>
                        <li>• Wallet support across ecosystem</li>
                        <li>• Audited smart contract code</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Roadmap */}
            <Card>
              <CardHeader>
                <CardTitle>Development Roadmap</CardTitle>
                <CardDescription>Future enhancements and feature releases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">Phase 1</Badge>
                        <span className="font-semibold">Launch & Stabilization</span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✅ Token deployment and initial distribution</li>
                        <li>✅ Crash game implementation</li>
                        <li>✅ Airdrop system launch</li>
                        <li>🔄 Liquidity bootstrapping</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">Phase 2</Badge>
                        <span className="font-semibold">Ecosystem Expansion</span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>📋 Additional game modes</li>
                        <li>📋 Staking and yield farming</li>
                        <li>📋 NFT integration</li>
                        <li>📋 Tournament system</li>
                      </ul>
                    </div>
                  </div>
                  
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      Development is community-driven with regular updates and feature requests taken from token holders.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="text-center bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="py-8">
            <h3 className="text-2xl font-bold mb-4">Ready to Join the RogueCoin Ecosystem?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Start your journey with free tokens from our airdrop, then experience the thrill of the crash game.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <a href="/airdrop">Claim Airdrop</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="/">Play Game</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}