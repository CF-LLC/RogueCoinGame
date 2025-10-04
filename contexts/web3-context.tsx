"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import { CONTRACTS } from "@/lib/contracts"

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
      const wallets: DetectedWallet[] = [
        {
          name: 'MetaMask',
          type: 'metamask',
          icon: '🦊',
          installed: !!(window.ethereum && window.ethereum.isMetaMask),
          provider: window.ethereum?.isMetaMask ? window.ethereum : undefined
        },
        {
          name: 'Phantom',
          type: 'phantom',
          icon: '👻',
          installed: !!(window.ethereum && window.ethereum.isPhantom),
          provider: window.ethereum?.isPhantom ? window.ethereum : undefined
        },
        {
          name: 'Coinbase Wallet',
          type: 'coinbase',
          icon: '🔵',
          installed: !!(window.ethereum && window.ethereum.isCoinbaseWallet),
          provider: window.ethereum?.isCoinbaseWallet ? window.ethereum : undefined
        },
        {
          name: 'Trust Wallet',
          type: 'trust',
          icon: '🛡️',
          installed: !!(window.ethereum && window.ethereum.isTrust),
          provider: window.ethereum?.isTrust ? window.ethereum : undefined
        }
      ]
      setAvailableWallets(wallets)
    }

    detectWallets()
  }, [])

  const connectWallet = async (walletType?: WalletType) => {
    try {
      setIsConnecting(true)
      setError(null)

      // Always disconnect first to ensure clean connection
      disconnectWallet()

      // If no wallet type specified, try to find the first available one
      if (!walletType) {
        const availableWallet = availableWallets.find(w => w.installed)
        if (!availableWallet) {
          throw new Error("No compatible wallets detected. Please install MetaMask, Phantom, or another supported wallet.")
        }
        walletType = availableWallet.type
      }

      let walletProvider: any
      
      switch (walletType) {
        case 'metamask':
          if (!window.ethereum?.isMetaMask) {
            throw new Error("MetaMask not installed")
          }
          walletProvider = window.ethereum
          break
          
        case 'phantom':
          if (!window.ethereum?.isPhantom) {
            throw new Error("Phantom wallet not installed or Ethereum mode not enabled")
          }
          walletProvider = window.ethereum
          break
          
        case 'coinbase':
          if (!window.ethereum?.isCoinbaseWallet) {
            throw new Error("Coinbase Wallet not installed")
          }
          walletProvider = window.ethereum
          break
          
        case 'trust':
          if (!window.ethereum?.isTrust) {
            throw new Error("Trust Wallet not installed")
          }
          walletProvider = window.ethereum
          break
          
        default:
          if (!window.ethereum) {
            throw new Error("No Ethereum wallet detected")
          }
          walletProvider = window.ethereum
      }

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

      // Update chainId state
      const network = await provider.getNetwork()
      setChainId(Number(network.chainId))
    } catch (err: any) {
      if (err.code === 4902) {
        // Chain not added to wallet, try adding it
        if (targetChainId === 137) {
          await addPolygonNetwork()
        } else {
          throw new Error(`Chain ${targetChainId} not supported. Please add it manually.`)
        }
      } else {
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
      const nativeBal = await browserProvider.getBalance(address)
      setNativeBalance(ethers.formatEther(nativeBal))

      if (CONTRACTS.RGC_TOKEN) {
        const rgcContract = new ethers.Contract(
          CONTRACTS.RGC_TOKEN,
          ["function balanceOf(address) view returns (uint256)"],
          browserProvider,
        )
        const rgcBal = await rgcContract.balanceOf(address)
        setRgcBalance(ethers.formatEther(rgcBal))
      }
    } catch (err) {
      console.error("Error loading balances:", err)
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
