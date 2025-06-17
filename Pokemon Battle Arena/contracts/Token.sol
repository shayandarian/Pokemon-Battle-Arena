// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Battle.sol";

contract Token is ERC20, Ownable {
    Battle public battleContract;
    uint256 public constant BATTLE_REWARD = 10;
    uint256 public constant POKEMON_COST = 100;
    
    mapping(address => bool) public authorizedMinters;
    
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    constructor() ERC20("Pokemon Battle Token", "PBT") {
        _mint(msg.sender, 1000000 * 10 ** decimals()); // Initial supply of 1 million tokens
    }
    
    function setBattleContract(address _battleContract) public onlyOwner {
        battleContract = Battle(_battleContract);
    }
    
    function addAuthorizedMinter(address minter) public onlyOwner {
        authorizedMinters[minter] = true;
    }
    
    function removeAuthorizedMinter(address minter) public onlyOwner {
        authorizedMinters[minter] = false;
    }
    
    function mint(address to, uint256 amount) public {
        require(authorizedMinters[msg.sender], "Not authorized to mint");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    function burn(address from, uint256 amount) public {
        require(authorizedMinters[msg.sender], "Not authorized to burn");
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
    
    function rewardBattleWinner(address winner) public {
        require(msg.sender == address(battleContract), "Only battle contract can reward winners");
        _mint(winner, BATTLE_REWARD * 10 ** decimals());
    }
    
    function purchasePokemon() public {
        require(balanceOf(msg.sender) >= POKEMON_COST * 10 ** decimals(), "Insufficient token balance");
        _burn(msg.sender, POKEMON_COST * 10 ** decimals());
    }
} 