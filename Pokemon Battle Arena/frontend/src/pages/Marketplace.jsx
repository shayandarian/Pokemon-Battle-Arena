import { useState, useEffect } from 'react'
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid, 
  Button, 
  Image, 
  useToast, 
  VStack,
  Input,
  Spinner,
  Badge,
  Select,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react'
import { useWeb3 } from '../context/Web3Context'
import { ethers } from 'ethers'
import Pokemon from '../contracts/Pokemon.json'
import Token from '../contracts/Token.json'
import MarketplaceContract from '../contracts/Marketplace.json'
import contractAddresses from '../contracts/contract-addresses.json'
import { pokemonNames } from '../utils/pokemonNames'

// Pokemon type colors
const typeColors = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC'
}

// Pokemon type mapping
const pokemonTypes = {
  1: 'grass', // Bulbasaur
  4: 'fire',  // Charmander
  7: 'water', // Squirtle
  25: 'electric' // Pikachu
}

const Marketplace = () => {
  const { provider, address, isConnected, connectWallet } = useWeb3()
  const [listings, setListings] = useState([])
  const [myPokemon, setMyPokemon] = useState([])
  const [selectedPokemon, setSelectedPokemon] = useState(null)
  const [price, setPrice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const checkNetwork = async () => {
      if (provider) {
        try {
          const network = await provider.getNetwork()
          setIsCorrectNetwork(network.chainId === 31337)
        } catch (error) {
          console.error('Error checking network:', error)
          setIsCorrectNetwork(false)
        }
      }
    }
    checkNetwork()
  }, [provider])

  useEffect(() => {
    if (provider && address && isCorrectNetwork) {
      loadListings()
      loadMyPokemon()
    }
  }, [provider, address, isCorrectNetwork])

  const loadListings = async () => {
    if (!provider || !address) return;

    try {
      const marketplaceContract = new ethers.Contract(
        contractAddresses.marketplace,
        MarketplaceContract.abi,
        provider
      );

      const pokemonContract = new ethers.Contract(
        contractAddresses.pokemon,
        Pokemon.abi,
        provider
      );

      // Use getActiveListingsWithIds to get both IDs and listings
      const [ids, activeListings] = await marketplaceContract.getActiveListingsWithIds();
      console.log('Active listings from contract:', activeListings);

      const listingsWithDetails = await Promise.all(
        activeListings.map(async (listing, idx) => {
          try {
            if (!listing || !listing[1]) { // listing[1] is tokenId
              console.warn('Invalid listing data:', listing);
              return null;
            }

            const data = await pokemonContract.pokemonData(listing[1]);
            if (!data) {
              console.warn('No Pokemon data found for token:', listing[1]);
              return null;
            }

            const owner = await pokemonContract.ownerOf(listing[1]);
            if (owner.toLowerCase() !== (listing.seller?.toLowerCase() || listing[0]?.seller?.toLowerCase() || listing.seller?.toLowerCase())) {
              return null;
            }

            return {
              listingId: ids[idx].toString(), // Use the correct listing ID from contract
              seller: listing[0],
              tokenId: listing[1].toString(),
              price: listing[2].toString(),
              isActive: listing[3],
              name: pokemonNames[data.pokemonId],
              pokemonId: data.pokemonId.toString(),
              level: data.level.toString(),
              experience: data.experience.toString(),
              image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.pokemonId}.png`,
              type: pokemonTypes[data.pokemonId] || 'normal'
            };
          } catch (error) {
            console.error('Error processing listing:', error);
            return null;
          }
        })
      );

      // Filter out any null listings and set the state
      const validListings = listingsWithDetails.filter(listing => listing !== null);
      console.log('Valid listings:', validListings);
      setListings(validListings);
    } catch (error) {
      console.error('Error loading listings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load marketplace listings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const loadMyPokemon = async () => {
    if (!provider || !address) return;

    try {
      const pokemonContract = new ethers.Contract(
        contractAddresses.pokemon,
        Pokemon.abi,
        provider
      );

      // Get all tokens that were ever owned by this address
      const userPokemon = await pokemonContract.getUserPokemon(address);
      console.log('User Pokemon from getUserPokemon:', userPokemon);

      // First verify ownership of each token
      const ownedTokens = await Promise.all(
        userPokemon.map(async (tokenId) => {
          try {
            const owner = await pokemonContract.ownerOf(tokenId);
            console.log(`Token ${tokenId} owner:`, owner, 'Current address:', address);
            return owner.toLowerCase() === address.toLowerCase() ? tokenId : null;
          } catch (error) {
            console.error(`Error checking ownership of token ${tokenId}:`, error);
            return null;
          }
        })
      );

      // Filter out null values (tokens not owned by the user)
      const validTokenIds = ownedTokens.filter(tokenId => tokenId !== null);
      console.log('Valid token IDs:', validTokenIds);

      const pokemonDetails = await Promise.all(
        validTokenIds.map(async (tokenId) => {
          try {
            const data = await pokemonContract.pokemonData(tokenId);
            return {
              tokenId: tokenId.toString(),
              pokemonId: data.pokemonId.toString(),
              name: pokemonNames[data.pokemonId],
              level: data.level.toString(),
              experience: data.experience.toString(),
              image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.pokemonId}.png`,
              type: pokemonTypes[data.pokemonId] || 'normal'
            };
          } catch (error) {
            console.error(`Error processing token ${tokenId}:`, error);
            return null;
          }
        })
      );

      // Deduplicate by tokenId
      const seenTokenIds = new Set();
      const validPokemon = [];
      for (const p of pokemonDetails) {
        if (p && !seenTokenIds.has(p.tokenId)) {
          validPokemon.push(p);
          seenTokenIds.add(p.tokenId);
        }
      }
      setMyPokemon(validPokemon);
    } catch (error) {
      console.error('Error loading Pokemon:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Pokemon',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleListPokemon = async () => {
    if (!selectedPokemon || !price) {
      toast({
        title: 'Error',
        description: 'Please select a Pokemon and enter a price',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // First, approve the Marketplace contract to transfer the Pokemon
      const pokemonContract = new ethers.Contract(
        contractAddresses.pokemon,
        Pokemon.abi,
        provider.getSigner()
      );

      const marketplaceAddress = contractAddresses.marketplace;
      
      // Check if the marketplace is already approved
      const isApproved = await pokemonContract.getApproved(selectedPokemon);
      if (isApproved.toLowerCase() !== marketplaceAddress.toLowerCase()) {
        const approveTx = await pokemonContract.approve(marketplaceAddress, selectedPokemon);
        await approveTx.wait();
      }

      // Then list the Pokemon on the marketplace
      const marketplaceContract = new ethers.Contract(
        contractAddresses.marketplace,
        MarketplaceContract.abi,
        provider.getSigner()
      );

      const priceInWei = ethers.utils.parseEther(price);
      const listTx = await marketplaceContract.listPokemon(selectedPokemon, priceInWei);
      await listTx.wait();

      toast({
        title: 'Success',
        description: 'Pokemon listed for sale!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      await loadListings();
      await loadMyPokemon();
      setSelectedPokemon(null);
      setPrice('');
    } catch (error) {
      console.error('Error listing Pokemon:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (listingId) => {
    if (!listingId || listingId === '') {
      toast({
        title: 'Error',
        description: 'Invalid listing ID',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      const marketplaceContract = new ethers.Contract(
        contractAddresses.marketplace,
        MarketplaceContract.abi,
        provider.getSigner()
      );

      const tokenContract = new ethers.Contract(
        contractAddresses.token,
        Token.abi,
        provider.getSigner()
      );

      const pokemonContract = new ethers.Contract(
        contractAddresses.pokemon,
        Pokemon.abi,
        provider.getSigner()
      );

      // First check if the listing exists in our local state
      const listing = listings.find(l => l.listingId === listingId);
      if (!listing) {
        console.error('Listing not found in local state:', listingId);
        throw new Error('Listing not found in the marketplace');
      }

      // Get the listing details from the contract
      const listingDetails = await marketplaceContract.listings(listingId);
      console.log('Listing details from contract:', listingDetails);
      
      // Check if the listing exists and is active
      if (!listingDetails || !listingDetails.isActive) {
        throw new Error('This listing is not active');
      }

      // Check current owner of the Pokemon
      const currentOwner = await pokemonContract.ownerOf(listing.tokenId);
      console.log('Current Pokemon owner:', currentOwner);
      console.log('Marketplace address:', contractAddresses.marketplace);

      // Check buyer's token balance
      const buyerBalance = await tokenContract.balanceOf(address);
      console.log('Buyer token balance:', ethers.utils.formatEther(buyerBalance));
      console.log('Listing price:', ethers.utils.formatEther(listing.price));

      if (buyerBalance.lt(listing.price)) {
        throw new Error(`Insufficient token balance. You have ${ethers.utils.formatEther(buyerBalance)} tokens, but need ${ethers.utils.formatEther(listing.price)} tokens`);
      }

      // Approve the marketplace to spend tokens
      console.log('Approving token transfer...');
      const approveTx = await tokenContract.approve(
        contractAddresses.marketplace,
        listing.price
      );
      const approveReceipt = await approveTx.wait();
      console.log('Token approval confirmed:', approveReceipt.transactionHash);

      // Purchase the Pokemon
      console.log('Purchasing Pokemon...');
      const purchaseTx = await marketplaceContract.purchasePokemon(listingId);
      const purchaseReceipt = await purchaseTx.wait();
      console.log('Purchase confirmed:', purchaseReceipt.transactionHash);

      // Verify the new owner
      const newOwner = await pokemonContract.ownerOf(listing.tokenId);
      console.log('New Pokemon owner:', newOwner);

      // Check final token balances
      const finalBuyerBalance = await tokenContract.balanceOf(address);
      const finalSellerBalance = await tokenContract.balanceOf(listingDetails.seller);
      console.log('Final buyer token balance:', ethers.utils.formatEther(finalBuyerBalance));
      console.log('Final seller token balance:', ethers.utils.formatEther(finalSellerBalance));

      toast({
        title: 'Success',
        description: `Pokemon purchased successfully! Transaction: ${purchaseReceipt.transactionHash}`,
        status: 'success',
        duration: 10000,
        isClosable: true,
      });

      // Reload the listings and Pokemon
      await loadListings();
      await loadMyPokemon();
    } catch (error) {
      console.error('Error purchasing Pokemon:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetTestTokens = async () => {
    if (!provider || !address) return;
    try {
      setIsLoading(true);
      const tokenContract = new ethers.Contract(
        contractAddresses.token,
        Token.abi,
        provider.getSigner()
      );
      const tx = await tokenContract.mint(address, ethers.utils.parseEther('100'));
      await tx.wait();
      toast({
        title: 'Success',
        description: '100 test tokens minted to your account!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error minting test tokens:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to mint test tokens',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={10}>
          <Text fontSize="xl" mb={4}>
            Please connect your wallet to access the marketplace!
          </Text>
          <Button colorScheme="blue" onClick={connectWallet}>
            Connect Wallet
          </Button>
        </Box>
      </Container>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={10}>
          <Text fontSize="xl" color="red.500">
            Please connect to the local Hardhat network (chain ID: 31337)
          </Text>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      {/* Faucet Button for Test Tokens */}
      {isConnected && (
        <Box mb={4}>
          <Button colorScheme="teal" onClick={handleGetTestTokens} isLoading={isLoading}>
            Get Test Tokens
          </Button>
        </Box>
      )}

      {/* NFT Import Info Section - only show if user owns NFTs */}
      {myPokemon.length > 0 && (
        <Box mb={6} p={4} borderWidth={1} borderRadius="md" bg="gray.50">
          <Heading as="h3" size="md" mb={2}>Import Your Pokemon NFT to MetaMask</Heading>
          <Text><strong>Contract Address:</strong> {contractAddresses.pokemon} <Button size="xs" ml={2} onClick={() => navigator.clipboard.writeText(contractAddresses.pokemon)}>Copy</Button></Text>
          <Text mt={2}><strong>Your Token IDs:</strong> {[...new Set(myPokemon.map(p => p.tokenId))].join(', ')}</Text>
          <Text mt={2} fontSize="sm" color="gray.600">To import your NFT in MetaMask, use the contract address above and one of your token IDs.</Text>
        </Box>
      )}

      <Heading as="h1" size="xl" mb={8} textAlign="center">
        Pokemon Marketplace
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
        {/* List Pokemon Section */}
        <Box
          p={6}
          borderRadius="lg"
          boxShadow="lg"
          bg="white"
          _dark={{ bg: 'gray.700' }}
        >
          <Heading as="h2" size="md" mb={4}>
            List Your Pokemon
          </Heading>
          {myPokemon.length === 0 ? (
            <Text>You don't have any Pokemon to list.</Text>
          ) : (
            <VStack spacing={4}>
              <Select
                placeholder="Select Pokemon to list"
                value={selectedPokemon || ''}
                onChange={(e) => setSelectedPokemon(e.target.value)}
                mb={4}
              >
                {myPokemon.map((p) => (
                  <option key={`${p.tokenId}-${p.pokemonId}-${p.level}`} value={p.tokenId}>
                    {p.name} (Level {p.level})
                  </option>
                ))}
              </Select>
              <Input
                placeholder="Price in tokens"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                min="0"
                step="0.1"
              />
              <Button
                colorScheme="blue"
                onClick={handleListPokemon}
                isLoading={isLoading}
                isDisabled={!selectedPokemon || !price}
              >
                List Pokemon
              </Button>
            </VStack>
          )}
        </Box>

        {/* Marketplace Listings */}
        <Box
          p={6}
          borderRadius="lg"
          boxShadow="lg"
          bg="white"
          _dark={{ bg: 'gray.700' }}
        >
          <Heading as="h2" size="md" mb={4}>
            Available Pokemon
          </Heading>
          {listings.length === 0 ? (
            <Text>No Pokemon available for sale.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {listings.map((listing) => (
                <Box
                  key={`listing-${listing.listingId}-${listing.tokenId}`}
                  p={4}
                  borderRadius="md"
                  bg={`${typeColors[listing.type]}20`}
                >
                  <Image
                    src={listing.image}
                    alt={listing.name}
                    boxSize="100px"
                    mx="auto"
                  />
                  <Text fontWeight="bold" mt={2}>
                    {listing.name}
                  </Text>
                  <Text>Level: {listing.level}</Text>
                  <Text>Price: {ethers.utils.formatEther(listing.price)} tokens</Text>
                  <Button
                    colorScheme="green"
                    size="sm"
                    mt={2}
                    onClick={() => handlePurchase(listing.listingId)}
                    isLoading={isLoading}
                  >
                    Purchase
                  </Button>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </SimpleGrid>
    </Container>
  )
}

export default Marketplace 