"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import { CONTRACTS, RGC_TOKEN_ABI } from "@/lib/contracts"

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      isCoinbaseWallet?: boolean
      isTrust?: boolean
      isPhantom?: boolean
      request?: (request: { method: string; params?: any[] }) => Promise<any>
      send?: (method: string, params?: any[]) => Promise<any>
      on?: (event: string, handler: (...args: any[]) => void) => void
      removeListener?: (event: string, handler: (...args: any[]) => void) => void
    }
  }
}

interface SimpleWeb3ContextType {
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  account: string | null
  chainId: number | null
  isConnecting: boolean
  error: string | null
  nativeBalance: string
  rgcBalance: string
  isCorrectChain: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchToPolygon: () => Promise<void>
  refreshBalances: () => Promise<void>
}

const SimpleWeb3Context = createContext<SimpleWeb3ContextType | undefined>(undefined)

export function SimpleWeb3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nativeBalance, setNativeBalance] = useState("0")
  const [rgcBalance, setRgcBalance] = useState("0")

  const POLYGON_CHAIN_ID = 137
  const isCorrectChain = chainId === POLYGON_CHAIN_ID

  // Auto-reconnect on page load
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum?.request && localStorage.getItem('wallet-connected') === 'true') {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          })
          if (accounts && accounts.length > 0) {
            await connectWallet()
          }
        } catch (error) {
          console.log('Auto-connect failed:', error)
        }
      }
    }

    // Small delay to ensure window.ethereum is available
    setTimeout(autoConnect, 100)
  }, [])

  const connectWallet = async () => {
    if (!window.ethereum?.request) {
      setError("No wallet detected. Please install MetaMask or another Web3 wallet.")
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum as any)
      const web3Signer = await web3Provider.getSigner()
      const network = await web3Provider.getNetwork()
      
      setProvider(web3Provider)
      setSigner(web3Signer)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))
      
      // Save connection state
      localStorage.setItem('wallet-connected', 'true')
      localStorage.setItem('wallet-account', accounts[0])

      console.log('✅ Wallet connected:', {
        account: accounts[0],
        chainId: Number(network.chainId),
        isPolygon: Number(network.chainId) === POLYGON_CHAIN_ID
      })

      // Load balances
      await refreshBalances()

    } catch (error: any) {
      console.error('❌ Wallet connection error:', error)
      setError(error.message || 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setProvider(null)
    setSigner(null)
    setAccount(null)
    setChainId(null)
    setNativeBalance("0")
    setRgcBalance("0")
    setError(null)
    
    // Clear saved state
    localStorage.removeItem('wallet-connected')
    localStorage.removeItem('wallet-account')
    
    console.log('🔌 Wallet disconnected')
  }

  const switchToPolygon = async () => {
    if (!window.ethereum?.request) return

    try {
      // Try to switch to Polygon
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${POLYGON_CHAIN_ID.toString(16)}` }],
      })
    } catch (switchError: any) {
      // If chain doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${POLYGON_CHAIN_ID.toString(16)}`,
                chainName: 'Polygon',
                nativeCurrency: {
                  name: 'POL',
                  symbol: 'POL',
                  decimals: 18,
                },
                rpcUrls: ['https://polygon-mainnet.g.alchemy.com/v2/nBAwpGnF4mqnMRtGxC4Pi'],
                blockExplorerUrls: ['https://polygonscan.com/'],
              },
            ],
          })
        } catch (addError) {
          console.error('❌ Failed to add Polygon network:', addError)
        }
      } else {
        console.error('❌ Failed to switch to Polygon:', switchError)
      }
    }
  }

  const refreshBalances = async () => {
    if (!provider || !account) return

    try {
      // Get native POL balance
      const balance = await provider.getBalance(account)
      setNativeBalance(ethers.formatEther(balance))

      // Get RGC balance if on Polygon
      if (chainId === POLYGON_CHAIN_ID && CONTRACTS.RGC_TOKEN) {
        try {
          const tokenContract = new ethers.Contract(
            CONTRACTS.RGC_TOKEN,
            RGC_TOKEN_ABI,
            provider
          )
          const rgcBal = await tokenContract.balanceOf(account)
          setRgcBalance(ethers.formatEther(rgcBal))
        } catch (error) {
          console.log('Could not load RGC balance:', error)
          setRgcBalance("0")
        }
      } else {
        setRgcBalance("0")
      }
    } catch (error) {
      console.error('❌ Error refreshing balances:', error)
    }
  }

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum?.on || !window.ethereum?.removeListener) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet()
      } else if (accounts[0] !== account) {
        setAccount(accounts[0])
        localStorage.setItem('wallet-account', accounts[0])
        refreshBalances()
      }
    }

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16)
      setChainId(newChainId)
      refreshBalances()
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [account])

  const value = {
    provider,
    signer,
    account,
    chainId,
    isConnecting,
    error,
    nativeBalance,
    rgcBalance,
    isCorrectChain,
    connectWallet,
    disconnectWallet,
    switchToPolygon,
    refreshBalances,
  }

  return (
    <SimpleWeb3Context.Provider value={value}>
      {children}
    </SimpleWeb3Context.Provider>
  )
}

export function useSimpleWeb3() {
  const context = useContext(SimpleWeb3Context)
  if (context === undefined) {
    throw new Error('useSimpleWeb3 must be used within a SimpleWeb3Provider')
  }
  return context
}