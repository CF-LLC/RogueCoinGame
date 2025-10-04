"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import { CONTRACTS, CHAIN_NAMES, CHAIN_CURRENCY, SUPPORTED_CHAINS } from "@/lib/contracts"

interface Web3ContextType {
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  account: string | null
  chainId: number | null
  isConnecting: boolean
  error: string | null
  nativeBalance: string // Changed from ethBalance to nativeBalance (ETH/MATIC)
  rgcBalance: string
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchNetwork: (chainId: number) => Promise<void>
  addPolygonNetwork: () => Promise<void>
  refreshBalances: () => Promise<void>
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

  const connectWallet = async () => {
    try {
      setIsConnecting(true)
      setError(null)

      console.log("Attempting to connect wallet...")

      // Check if MetaMask is installed
      if (!window.ethereum) {
        console.error("MetaMask not detected")
        throw new Error("MetaMask not installed. Please install MetaMask to connect your wallet.")
      }

      console.log("MetaMask detected, requesting accounts...")

      // Request account access
      const browserProvider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await browserProvider.send("eth_requestAccounts", [])
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock your MetaMask wallet.")
      }

      console.log("Accounts found:", accounts.length)

      // Get network and signer
      const network = await browserProvider.getNetwork()
      const walletSigner = await browserProvider.getSigner()

      console.log("Connected to network:", network.chainId.toString())

      setProvider(browserProvider)
      setSigner(walletSigner)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))

      // Load balances
      await loadBalances(browserProvider, accounts[0])
      
      console.log("Wallet connected successfully!")
    } catch (err: any) {
      const errorMessage = err.message || "Failed to connect wallet"
      setError(errorMessage)
      console.error("Wallet connection error:", err)
      
      // More specific error messages
      if (err.code === 4001) {
        setError("Connection rejected by user")
      } else if (err.code === -32002) {
        setError("Connection request already pending in MetaMask")
      } else if (errorMessage.includes("eth_requestAccounts")) {
        setError("Failed to request accounts from MetaMask")
      }
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
  }

  const switchNetwork = async (targetChainId: number) => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not installed")

      const chainIdHex = `0x${targetChainId.toString(16)}`

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      })
      
      // Clear any previous errors on successful switch
      setError(null)
    } catch (err: any) {
      console.error("Network switch error:", err)
      
      if (err.code === 4902) {
        // Chain not added to MetaMask
        setError(`${CHAIN_NAMES[targetChainId]} network not added to MetaMask`)
      } else if (err.code === 4001) {
        // User rejected the request
        setError("User rejected network switch request")
      } else if (err.message?.includes("not connected")) {
        // Provider not connected to the requested chain
        setError(`Wallet not connected to ${CHAIN_NAMES[targetChainId]} network. Please switch manually in your wallet.`)
      } else {
        setError(err.message || "Failed to switch network")
      }
    }
  }

  const addPolygonNetwork = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not installed")

      // Add Polygon Mainnet (primary network for production)
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x89", // Polygon Mainnet
            chainName: "Polygon",
            nativeCurrency: {
              name: "MATIC",
              symbol: "MATIC",
              decimals: 18,
            },
            rpcUrls: ["https://polygon-rpc.com", "https://rpc-mainnet.matic.network"],
            blockExplorerUrls: ["https://polygonscan.com/"],
          },
        ],
      })

      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to add Polygon network")
      console.error("Add network error:", err)
    }
  }

  const loadBalances = async (browserProvider: ethers.BrowserProvider, address: string) => {
    try {
      // Load native balance (ETH/MATIC)
      const nativeBal = await browserProvider.getBalance(address)
      setNativeBalance(ethers.formatEther(nativeBal))

      // Load RGC balance
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

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet()
      } else if (accounts[0] !== account) {
        setAccount(accounts[0])
        if (provider) {
          loadBalances(provider, accounts[0])
        }
      }
    }

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = Number.parseInt(chainIdHex, 16)
      setChainId(newChainId)
      // Reload page on chain change (recommended by MetaMask)
      window.location.reload()
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    window.ethereum.on("chainChanged", handleChainChanged)

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged)
      window.ethereum?.removeListener("chainChanged", handleChainChanged)
    }
  }, [account, provider])

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      try {
        // Wait a moment for MetaMask to load
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (window.ethereum && window.ethereum.selectedAddress) {
          console.log("Auto-connecting to previously connected wallet...")
          await connectWallet()
        }
      } catch (error) {
        console.log("Auto-connect failed:", error)
      }
    }
    autoConnect()
  }, [])

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
        connectWallet,
        disconnectWallet,
        switchNetwork,
        addPolygonNetwork,
        refreshBalances,
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

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}
