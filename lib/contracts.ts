import { ethers } from "ethers"

// Contract ABIs for production contracts
export const RGC_TOKEN_ABI = [
  // Standard ERC20 functions
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function totalSupply() view returns (uint256)",
  
  // Production-specific functions
  "function tradingEnabled() view returns (bool)",
  "function maxTransactionAmount() view returns (uint256)",
  "function maxWalletAmount() view returns (uint256)",
  "function getReleasableTeamTokens() view returns (uint256)",
  "function getTokenDistribution() view returns (uint256, uint256, uint256, uint256, uint256, uint256)",
  
  // Admin functions (only owner can call)
  "function enableTrading()",
  "function pause()",
  "function unpause()",
  "function setMaxTransactionAmount(uint256)",
  "function setMaxWalletAmount(uint256)",
  "function removeLimits()",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event TradingEnabled(uint256 timestamp)",
]

export const AIRDROP_ABI = [
  "function claimAirdrop() payable",
  "function hasClaimed(address user) view returns (bool)",
  "function airdropAmount() view returns (uint256)",
  "function claimFee() view returns (uint256)",
  "function getStats() view returns (uint256, uint256, uint256, uint256, uint256)",
  "function setAirdropAmount(uint256 amount)",
  "function setClaimFee(uint256 fee)",
  "function withdrawETH()",
  "function withdrawTokens(uint256 amount)",
  "event AirdropClaimed(address indexed user, uint256 amount, uint256 fee)",
]

export const CRASH_GAME_ABI = [
  "function placeBet(uint256 amount, uint256 clientSeed) returns (uint256)",
  "function cashOut(uint256 roundId, uint256 multiplier)",
  "function settleLoss(uint256 roundId)",
  "function revealCrash(uint256 roundId, uint256 serverSeed)",
  "function getRound(uint256 roundId) view returns (tuple(address player, uint256 betAmount, uint256 clientSeed, uint256 serverSeed, bytes32 serverSeedHash, uint256 crashMultiplier, uint256 cashOutMultiplier, uint256 timestamp, bool settled, bool won))",
  "function getPlayerRounds(address player) view returns (uint256[])",
  "function getStats() view returns (uint256, uint256, uint256, uint256, uint256)",
  "function minBet() view returns (uint256)",
  "function maxBet() view returns (uint256)",
  "function houseEdge() view returns (uint256)",
  "event BetPlaced(uint256 indexed roundId, address indexed player, uint256 amount, uint256 clientSeed)",
  "event CrashRevealed(uint256 indexed roundId, uint256 crashMultiplier, uint256 serverSeed)",
  "event CashedOut(uint256 indexed roundId, address indexed player, uint256 multiplier, uint256 winnings)",
  "event RoundSettled(uint256 indexed roundId, bool won, uint256 payout)",
]

export const CONTRACTS = {
  RGC_TOKEN: process.env.NEXT_PUBLIC_RGC_TOKEN_ADDRESS || "0x0708a9DD95F191711221D5D0BC8B12B2C5b7bC5e",
  AIRDROP: process.env.NEXT_PUBLIC_AIRDROP_ADDRESS || "0xd2D45bdf0e4C8393E9BC57bAd363b01Eaeb377f9",
  CRASH_GAME: process.env.NEXT_PUBLIC_CRASH_GAME_ADDRESS || "0xf8f6F8f1c656DbD0540C26B3Bfa1969B500AdB5c",
}

// Validation function to check if contracts are properly configured
export function validateContracts() {
  const missing = []
  if (!CONTRACTS.RGC_TOKEN || CONTRACTS.RGC_TOKEN === "0x0000000000000000000000000000000000000000") {
    missing.push("RGC_TOKEN")
  }
  if (!CONTRACTS.AIRDROP || CONTRACTS.AIRDROP === "0x0000000000000000000000000000000000000000") {
    missing.push("AIRDROP")
  }
  if (!CONTRACTS.CRASH_GAME || CONTRACTS.CRASH_GAME === "0x0000000000000000000000000000000000000000") {
    missing.push("CRASH_GAME")
  }
  return missing
}

export const ADMIN_WALLET = "0x8DA112FcA23e31785e9c69cA92C8f00e999BebF2"

export const SUPPORTED_CHAINS = {
  POLYGON_MUMBAI: 80001,
  POLYGON_MAINNET: 137,
  LOCALHOST: 1337,
}

export const CHAIN_NAMES: Record<number, string> = {
  [SUPPORTED_CHAINS.POLYGON_MUMBAI]: "Polygon Mumbai",
  [SUPPORTED_CHAINS.POLYGON_MAINNET]: "Polygon",
  [SUPPORTED_CHAINS.LOCALHOST]: "Localhost",
}

export const CHAIN_CURRENCY: Record<number, string> = {
  [SUPPORTED_CHAINS.POLYGON_MUMBAI]: "MATIC",
  [SUPPORTED_CHAINS.POLYGON_MAINNET]: "POL",
  [SUPPORTED_CHAINS.LOCALHOST]: "ETH",
}

export const CHAIN_EXPLORER: Record<number, string> = {
  [SUPPORTED_CHAINS.POLYGON_MUMBAI]: "https://mumbai.polygonscan.com",
  [SUPPORTED_CHAINS.POLYGON_MAINNET]: "https://polygonscan.com",
  [SUPPORTED_CHAINS.LOCALHOST]: "http://localhost:8545",
}

export function getContract(address: string, abi: string[], signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, abi, signerOrProvider)
}
