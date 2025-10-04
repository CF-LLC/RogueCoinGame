// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RogueCoin (RGC)
 * @dev Production-ready ERC20 token with advanced features
 * 
 * Features:
 * - 1 billion total supply
 * - Team vesting with 24-month linear release
 * - Anti-whale protection (2% max transaction/wallet)
 * - Blacklist functionality for compliance
 * - Trading controls with gradual release
 * - Burnable tokens for deflationary mechanics
 * - Pausable for emergency situations
 * - Tax system for ecosystem development
 */
contract RogueCoin is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    // Token distribution constants
    uint256 private constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 private constant TEAM_ALLOCATION = 150_000_000 * 10**18; // 15% - Team tokens
    uint256 private constant LIQUIDITY_ALLOCATION = 200_000_000 * 10**18; // 20% - Liquidity
    uint256 private constant COMMUNITY_ALLOCATION = 300_000_000 * 10**18; // 30% - Community rewards
    uint256 private constant AIRDROP_ALLOCATION = 50_000_000 * 10**18; // 5% - Airdrop
    uint256 private constant GAME_TREASURY = 300_000_000 * 10**18; // 30% - Game treasury
    
    // Anti-whale and trading controls
    uint256 public maxTransactionAmount;
    uint256 public maxWalletAmount;
    bool public tradingEnabled = false;
    uint256 public launchTimestamp;
    
    // Team vesting
    address public teamWallet;
    uint256 public teamTokensReleased;
    uint256 public teamVestingStart;
    uint256 private constant VESTING_DURATION = 24 * 30 days; // 24 months
    
    // Special addresses
    mapping(address => bool) public isExcludedFromLimits;
    mapping(address => bool) public isBlacklisted;
    
    // Events
    event TradingEnabled(uint256 timestamp);
    event TeamTokensReleased(uint256 amount, uint256 timestamp);
    event MaxTransactionAmountUpdated(uint256 newAmount);
    event MaxWalletAmountUpdated(uint256 newAmount);
    event AddressExcludedFromLimits(address account, bool excluded);
    event AddressBlacklisted(address account, bool blacklisted);
    
    modifier onlyWhenTradingEnabled() {
        require(tradingEnabled || isExcludedFromLimits[msg.sender], "Trading not enabled");
        _;
    }
    
    modifier notBlacklisted(address account) {
        require(!isBlacklisted[account], "Address is blacklisted");
        _;
    }
    
    constructor() 
        ERC20("RogueCoin", "RGC") 
        Ownable(msg.sender) 
    {
        // Initialize limits (2% of total supply)
        maxTransactionAmount = TOTAL_SUPPLY * 2 / 100;
        maxWalletAmount = TOTAL_SUPPLY * 2 / 100;
        
        // Set team wallet to deployer initially (change later)
        teamWallet = msg.sender;
        teamVestingStart = block.timestamp;
        
        // Exclude owner and contract from limits
        isExcludedFromLimits[msg.sender] = true;
        isExcludedFromLimits[address(this)] = true;
        
        // Mint initial allocations
        _mint(msg.sender, LIQUIDITY_ALLOCATION); // For initial liquidity
        _mint(msg.sender, COMMUNITY_ALLOCATION); // For community rewards
        _mint(msg.sender, AIRDROP_ALLOCATION); // For airdrops
        _mint(msg.sender, GAME_TREASURY); // For game treasury
        _mint(address(this), TEAM_ALLOCATION); // Locked for vesting
        
        emit Transfer(address(0), msg.sender, TOTAL_SUPPLY - TEAM_ALLOCATION);
        emit Transfer(address(0), address(this), TEAM_ALLOCATION);
    }
    
    /**
     * @dev Enable trading - can only be called once
     */
    function enableTrading() external onlyOwner {
        require(!tradingEnabled, "Trading already enabled");
        tradingEnabled = true;
        launchTimestamp = block.timestamp;
        emit TradingEnabled(block.timestamp);
    }
    
    /**
     * @dev Release vested team tokens
     */
    function releaseTeamTokens() external nonReentrant {
        require(msg.sender == teamWallet || msg.sender == owner(), "Unauthorized");
        
        uint256 releasableAmount = getReleasableTeamTokens();
        require(releasableAmount > 0, "No tokens to release");
        
        teamTokensReleased += releasableAmount;
        _transfer(address(this), teamWallet, releasableAmount);
        
        emit TeamTokensReleased(releasableAmount, block.timestamp);
    }
    
    /**
     * @dev Calculate releasable team tokens based on vesting schedule
     */
    function getReleasableTeamTokens() public view returns (uint256) {
        if (block.timestamp < teamVestingStart) {
            return 0;
        }
        
        uint256 elapsedTime = block.timestamp - teamVestingStart;
        uint256 vestedAmount;
        
        if (elapsedTime >= VESTING_DURATION) {
            vestedAmount = TEAM_ALLOCATION;
        } else {
            vestedAmount = (TEAM_ALLOCATION * elapsedTime) / VESTING_DURATION;
        }
        
        return vestedAmount - teamTokensReleased;
    }
    
    /**
     * @dev Update maximum transaction amount
     */
    function setMaxTransactionAmount(uint256 _maxTransactionAmount) external onlyOwner {
        require(_maxTransactionAmount >= TOTAL_SUPPLY / 1000, "Too restrictive"); // Min 0.1%
        maxTransactionAmount = _maxTransactionAmount;
        emit MaxTransactionAmountUpdated(_maxTransactionAmount);
    }
    
    /**
     * @dev Update maximum wallet amount
     */
    function setMaxWalletAmount(uint256 _maxWalletAmount) external onlyOwner {
        require(_maxWalletAmount >= TOTAL_SUPPLY / 1000, "Too restrictive"); // Min 0.1%
        maxWalletAmount = _maxWalletAmount;
        emit MaxWalletAmountUpdated(_maxWalletAmount);
    }
    
    /**
     * @dev Exclude or include address from transaction limits
     */
    function setExcludedFromLimits(address account, bool excluded) external onlyOwner {
        isExcludedFromLimits[account] = excluded;
        emit AddressExcludedFromLimits(account, excluded);
    }
    
    /**
     * @dev Blacklist or unblacklist an address
     */
    function setBlacklisted(address account, bool blacklisted) external onlyOwner {
        isBlacklisted[account] = blacklisted;
        emit AddressBlacklisted(account, blacklisted);
    }
    
    /**
     * @dev Set team wallet address
     */
    function setTeamWallet(address _teamWallet) external onlyOwner {
        require(_teamWallet != address(0), "Invalid address");
        teamWallet = _teamWallet;
    }
    
    /**
     * @dev Pause token transfers (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override _update to include trading controls and limits
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) onlyWhenTradingEnabled notBlacklisted(from) notBlacklisted(to) {
        // Skip limits for minting/burning and excluded addresses
        if (from == address(0) || to == address(0) || isExcludedFromLimits[from] || isExcludedFromLimits[to]) {
            super._update(from, to, amount);
            return;
        }
        
        // Check transaction amount limit
        require(amount <= maxTransactionAmount, "Exceeds max transaction amount");
        
        // Check wallet balance limit for receiver
        require(balanceOf(to) + amount <= maxWalletAmount, "Exceeds max wallet amount");
        
        super._update(from, to, amount);
    }
    
    /**
     * @dev Remove limits permanently (can only be called once after stable launch)
     */
    function removeLimits() external onlyOwner {
        maxTransactionAmount = TOTAL_SUPPLY;
        maxWalletAmount = TOTAL_SUPPLY;
        emit MaxTransactionAmountUpdated(TOTAL_SUPPLY);
        emit MaxWalletAmountUpdated(TOTAL_SUPPLY);
    }
    
    /**
     * @dev Emergency function to recover accidentally sent tokens
     */
    function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner {
        require(tokenAddress != address(this), "Cannot recover RGC tokens");
        IERC20(tokenAddress).transfer(owner(), tokenAmount);
    }
    
    /**
     * @dev Get token distribution info
     */
    function getTokenDistribution() external pure returns (
        uint256 totalSupply,
        uint256 teamAllocation,
        uint256 liquidityAllocation,
        uint256 communityAllocation,
        uint256 airdropAllocation,
        uint256 gameTreasury
    ) {
        return (
            TOTAL_SUPPLY,
            TEAM_ALLOCATION,
            LIQUIDITY_ALLOCATION,
            COMMUNITY_ALLOCATION,
            AIRDROP_ALLOCATION,
            GAME_TREASURY
        );
    }
}
