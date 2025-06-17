// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./Pokemon.sol";
import "./Token.sol";

contract Marketplace is Ownable, IERC721Receiver {
    Pokemon public pokemonContract;
    Token public tokenContract;
    
    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price;
        bool isActive;
    }
    
    mapping(uint256 => Listing) public listings;
    uint256 public listingCount;
    
    event PokemonListed(uint256 indexed listingId, address indexed seller, uint256 tokenId, uint256 price);
    event PokemonUnlisted(uint256 indexed listingId);
    event PokemonPurchased(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 tokenId, uint256 price);
    
    constructor(address _pokemonContract, address _tokenContract) {
        pokemonContract = Pokemon(_pokemonContract);
        tokenContract = Token(_tokenContract);
    }
    
    function listPokemon(uint256 tokenId, uint256 price) public {
        require(pokemonContract.ownerOf(tokenId) == msg.sender, "Not the owner of this Pokemon");
        require(price > 0, "Price must be greater than 0");
        // Allow multiple listings per user (per tokenId)
        listingCount++;
        listings[listingCount] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            isActive: true
        });
        emit PokemonListed(listingCount, msg.sender, tokenId, price);
    }
    
    function unlistPokemon(uint256 listingId) public {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing is not active");
        require(listing.seller == msg.sender, "Not the seller");
        
        // Transfer Pokemon back to seller
        pokemonContract.transferFrom(address(this), msg.sender, listing.tokenId);
        
        listing.isActive = false;
        emit PokemonUnlisted(listingId);
    }
    
    function purchasePokemon(uint256 listingId) public {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing is not active");
        require(msg.sender != listing.seller, "Cannot purchase your own Pokemon");
        require(tokenContract.balanceOf(msg.sender) >= listing.price, "Insufficient token balance");
        // New check: seller must still own the Pokemon
        if (pokemonContract.ownerOf(listing.tokenId) != listing.seller) {
            listing.isActive = false;
            revert("Seller no longer owns this Pokemon");
        }
        tokenContract.transferFrom(msg.sender, listing.seller, listing.price);
        pokemonContract.transferFrom(listing.seller, msg.sender, listing.tokenId);
        listing.isActive = false;
        emit PokemonPurchased(listingId, msg.sender, listing.seller, listing.tokenId, listing.price);
    }
    
    function getActiveListings() public view returns (Listing[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].isActive) {
                activeCount++;
            }
        }
        
        Listing[] memory activeListings = new Listing[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].isActive) {
                activeListings[index] = listings[i];
                index++;
            }
        }
        
        return activeListings;
    }

    function getActiveListingsWithIds() public view returns (uint256[] memory, Listing[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].isActive) {
                activeCount++;
            }
        }

        uint256[] memory ids = new uint256[](activeCount);
        Listing[] memory activeListings = new Listing[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].isActive) {
                ids[index] = i;
                activeListings[index] = listings[i];
                index++;
            }
        }
        return (ids, activeListings);
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
} 