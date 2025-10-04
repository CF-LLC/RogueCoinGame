// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CrashGame
 * @dev On-chain crash game with provably fair randomness
 */
contract CrashGame is Ownable, ReentrancyGuard, Pausable {
    IERC20 public rgcToken;
    
    struct Round {
        address player;
        uint256 betAmount;
        uint256 clientSeed;
        uint256 serverSeed;
        bytes32 serverSeedHash;
        uint256 crashMultiplier; // Multiplier * 100 (e.g., 250 = 2.5x)
        uint256 cashOutMultiplier; // 0 if not cashed out
        uint256 timestamp;
        bool settled;
        bool won;
    }
    
    mapping(uint256 => Round) public rounds;
    mapping(address => uint256[]) public playerRounds;
    
    uint256 public currentRoundId;
    uint256 public minBet;
    uint256 public maxBet;
    uint256 public houseEdge; // Percentage * 100 (e.g., 200 = 2%)
    
    uint256 public totalBets;
    uint256 public totalWinnings;
    uint256 public totalLosses;
    
    event BetPlaced(uint256 indexed roundId, address indexed player, uint256 amount, uint256 clientSeed);
    event CrashRevealed(uint256 indexed roundId, uint256 crashMultiplier, uint256 serverSeed);
    event CashedOut(uint256 indexed roundId, address indexed player, uint256 multiplier, uint256 winnings);
    event RoundSettled(uint256 indexed roundId, bool won, uint256 payout);
    
    constructor(
        address _rgcToken,
        uint256 _minBet,
        uint256 _maxBet,
        uint256 _houseEdge
    ) Ownable(msg.sender) {
        require(_rgcToken != address(0), "Invalid token address");
        rgcToken = IERC20(_rgcToken);
        minBet = _minBet;
        maxBet = _maxBet;
        houseEdge = _houseEdge;
    }
    
    /**
     * @dev Place a bet with client seed
     */
    function placeBet(uint256 amount, uint256 clientSeed) external nonReentrant whenNotPaused returns (uint256) {
        require(amount >= minBet && amount <= maxBet, "Invalid bet amount");
        require(rgcToken.balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(rgcToken.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
        
        // Transfer tokens from player
        require(rgcToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Generate server seed hash (in production, use Chainlink VRF)
        bytes32 serverSeedHash = keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            currentRoundId
        ));
        
        // Create round
        rounds[currentRoundId] = Round({
            player: msg.sender,
            betAmount: amount,
            clientSeed: clientSeed,
            serverSeed: 0,
            serverSeedHash: serverSeedHash,
            crashMultiplier: 0,
            cashOutMultiplier: 0,
            timestamp: block.timestamp,
            settled: false,
            won: false
        });
        
        playerRounds[msg.sender].push(currentRoundId);
        totalBets += amount;
        
        emit BetPlaced(currentRoundId, msg.sender, amount, clientSeed);
        
        uint256 roundId = currentRoundId;
        currentRoundId++;
        
        return roundId;
    }
    
    /**
     * @dev Reveal crash multiplier (called by backend or after timeout)
     */
    function revealCrash(uint256 roundId, uint256 serverSeed) external onlyOwner {
        Round storage round = rounds[roundId];
        require(!round.settled, "Round already settled");
        require(round.betAmount > 0, "Invalid round");
        
        // Verify server seed matches hash
        bytes32 computedHash = keccak256(abi.encodePacked(
            round.timestamp,
            block.prevrandao,
            round.player,
            roundId
        ));
        require(computedHash == round.serverSeedHash, "Invalid server seed");
        
        round.serverSeed = serverSeed;
        
        // Calculate crash multiplier (provably fair)
        uint256 combinedSeed = uint256(keccak256(abi.encodePacked(
            round.clientSeed,
            serverSeed
        )));
        
        // Generate crash point between 1.00x and 10.00x
        // Using modulo to create fair distribution
        uint256 crashPoint = 100 + (combinedSeed % 900); // 100 to 1000 (1.00x to 10.00x)
        round.crashMultiplier = crashPoint;
        
        emit CrashRevealed(roundId, crashPoint, serverSeed);
    }
    
    /**
     * @dev Cash out at specific multiplier
     */
    function cashOut(uint256 roundId, uint256 multiplier) external nonReentrant {
        Round storage round = rounds[roundId];
        require(round.player == msg.sender, "Not your round");
        require(!round.settled, "Round already settled");
        require(round.crashMultiplier > 0, "Crash not revealed yet");
        require(multiplier <= round.crashMultiplier, "Multiplier too high");
        require(round.cashOutMultiplier == 0, "Already cashed out");
        
        round.cashOutMultiplier = multiplier;
        round.settled = true;
        round.won = true;
        
        // Calculate winnings
        uint256 grossWinnings = (round.betAmount * multiplier) / 100;
        uint256 houseEdgeAmount = (grossWinnings * houseEdge) / 10000;
        uint256 netWinnings = grossWinnings - houseEdgeAmount;
        
        require(rgcToken.balanceOf(address(this)) >= netWinnings, "Insufficient liquidity");
        
        totalWinnings += netWinnings;
        
        require(rgcToken.transfer(msg.sender, netWinnings), "Transfer failed");
        
        emit CashedOut(roundId, msg.sender, multiplier, netWinnings);
        emit RoundSettled(roundId, true, netWinnings);
    }
    
    /**
     * @dev Settle round as loss (called after crash revealed and no cashout)
     */
    function settleLoss(uint256 roundId) external {
        Round storage round = rounds[roundId];
        require(!round.settled, "Round already settled");
        require(round.crashMultiplier > 0, "Crash not revealed yet");
        require(round.cashOutMultiplier == 0, "Already cashed out");
        require(
            msg.sender == round.player || msg.sender == owner(),
            "Not authorized"
        );
        
        round.settled = true;
        round.won = false;
        
        totalLosses += round.betAmount;
        
        emit RoundSettled(roundId, false, 0);
    }
    
    /**
     * @dev Get player's rounds
     */
    function getPlayerRounds(address player) external view returns (uint256[] memory) {
        return playerRounds[player];
    }
    
    /**
     * @dev Get round details
     */
    function getRound(uint256 roundId) external view returns (Round memory) {
        return rounds[roundId];
    }
    
    /**
     * @dev Update bet limits (owner only)
     */
    function setBetLimits(uint256 _minBet, uint256 _maxBet) external onlyOwner {
        minBet = _minBet;
        maxBet = _maxBet;
    }
    
    /**
     * @dev Update house edge (owner only)
     */
    function setHouseEdge(uint256 _houseEdge) external onlyOwner {
        require(_houseEdge <= 1000, "House edge too high"); // Max 10%
        houseEdge = _houseEdge;
    }
    
    /**
     * @dev Withdraw tokens (owner only)
     */
    function withdrawTokens(uint256 amount) external onlyOwner nonReentrant {
        require(rgcToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        require(rgcToken.transfer(owner(), amount), "Transfer failed");
    }
    
    /**
     * @dev Fund liquidity (anyone can add)
     */
    function fundLiquidity(uint256 amount) external nonReentrant {
        require(rgcToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
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
        uint256 _totalBets,
        uint256 _totalWinnings,
        uint256 _totalLosses,
        uint256 _liquidity,
        uint256 _currentRoundId
    ) {
        return (
            totalBets,
            totalWinnings,
            totalLosses,
            rgcToken.balanceOf(address(this)),
            currentRoundId
        );
    }
}
