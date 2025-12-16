// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DecentralizedLottery {
    address public manager;
    address[] public players;
    
    // New: Track who is currently in the lottery
    mapping(address => bool) public s_entries;

    // New: Store the address of the last winner
    address public s_lastWinner;
    
    // New: Track the total ETH won by an address over time
    mapping(address => uint256) public s_history;

    // --- Events added for modern UI state management ---
    event LotteryEntered(address indexed player, uint256 amount);
    event WinnerPicked(address winner, uint256 prizeAmount);
    // ----------------------------------------------------

    constructor() {
        manager = msg.sender;
    }

    function enterLottery() public payable {
        // 1. Enforce correct fee
        require(msg.value == 0.01 ether, "Must send exactly 0.01 ETH");
        
        // 2. New: Enforce single entry
        require(!s_entries[msg.sender], "Player already entered this round.");
        s_entries[msg.sender] = true;
        
        players.push(msg.sender);
        
        emit LotteryEntered(msg.sender, msg.value); 
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }

    // New View Function: Check if the current wallet is entered
    function isEntered(address _player) public view returns (bool) {
        return s_entries[_player];
    }
    
    function pickWinner() public {
        require(msg.sender == manager, "Only manager can call this");
        require(players.length > 0, "No players in the lottery");

        // Simple Randomness (Vulnerable, as noted before)
        uint256 randomIndex = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, players.length))
        ) % players.length;
        
        address winner = players[randomIndex];
        uint256 prizeAmount = address(this).balance; 
        
        // Update History
        s_history[winner] += prizeAmount;
        s_lastWinner = winner;

        payable(winner).transfer(prizeAmount);

        // Reset state for the new round
        for (uint256 i = 0; i < players.length; i++) {
            delete s_entries[players[i]]; // Reset entry status for all players
        }
        delete players; // reset players array
        
        emit WinnerPicked(winner, prizeAmount);
    }
}
Add Lottery smart contract

