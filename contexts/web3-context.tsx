"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import { CONTRACTS, RGC_TOKEN_ABI } from "@/lib/contracts"

export type WalletType = 'metamask' | 'phantom' | 'walletconnect' | 'coinbase' | 'trust'

export interface DetectedWallet {
  name: string
  type: WalletType
  icon: string
  installed: boolean
  provider?: any
}

interface Web3ContextType {
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  account: string | null
  chainId: number | null
  isConnecting: boolean
  error: string | null
  nativeBalance: string
  rgcBalance: string
  connectedWallet: WalletType | null
  availableWallets: DetectedWallet[]
  connectWallet: (walletType?: WalletType) => Promise<void>
  disconnectWallet: () => void
  refreshBalances: () => Promise<void>
  switchNetwork: (chainId: number) => Promise<void>
  addPolygonNetwork: () => Promise<void>
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nativeBalance, setNativeBalance] = useState("0")
  const [rgcBalance, setRgcBalance] = useState("0")
  const [connectedWallet, setConnectedWallet] = useState<WalletType | null>(null)
  const [availableWallets, setAvailableWallets] = useState<DetectedWallet[]>([])

  // Detect available wallets on component mount
  useEffect(() => {
    const detectWallets = () => {
      const wallets: DetectedWallet[] = []
      
      console.log('=== Wallet Detection Debug ===')
      console.log('window.ethereum exists:', !!window.ethereum)
      console.log('window.ethereum object:', window.ethereum)
      console.log('window.ethereum.isMetaMask:', window.ethereum?.isMetaMask)
      console.log('window.ethereum.isPhantom:', window.ethereum?.isPhantom)
      console.log('window.ethereum.providers:', (window.ethereum as any)?.providers)
      
      // Check if we have multiple providers
      if ((window.ethereum as any)?.providers) {
        const providers = (window.ethereum as any).providers
        console.log('=== Multiple Providers Detected ===')
        providers.forEach((p: any, index: number) => {
          console.log(`Provider ${index}:`, {
            isMetaMask: p.isMetaMask,
            isPhantom: p.isPhantom,
            isCoinbaseWallet: p.isCoinbaseWallet,
            isTrust: p.isTrust,
            _metamask: p._metamask,
            phantom: p.phantom,
            provider: p
          })
        })
        
        // MetaMask - more thorough detection
        const metamaskProvider = providers.find((p: any) => {
          const isMetaMaskProvider = (p.isMetaMask === true || p._metamask) && !p.isPhantom
          console.log('Checking provider for MetaMask:', { isMetaMask: p.isMetaMask, _metamask: p._metamask, isPhantom: p.isPhantom, result: isMetaMaskProvider })
          return isMetaMaskProvider
        })
        console.log('Found MetaMask provider:', !!metamaskProvider)
        
        wallets.push({
          name: 'MetaMask',
          type: 'metamask',
          icon: '🦊',
          installed: !!metamaskProvider,
          provider: metamaskProvider
        })
        
        // Phantom
        const phantomProvider = providers.find((p: any) => p.isPhantom === true || p.phantom)
        wallets.push({
          name: 'Phantom',
          type: 'phantom',
          icon: '👻',
          installed: !!phantomProvider,
          provider: phantomProvider
        })
        
        // Coinbase
        const coinbaseProvider = providers.find((p: any) => p.isCoinbaseWallet === true || p.coinbase)
        wallets.push({
          name: 'Coinbase Wallet',
          type: 'coinbase',
          icon: '🔵',
          installed: !!coinbaseProvider,
          provider: coinbaseProvider
        })
        
        // Trust
        const trustProvider = providers.find((p: any) => p.isTrust === true || p.trust)
        wallets.push({
          name: 'Trust Wallet',
          type: 'trust',
          icon: '🛡️',
          installed: !!trustProvider,
          provider: trustProvider
        })
      } else if (window.ethereum) {
        console.log('=== Single Provider Detected ===')
        console.log('Provider details:', {
          isMetaMask: window.ethereum.isMetaMask,
          isPhantom: window.ethereum.isPhantom,
          isCoinbaseWallet: window.ethereum.isCoinbaseWallet,
          isTrust: window.ethereum.isTrust,
          _metamask: (window.ethereum as any)._metamask,
          phantom: (window.ethereum as any).phantom
        })
        
        // Single provider - improved MetaMask detection
        const isMetaMask = !!(window.ethereum.isMetaMask === true || (window.ethereum as any)._metamask) && !window.ethereum.isPhantom
        const isPhantom = !!(window.ethereum.isPhantom === true || (window.ethereum as any).phantom)
        const isCoinbase = !!(window.ethereum.isCoinbaseWallet === true || (window.ethereum as any).coinbase)
        const isTrust = !!(window.ethereum.isTrust === true || (window.ethereum as any).trust)
        
        console.log('Wallet detection results:', { isMetaMask, isPhantom, isCoinbase, isTrust })
        
        wallets.push({
          name: 'MetaMask',
          type: 'metamask',
          icon: '🦊',
          installed: isMetaMask,
          provider: isMetaMask ? window.ethereum : undefined
        })
        
        wallets.push({
          name: 'Phantom',
          type: 'phantom',
          icon: '👻',
          installed: isPhantom,
          provider: isPhantom ? window.ethereum : undefined
        })
        
        wallets.push({
          name: 'Coinbase Wallet',
          type: 'coinbase',
          icon: '🔵',
          installed: isCoinbase,
          provider: isCoinbase ? window.ethereum : undefined
        })
        
        wallets.push({
          name: 'Trust Wallet',
          type: 'trust',
          icon: '🛡️',
          installed: isTrust,
          provider: isTrust ? window.ethereum : undefined
        })
      } else {
        console.log('=== No Ethereum Provider ===')
        // No ethereum provider
        wallets.push(
          {
            name: 'MetaMask',
            type: 'metamask',
            icon: '🦊',
            installed: false,
            provider: undefined
          },
          {
            name: 'Phantom',
            type: 'phantom',
            icon: '👻',
            installed: false,
            provider: undefined
          },
          {
            name: 'Coinbase Wallet',
            type: 'coinbase',
            icon: '🔵',
            installed: false,
            provider: undefined
          },
          {
            name: 'Trust Wallet',
            type: 'trust',
            icon: '🛡️',
            installed: false,
            provider: undefined
          }
        )
      }
      
      // Add WalletConnect for mobile support
      wallets.push({
        name: 'WalletConnect',
        type: 'walletconnect',
        icon: '📱',
        installed: true, // WalletConnect is always "available"
        provider: undefined // Will be created dynamically
      })
      
      // FALLBACK: If MetaMask isn't detected but we know it's likely installed
      const metamaskWallet = wallets.find(w => w.type === 'metamask')
      if (!metamaskWallet?.installed && window.ethereum) {
        console.log('=== MetaMask Fallback Detection ===')
        // Try to detect MetaMask by checking for specific methods or properties
        const hasMetaMaskMethods = window.ethereum.request && typeof window.ethereum.request === 'function'
        const hasMetaMaskInUserAgent = navigator.userAgent.includes('MetaMask')
        const hasMetaMaskDomain = window.location.hostname.includes('metamask') || document.domain.includes('metamask')
        
        // If we have ethereum object with request method, assume it's MetaMask as fallback
        if (hasMetaMaskMethods && !wallets.some(w => w.installed && w.type !== 'walletconnect')) {
          console.log('Fallback MetaMask detection triggered')
          const metamaskIndex = wallets.findIndex(w => w.type === 'metamask')
          if (metamaskIndex !== -1) {
            wallets[metamaskIndex] = {
              name: 'MetaMask (detected)',
              type: 'metamask',
              icon: '🦊',
              installed: true,
              provider: window.ethereum
            }
          }
        }
      }
      
      console.log('=== Final Wallet List ===')
      wallets.forEach(wallet => {
        console.log(`${wallet.name}: installed=${wallet.installed}, provider=${!!wallet.provider}`)
      })
      
      setAvailableWallets(wallets)
    }

    // Add multiple detection attempts to ensure all wallet providers are loaded
    detectWallets() // Run immediately
    const timeoutId1 = setTimeout(detectWallets, 100) // After 100ms
    const timeoutId2 = setTimeout(detectWallets, 500) // After 500ms
    const timeoutId3 = setTimeout(detectWallets, 1000) // After 1s (for slow loading wallets)
    
    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
      clearTimeout(timeoutId3)
    }
  }, [])

  const connectWallet = async (walletType?: WalletType) => {
    try {
      setIsConnecting(true)
      setError(null)

      console.log('Connecting wallet...', { walletType, availableWallets })

      // Always disconnect first to ensure clean connection
      disconnectWallet()
      
      // Wait a moment for disconnection to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // If no wallet type specified, try to find the first available one
      if (!walletType) {
        const availableWallet = availableWallets.find(w => w.installed)
        if (!availableWallet) {
          throw new Error("No compatible wallets detected. Please install MetaMask, Phantom, or another supported wallet.")
        }
        walletType = availableWallet.type
      }

      console.log('Selected wallet type:', walletType)

      let walletProvider: any
      
      // Get the specific wallet provider based on type
      switch (walletType) {
        case 'metamask':
          if ((window.ethereum as any)?.providers) {
            // Multiple wallets detected, find MetaMask specifically
            console.log('Multiple providers detected, finding MetaMask...')
            walletProvider = (window.ethereum as any).providers.find((p: any) => (p.isMetaMask === true || p._metamask) && !p.isPhantom)
          } else if ((window.ethereum?.isMetaMask === true || (window.ethereum as any)?._metamask) && !window.ethereum?.isPhantom) {
            console.log('Single MetaMask provider detected')
            walletProvider = window.ethereum
          }
          
          // Fallback: if we can't find specific MetaMask provider, try window.ethereum anyway
          if (!walletProvider && window.ethereum) {
            console.log('Using fallback window.ethereum for MetaMask')
            walletProvider = window.ethereum
          }
          
          if (!walletProvider) {
            console.error('MetaMask provider not found')
            throw new Error("MetaMask not installed or not detected. Please install MetaMask browser extension.")
          }
          break
          
        case 'phantom':
          if ((window.ethereum as any)?.providers) {
            // Multiple wallets detected, find Phantom specifically  
            walletProvider = (window.ethereum as any).providers.find((p: any) => p.isPhantom === true || p.phantom)
          } else if (window.ethereum?.isPhantom === true || (window.ethereum as any)?.phantom) {
            walletProvider = window.ethereum
          }
          if (!walletProvider) {
            throw new Error("Phantom wallet not installed or Ethereum mode not enabled")
          }
          break
          
        case 'coinbase':
          if ((window.ethereum as any)?.providers) {
            walletProvider = (window.ethereum as any).providers.find((p: any) => p.isCoinbaseWallet === true || p.coinbase)
          } else if (window.ethereum?.isCoinbaseWallet === true || (window.ethereum as any)?.coinbase) {
            walletProvider = window.ethereum
          }
          if (!walletProvider) {
            throw new Error("Coinbase Wallet not installed")
          }
          break
          
        case 'trust':
          if ((window.ethereum as any)?.providers) {
            walletProvider = (window.ethereum as any).providers.find((p: any) => p.isTrust === true || p.trust)
          } else if (window.ethereum?.isTrust === true || (window.ethereum as any)?.trust) {
            walletProvider = window.ethereum
          }
          if (!walletProvider) {
            throw new Error("Trust Wallet not installed")
          }
          break

        case 'walletconnect':
          // For mobile support - open MetaMask mobile app or show QR
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
          
          if (isMobile) {
            // Try to open MetaMask mobile app first
            const deepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`
            window.open(deepLink, '_blank')
            throw new Error("Opening MetaMask mobile app... If it doesn't open, please use the MetaMask browser or install the MetaMask app.")
          } else {
            // Desktop - try to use installed wallet or show instructions
            if (window.ethereum) {
              walletProvider = window.ethereum
            } else {
              throw new Error("For mobile wallets, please use your wallet's built-in browser or scan QR codes from supported dApps.")
            }
          }
          break
          
        default:
          if (!window.ethereum) {
            throw new Error("No Ethereum wallet detected")
          }
          walletProvider = window.ethereum
      }

      console.log(`Connecting to ${walletType}...`, { provider: walletProvider })
      
      const browserProvider = new ethers.BrowserProvider(walletProvider)
      
      // Request accounts with explicit wallet selection
      const accounts = await browserProvider.send("eth_requestAccounts", [])
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock your wallet.")
      }

      const network = await browserProvider.getNetwork()
      const walletSigner = await browserProvider.getSigner()

      setProvider(browserProvider)
      setSigner(walletSigner)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))
      setConnectedWallet(walletType)

      await loadBalances(browserProvider, accounts[0])
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet")
      // Clear everything on error
      disconnectWallet()
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setProvider(null)
    setSigner(null)
    setAccount(null)
    setChainId(null)
    setConnectedWallet(null)
    setNativeBalance("0")
    setRgcBalance("0")
    setError(null)
  }

  const switchNetwork = async (targetChainId: number) => {
    try {
      if (!provider || !window.ethereum) {
        throw new Error("Wallet not connected")
      }

      const hexChainId = `0x${targetChainId.toString(16)}`
      
      if (!window.ethereum.request) {
        throw new Error("Wallet does not support network switching")
      }
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      })

      // Wait for network change and update state
      try {
        const network = await provider.getNetwork()
        setChainId(Number(network.chainId))
        
        // Reload balances on new network
        if (account) {
          await loadBalances(provider, account)
        }
      } catch (networkError) {
        // Network change happened but might take time to reflect
        console.log('Network switch initiated, waiting for confirmation...')
        setTimeout(async () => {
          try {
            const network = await provider.getNetwork()
            setChainId(Number(network.chainId))
            if (account) {
              await loadBalances(provider, account)
            }
          } catch (e) {
            console.warn('Could not confirm network change:', e)
          }
        }, 1000)
      }
    } catch (err: any) {
      if (err.code === 4902) {
        // Chain not added to wallet, try adding it
        if (targetChainId === 137) {
          await addPolygonNetwork()
        } else {
          throw new Error(`Chain ${targetChainId} not supported. Please add it manually.`)
        }
      } else {
        // Don't throw on network change events, they're expected
        if (err.code === 'NETWORK_ERROR' && err.message.includes('network changed')) {
          console.log('Network change detected:', err.message)
          return
        }
        throw new Error(err.message || "Failed to switch network")
      }
    }
  }

  const addPolygonNetwork = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("Wallet not connected")
      }

      if (!window.ethereum.request) {
        throw new Error("Wallet does not support adding networks")
      }
      
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x89',
          chainName: 'Polygon Mainnet',
          nativeCurrency: {
            name: 'POL',
            symbol: 'POL',
            decimals: 18,
          },
          rpcUrls: ['https://polygon-rpc.com/'],
          blockExplorerUrls: ['https://polygonscan.com/'],
        }],
      })

      // After adding, switch to it
      await switchNetwork(137)
    } catch (err: any) {
      throw new Error(err.message || "Failed to add Polygon network")
    }
  }

  const loadBalances = async (browserProvider: ethers.BrowserProvider, address: string) => {
    try {
      // Get network first
      const network = await browserProvider.getNetwork()
      const chainId = Number(network.chainId)
      
      console.log('Loading balances for network:', chainId)
      
      // Get native balance
      const balance = await browserProvider.getBalance(address)
      setNativeBalance(ethers.formatEther(balance))

      // Only try to load RGC balance if we have a valid contract address
      if (CONTRACTS.RGC_TOKEN && CONTRACTS.RGC_TOKEN !== "" && CONTRACTS.RGC_TOKEN !== "0x0000000000000000000000000000000000000000") {
        try {
          const rgcContract = new ethers.Contract(
            CONTRACTS.RGC_TOKEN,
            RGC_TOKEN_ABI,
            browserProvider,
          )
          const rgcBal = await rgcContract.balanceOf(address)
          setRgcBalance(ethers.formatEther(rgcBal))
        } catch (rgcError) {
          console.warn('Failed to load RGC balance:', rgcError)
          setRgcBalance("0")
        }
      } else {
        console.warn('RGC contract address not configured')
        setRgcBalance("0")
      }
    } catch (err) {
      console.error("Failed to load balances:", err)
      setNativeBalance("0")
      setRgcBalance("0")
    }
  }

  const refreshBalances = async () => {
    if (provider && account) {
      await loadBalances(provider, account)
    }
  }

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        isConnecting,
        error,
        nativeBalance,
        rgcBalance,
        connectedWallet,
        availableWallets,
        connectWallet,
        disconnectWallet,
        refreshBalances,
        switchNetwork,
        addPolygonNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}

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
