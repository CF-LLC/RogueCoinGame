// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title RogueCoinAirdrop
 * @dev Manages RGC token airdrops with POL fee requirement (Polygon native token)
 */
contract RogueCoinAirdrop is Ownable, ReentrancyGuard, Pausable {
    IERC20 public rgcToken;
    
    uint256 public airdropAmount;
    uint256 public claimFee;
    
    mapping(address => bool) public hasClaimed;
    
    uint256 public totalClaimed;
    uint256 public totalFeeCollected;
    
    event AirdropClaimed(address indexed user, uint256 amount, uint256 fee);
    event AirdropAmountUpdated(uint256 newAmount);
    event ClaimFeeUpdated(uint256 newFee);
    event ETHWithdrawn(address indexed owner, uint256 amount);
    event TokensWithdrawn(address indexed owner, uint256 amount);
    
    constructor(
        address _rgcToken,
        uint256 _airdropAmount,
        uint256 _claimFee
    ) Ownable(msg.sender) {
        require(_rgcToken != address(0), "Invalid token address");
        rgcToken = IERC20(_rgcToken);
        airdropAmount = _airdropAmount;
        claimFee = _claimFee;
    }
    
    /**
     * @dev Allows users to claim airdrop by paying POL fee
     */
    function claimAirdrop() external payable nonReentrant whenNotPaused {
        require(!hasClaimed[msg.sender], "Already claimed");
        require(msg.value >= claimFee, "Insufficient fee");
        require(rgcToken.balanceOf(address(this)) >= airdropAmount, "Insufficient airdrop balance");
        
        hasClaimed[msg.sender] = true;
        totalClaimed += airdropAmount;
        totalFeeCollected += msg.value;
        
        require(rgcToken.transfer(msg.sender, airdropAmount), "Transfer failed");
        
        emit AirdropClaimed(msg.sender, airdropAmount, msg.value);
    }
    
    /**
     * @dev Check if address has claimed
     */
    function hasClaimedAirdrop(address user) external view returns (bool) {
        return hasClaimed[user];
    }
    
    /**
     * @dev Update airdrop amount (owner only)
     */
    function setAirdropAmount(uint256 _newAmount) external onlyOwner {
        airdropAmount = _newAmount;
        emit AirdropAmountUpdated(_newAmount);
    }
    
    /**
     * @dev Update claim fee (owner only)
     */
    function setClaimFee(uint256 _newFee) external onlyOwner {
        claimFee = _newFee;
        emit ClaimFeeUpdated(_newFee);
    }
    
    /**
     * @dev Withdraw collected POL fees (owner only)
     */
    function withdrawETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No POL to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "POL transfer failed");
        
        emit ETHWithdrawn(owner(), balance);
    }
    
    /**
     * @dev Withdraw remaining RGC tokens (owner only)
     */
    function withdrawTokens(uint256 amount) external onlyOwner nonReentrant {
        require(rgcToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        require(rgcToken.transfer(owner(), amount), "Transfer failed");
        
        emit TokensWithdrawn(owner(), amount);
    }
    
    /**
     * @dev Pause contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get contract stats
     */
    function getStats() external view returns (
        uint256 _airdropAmount,
        uint256 _claimFee,
        uint256 _totalClaimed,
        uint256 _totalFeeCollected,
        uint256 _remainingBalance
    ) {
        return (
            airdropAmount,
            claimFee,
            totalClaimed,
            totalFeeCollected,
            rgcToken.balanceOf(address(this))
        );
    }
}
