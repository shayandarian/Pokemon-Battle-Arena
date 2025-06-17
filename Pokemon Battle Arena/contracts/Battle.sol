// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Pokemon.sol";

contract Battle is Ownable {
    Pokemon public pokemonContract;
    
    struct BattleRecord {
        address winner;
        address loser;
        uint256 winnerPokemonId;
        uint256 loserPokemonId;
        uint256 timestamp;
    }
    
    struct UserStats {
        uint256 wins;
        uint256 losses;
        uint256 totalBattles;
    }
    
    mapping(address => UserStats) public userStats;
    mapping(uint256 => bool) public pokemonInBattle;
    BattleRecord[] public battleHistory;
    
    uint256 public constant STAMINA_COST = 20;
    uint256 public constant REST_TIME = 1 hours;
    uint256 public constant EXPERIENCE_PER_WIN = 100;
    
    event BattleStarted(address indexed player1, address indexed player2, uint256 pokemon1Id, uint256 pokemon2Id);
    event BattleEnded(address indexed winner, address indexed loser, uint256 winnerPokemonId, uint256 loserPokemonId);
    
    constructor(address _pokemonContract) {
        pokemonContract = Pokemon(_pokemonContract);
    }
    
    function battle(uint256 pokemonId1, uint256 pokemonId2) public {
        require(pokemonId1 != pokemonId2, "Cannot battle the same Pokemon");
        
        // Get Pokemon data
        Pokemon.PokemonData memory pokemon1 = pokemonContract.getPokemon(pokemonId1);
        Pokemon.PokemonData memory pokemon2 = pokemonContract.getPokemon(pokemonId2);
        
        // Verify ownership
        require(pokemonContract.ownerOf(pokemonId1) == msg.sender || pokemonContract.ownerOf(pokemonId2) == msg.sender, 
            "Must own at least one Pokemon");
        
        // Verify Pokemon are not in battle
        require(!pokemonInBattle[pokemonId1], "Pokemon 1 is already in battle");
        require(!pokemonInBattle[pokemonId2], "Pokemon 2 is already in battle");
        
        // Verify Pokemon have stamina
        require(pokemon1.stamina > 0, "Pokemon 1 has no stamina");
        require(pokemon2.stamina > 0, "Pokemon 2 has no stamina");
        
        // Set Pokemon as in battle
        pokemonInBattle[pokemonId1] = true;
        pokemonInBattle[pokemonId2] = true;
        
        // Calculate power for each Pokemon
        uint256 power1 = calculatePower(pokemon1);
        uint256 power2 = calculatePower(pokemon2);
        
        // Determine winner and loser
        address winner;
        address loser;
        uint256 winnerPokemonId;
        uint256 loserPokemonId;
        
        if (power1 > power2) {
            winner = pokemonContract.ownerOf(pokemonId1);
            loser = pokemonContract.ownerOf(pokemonId2);
            winnerPokemonId = pokemonId1;
            loserPokemonId = pokemonId2;
        } else {
            winner = pokemonContract.ownerOf(pokemonId2);
            loser = pokemonContract.ownerOf(pokemonId1);
            winnerPokemonId = pokemonId2;
            loserPokemonId = pokemonId1;
        }
        
        // Update stats
        userStats[winner].wins++;
        userStats[loser].losses++;
        userStats[winner].totalBattles++;
        userStats[loser].totalBattles++;
        
        // Add experience to both Pokemon
        pokemonContract.addExperience(winnerPokemonId, EXPERIENCE_PER_WIN);
        pokemonContract.addExperience(loserPokemonId, EXPERIENCE_PER_WIN / 2);
        
        // Record battle
        battleHistory.push(BattleRecord({
            winner: winner,
            loser: loser,
            winnerPokemonId: winnerPokemonId,
            loserPokemonId: loserPokemonId,
            timestamp: block.timestamp
        }));
        
        // Reset battle status
        pokemonInBattle[pokemonId1] = false;
        pokemonInBattle[pokemonId2] = false;
        
        emit BattleEnded(winner, loser, winnerPokemonId, loserPokemonId);
    }
    
    function calculatePower(Pokemon.PokemonData memory pokemon) internal view returns (uint256) {
        // Simplified power calculation
        uint256 basePower = (pokemon.attack + pokemon.defense + pokemon.speed) * pokemon.level;
        uint256 staminaBonus = (basePower * pokemon.stamina) / 200;
        return basePower + staminaBonus;
    }
    
    function getBattleHistory() public view returns (BattleRecord[] memory) {
        return battleHistory;
    }
    
    function getUserStats(address user) public view returns (UserStats memory) {
        return userStats[user];
    }
    
    function getTopBattlers(uint256 limit) public view returns (address[] memory, uint256[] memory) {
        // Handle empty battle history
        if (battleHistory.length == 0) {
            return (new address[](0), new uint256[](0));
        }

        // First count how many unique battlers we have
        uint256 uniqueBattlers = 0;
        address[] memory seenAddresses = new address[](battleHistory.length);
        
        for (uint256 i = 0; i < battleHistory.length; i++) {
            address currentAddress = battleHistory[i].winner;
            bool alreadySeen = false;
            
            for (uint256 j = 0; j < uniqueBattlers; j++) {
                if (seenAddresses[j] == currentAddress) {
                    alreadySeen = true;
                    break;
                }
            }
            
            if (!alreadySeen) {
                seenAddresses[uniqueBattlers] = currentAddress;
                uniqueBattlers++;
            }
        }
        
        // Use the actual number of unique battlers or the limit, whichever is smaller
        uint256 resultSize = uniqueBattlers < limit ? uniqueBattlers : limit;
        address[] memory topAddresses = new address[](resultSize);
        uint256[] memory topWins = new uint256[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            uint256 maxWins = 0;
            address maxAddress = address(0);
            
            for (uint256 j = 0; j < uniqueBattlers; j++) {
                address currentAddress = seenAddresses[j];
                if (userStats[currentAddress].wins > maxWins) {
                    bool alreadyIncluded = false;
                    for (uint256 k = 0; k < i; k++) {
                        if (topAddresses[k] == currentAddress) {
                            alreadyIncluded = true;
                            break;
                        }
                    }
                    if (!alreadyIncluded) {
                        maxWins = userStats[currentAddress].wins;
                        maxAddress = currentAddress;
                    }
                }
            }
            
            topAddresses[i] = maxAddress;
            topWins[i] = maxWins;
        }
        
        return (topAddresses, topWins);
    }
} 