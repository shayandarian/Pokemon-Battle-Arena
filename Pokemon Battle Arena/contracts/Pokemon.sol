// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Pokemon is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct PokemonData {
        uint256 pokemonId;      // ID from 1-150 representing the Pokemon species
        uint256 level;          // Current level of the Pokemon
        uint256 experience;     // Current experience points
        uint256 hp;             // Current HP
        uint256 maxHp;          // Maximum HP
        uint256 attack;         // Attack stat
        uint256 defense;        // Defense stat
        uint256 speed;          // Speed stat
        uint256 stamina;        // Current stamina
        bool isResting;         // Whether the Pokemon is resting
        uint256 lastTrainingTime;
    }

    // Evolution data for each Pokemon
    struct EvolutionData {
        uint256 nextEvolutionId;  // ID of the next evolution
        uint256 evolutionLevel;   // Level required for evolution
    }

    mapping(uint256 => PokemonData) public pokemonData;
    mapping(address => uint256[]) public userPokemon;
    mapping(uint256 => address) public pokemonToOwner;
    mapping(uint256 => EvolutionData) public evolutionData;
    mapping(address => bool) public authorizedContracts;

    // Evolution mappings
    mapping(uint256 => uint256) public evolutionLevels; // pokemonId => required level
    mapping(uint256 => uint256) public evolutionTargets; // pokemonId => evolved pokemonId

    // Experience required for each level
    uint256 public constant BASE_EXP_REQUIRED = 100;
    uint256 public constant EXP_MULTIPLIER = 2;

    // Training stamina cost
    uint256 public constant TRAINING_STAMINA_COST = 10;

    // Training experience gain
    uint256 public constant TRAINING_EXP_GAIN = 50;

    // Stats increase per level
    uint256 public constant STATS_INCREASE = 5;

    event PokemonMinted(address indexed owner, uint256 tokenId, uint256 pokemonId);
    event PokemonLeveledUp(uint256 indexed tokenId, uint256 level);
    event PokemonEvolved(uint256 indexed tokenId, uint256 newPokemonId);
    event PokemonRemoved(address indexed owner, uint256 tokenId);
    event PokemonTrained(uint256 indexed tokenId, uint256 experience, uint256 level);

    constructor() ERC721("Pokemon", "PKMN") {
        // Initialize evolution data for some Pokemon
        // Example: Bulbasaur -> Ivysaur -> Venusaur
        evolutionData[1] = EvolutionData(2, 10);  // Bulbasaur evolves to Ivysaur at level 10
        evolutionData[2] = EvolutionData(3, 20);  // Ivysaur evolves to Venusaur at level 20
        evolutionData[4] = EvolutionData(5, 10);  // Charmander evolves to Charmeleon at level 10
        evolutionData[5] = EvolutionData(6, 20);  // Charmeleon evolves to Charizard at level 20
        evolutionData[7] = EvolutionData(8, 10);  // Squirtle evolves to Wartortle at level 10
        evolutionData[8] = EvolutionData(9, 20);  // Wartortle evolves to Blastoise at level 20

        // Set up evolution requirements
        evolutionLevels[1] = 16; // Bulbasaur -> Ivysaur
        evolutionTargets[1] = 2;
        evolutionLevels[2] = 32; // Ivysaur -> Venusaur
        evolutionTargets[2] = 3;
        evolutionLevels[4] = 16; // Charmander -> Charmeleon
        evolutionTargets[4] = 5;
        evolutionLevels[5] = 36; // Charmeleon -> Charizard
        evolutionTargets[5] = 6;
        evolutionLevels[7] = 16; // Squirtle -> Wartortle
        evolutionTargets[7] = 8;
        evolutionLevels[8] = 36; // Wartortle -> Blastoise
        evolutionTargets[8] = 9;
        evolutionLevels[25] = 36; // Pikachu -> Raichu
        evolutionTargets[25] = 26;
        evolutionLevels[133] = 25; // Eevee -> Vaporeon/Jolteon/Flareon
        evolutionTargets[133] = 134; // Default to Vaporeon
    }

    function getUserPokemon(address user) public view returns (uint256[] memory) {
        return userPokemon[user];
    }

    function mintStarterPokemon(uint256 pokemonId) public returns (uint256) {
        require(pokemonId == 1 || pokemonId == 4 || pokemonId == 7 || pokemonId == 25, "Invalid starter Pokemon");
        require(balanceOf(msg.sender) == 0, "Already has a starter Pokemon");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        // Initialize Pokemon stats
        pokemonData[newTokenId] = PokemonData({
            pokemonId: pokemonId,
            level: 1,
            experience: 0,
            hp: 100,
            maxHp: 100,
            attack: 10,
            defense: 10,
            speed: 10,
            stamina: 100,
            lastTrainingTime: 0,
            isResting: false
        });

        _mint(msg.sender, newTokenId);
        userPokemon[msg.sender].push(newTokenId);
        pokemonToOwner[newTokenId] = msg.sender;

        emit PokemonMinted(msg.sender, newTokenId, pokemonId);
        return newTokenId;
    }

    function mintPokemon(address to, uint256 pokemonId) public onlyOwner returns (uint256) {
        require(pokemonId > 0 && pokemonId <= 150, "Invalid Pokemon ID");
        require(userPokemon[to].length < 3, "Maximum 3 Pokemon per user");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        // Initialize Pokemon stats
        pokemonData[newTokenId] = PokemonData({
            pokemonId: pokemonId,
            level: 1,
            experience: 0,
            hp: 100,
            maxHp: 100,
            attack: 10,
            defense: 10,
            speed: 10,
            stamina: 100,
            lastTrainingTime: 0,
            isResting: false
        });

        _mint(to, newTokenId);
        userPokemon[to].push(newTokenId);
        pokemonToOwner[newTokenId] = to;

        emit PokemonMinted(to, newTokenId, pokemonId);
        return newTokenId;
    }

    function addAuthorizedContract(address contractAddress) public onlyOwner {
        authorizedContracts[contractAddress] = true;
    }

    function removeAuthorizedContract(address contractAddress) public onlyOwner {
        authorizedContracts[contractAddress] = false;
    }

    function addExperience(uint256 tokenId, uint256 experience) public {
        require(_exists(tokenId), "Pokemon does not exist");
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized to add experience");
        PokemonData storage pokemon = pokemonData[tokenId];
        
        pokemon.experience += experience;
        
        // Level up if enough experience
        uint256 level = pokemon.level;
        uint256 experienceNeeded = level * 100; // Simple experience formula
        
        while (pokemon.experience >= experienceNeeded) {
            pokemon.experience -= experienceNeeded;
            level++;
            experienceNeeded = level * 100;
            
            // Increase stats
            pokemon.maxHp += 10;
            pokemon.hp = pokemon.maxHp;
            pokemon.attack += 2;
            pokemon.defense += 2;
            pokemon.speed += 2;
            
            emit PokemonLeveledUp(tokenId, level);
            
            // Check for evolution
            EvolutionData memory evolution = evolutionData[pokemon.pokemonId];
            if (evolution.nextEvolutionId != 0 && level >= evolution.evolutionLevel) {
                pokemon.pokemonId = evolution.nextEvolutionId;
                emit PokemonEvolved(tokenId, evolution.nextEvolutionId);
            }
        }
        
        pokemon.level = level;
    }

    function restPokemon(uint256 tokenId) public {
        require(_exists(tokenId), "Pokemon does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this Pokemon");
        
        PokemonData storage pokemon = pokemonData[tokenId];
        require(!pokemon.isResting, "Pokemon is already resting");
        
        pokemon.isResting = true;
        pokemon.stamina = 100;
        pokemon.lastTrainingTime = block.timestamp;
    }

    function wakeUpPokemon(uint256 tokenId) public {
        require(_exists(tokenId), "Pokemon does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this Pokemon");
        
        PokemonData storage pokemon = pokemonData[tokenId];
        require(pokemon.isResting, "Pokemon is not resting");
        
        pokemon.isResting = false;
    }

    function getPokemon(uint256 tokenId) public view returns (PokemonData memory) {
        require(_exists(tokenId), "Pokemon does not exist");
        return pokemonData[tokenId];
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        // Update ownership tracking
        if (from != address(0)) {
            // Remove from sender's list
            uint256[] storage senderPokemon = userPokemon[from];
            uint256 length = senderPokemon.length;
            for (uint256 i = 0; i < length; i++) {
                if (senderPokemon[i] == tokenId) {
                    // If it's not the last element, swap with the last element
                    if (i < length - 1) {
                        senderPokemon[i] = senderPokemon[length - 1];
                    }
                    // Remove the last element
                    senderPokemon.pop();
                    break;
                }
            }
            // Update the pokemonToOwner mapping
            delete pokemonToOwner[tokenId];
        }
        if (to != address(0)) {
            // Add to receiver's list
            userPokemon[to].push(tokenId);
            pokemonToOwner[tokenId] = to;
        }
    }

    function removePokemon(uint256 tokenId) public {
        require(_exists(tokenId), "Pokemon does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this Pokemon");
        
        // Remove from user's Pokemon list
        uint256[] storage userPokemons = userPokemon[msg.sender];
        for (uint256 i = 0; i < userPokemons.length; i++) {
            if (userPokemons[i] == tokenId) {
                userPokemons[i] = userPokemons[userPokemons.length - 1];
                userPokemons.pop();
                break;
            }
        }
        
        // Transfer to zero address (effectively burning)
        _transfer(msg.sender, address(0), tokenId);
        
        emit PokemonRemoved(msg.sender, tokenId);
    }

    function train(uint256 tokenId) public {
        // Training function to increase Pokemon's experience
        require(ownerOf(tokenId) == msg.sender, "You don't own this Pokemon");
        PokemonData storage pokemon = pokemonData[tokenId];
        
        require(!pokemon.isResting, "Pokemon is resting");
        require(pokemon.stamina >= TRAINING_STAMINA_COST, "Not enough stamina");
        
        // Update stamina
        pokemon.stamina -= TRAINING_STAMINA_COST;
        
        // Add experience
        pokemon.experience += TRAINING_EXP_GAIN;
        
        // Check for level up
        uint256 expRequired = BASE_EXP_REQUIRED * (EXP_MULTIPLIER ** (pokemon.level - 1));
        if (pokemon.experience >= expRequired) {
            levelUp(tokenId);
        }
        
        emit PokemonTrained(tokenId, pokemon.experience, pokemon.level);
    }

    function levelUp(uint256 tokenId) internal {
        PokemonData storage pokemon = pokemonData[tokenId];
        
        // Increase level
        pokemon.level++;
        
        // Increase stats
        pokemon.maxHp += STATS_INCREASE;
        pokemon.hp = pokemon.maxHp; // Heal to full HP
        pokemon.attack += STATS_INCREASE;
        pokemon.defense += STATS_INCREASE;
        pokemon.speed += STATS_INCREASE;
        pokemon.stamina = 100; // Restore full stamina
        
        // Check for evolution
        if (evolutionLevels[pokemon.pokemonId] > 0 && pokemon.level >= evolutionLevels[pokemon.pokemonId]) {
            evolve(tokenId);
        }
        
        emit PokemonLeveledUp(tokenId, pokemon.level);
    }

    function evolve(uint256 tokenId) internal {
        PokemonData storage pokemon = pokemonData[tokenId];
        uint256 newPokemonId = evolutionTargets[pokemon.pokemonId];
        
        if (newPokemonId > 0) {
            pokemon.pokemonId = newPokemonId;
            emit PokemonEvolved(tokenId, newPokemonId);
        }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        
        PokemonData memory pokemon = pokemonData[tokenId];
        string memory baseURI = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
        
        // Convert pokemonId to string and construct the full URL
        string memory imageURI = string(abi.encodePacked(
            baseURI,
            Strings.toString(pokemon.pokemonId),
            ".png"
        ));

        // Create a JSON metadata string
        string memory json = string(abi.encodePacked(
            '{"name": "Pokemon #', Strings.toString(tokenId), '",',
            '"description": "A unique Pokemon NFT",',
            '"image": "', imageURI, '",',
            '"attributes": [',
            '{"trait_type": "Pokemon ID", "value": ', Strings.toString(pokemon.pokemonId), '},',
            '{"trait_type": "Level", "value": ', Strings.toString(pokemon.level), '},',
            '{"trait_type": "HP", "value": ', Strings.toString(pokemon.hp), '},',
            '{"trait_type": "Attack", "value": ', Strings.toString(pokemon.attack), '},',
            '{"trait_type": "Defense", "value": ', Strings.toString(pokemon.defense), '},',
            '{"trait_type": "Speed", "value": ', Strings.toString(pokemon.speed), '}',
            ']}'
        ));

        // Convert the JSON string to base64
        string memory base64Json = Base64.encode(bytes(json));
        
        // Return the data URI
        return string(abi.encodePacked(
            "data:application/json;base64,",
            base64Json
        ));
    }
}

/// @title Base64
/// @author Brecht Devos - <brecht@loopring.org>
/// @notice Provides a function for encoding some bytes in base64
library Base64 {
    string internal constant TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return '';
        
        // load the table into memory
        string memory table = TABLE;

        // multiply by 4/3 rounded up
        uint256 encodedLen = 4 * ((data.length + 2) / 3);

        // add some extra buffer at the end required for the writing
        string memory result = new string(encodedLen + 32);

        assembly {
            // set the actual output length
            mstore(result, encodedLen)
            
            // prepare the lookup table
            let tablePtr := add(table, 1)
            
            // input ptr
            let dataPtr := data
            let endPtr := add(dataPtr, mload(data))
            
            // result ptr, jump over length
            let resultPtr := add(result, 32)
            
            // run over the input, 3 bytes at a time
            for {} lt(dataPtr, endPtr) {}
            {
                dataPtr := add(dataPtr, 3)
                
                // read 3 bytes
                let input := mload(dataPtr)
                
                // write 4 characters
                mstore(resultPtr, shl(248, mload(add(tablePtr, and(shr(18, input), 0x3F)))))
                resultPtr := add(resultPtr, 1)
                mstore(resultPtr, shl(248, mload(add(tablePtr, and(shr(12, input), 0x3F)))))
                resultPtr := add(resultPtr, 1)
                mstore(resultPtr, shl(248, mload(add(tablePtr, and(shr( 6, input), 0x3F)))))
                resultPtr := add(resultPtr, 1)
                mstore(resultPtr, shl(248, mload(add(tablePtr, and(        input,  0x3F)))))
                resultPtr := add(resultPtr, 1)
            }
            
            // padding with '='
            switch mod(mload(data), 3)
            case 1 { mstore(sub(resultPtr, 2), shl(240, 0x3d3d)) }
            case 2 { mstore(sub(resultPtr, 1), shl(248, 0x3d)) }
        }
        
        return result;
    }
} 