import { useState, useEffect } from 'react';
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
  Spinner,
  Badge
} from '@chakra-ui/react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';
import PokemonContract from '../contracts/Pokemon.json';
import contractAddresses from '../contracts/contract-addresses.json';
import { pokemonNames } from '../utils/pokemonNames';

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
};

// Pokemon type mapping
const pokemonTypes = {
  1: 'grass', // Bulbasaur
  4: 'fire',  // Charmander
  7: 'water', // Squirtle
  25: 'electric' // Pikachu
};

const Pokemon = () => {
  const { provider, address, isConnected, connectWallet } = useWeb3();
  const [pokemon, setPokemon] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const checkNetwork = async () => {
      if (provider) {
        try {
          const network = await provider.getNetwork();
          setIsCorrectNetwork(network.chainId === 31337);
        } catch (error) {
          console.error('Error checking network:', error);
          setIsCorrectNetwork(false);
        }
      }
    };
    checkNetwork();
  }, [provider]);

  useEffect(() => {
    if (provider && address && isCorrectNetwork) {
      loadPokemon();
    }
  }, [provider, address, isCorrectNetwork]);

  const loadPokemon = async () => {
    if (!provider || !address) return;

    try {
      const pokemonContract = new ethers.Contract(
        contractAddresses.pokemon,
        PokemonContract.abi,
        provider
      );

      const userPokemon = await pokemonContract.getUserPokemon(address);
      const pokemonDetails = await Promise.all(
        userPokemon.map(async (tokenId) => {
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
        })
      );

      setPokemon(pokemonDetails);
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

  const handleMint = async () => {
    if (!provider || !address) return;

    try {
      setIsLoading(true);
      const pokemonContract = new ethers.Contract(
        contractAddresses.pokemon,
        PokemonContract.abi,
        provider.getSigner()
      );

      const tx = await pokemonContract.mintPokemon();
      await tx.wait();

      toast({
        title: 'Success',
        description: 'New Pokemon minted successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      await loadPokemon();
    } catch (error) {
      console.error('Error minting Pokemon:', error);
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

  if (!isConnected) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={10}>
          <Text fontSize="xl" mb={4}>
            Please connect your wallet to view and mint Pokemon!
          </Text>
          <Button colorScheme="blue" onClick={connectWallet}>
            Connect Wallet
          </Button>
        </Box>
      </Container>
    );
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
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" size="xl" mb={8} textAlign="center">
        Your Pokemon Collection
      </Heading>

      <Box textAlign="center" mb={8}>
        <Button
          colorScheme="blue"
          onClick={handleMint}
          isLoading={isLoading}
          loadingText="Minting..."
        >
          Mint New Pokemon
        </Button>
      </Box>

      {pokemon.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text fontSize="xl">
            You don't have any Pokemon yet. Mint one to get started!
          </Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {pokemon.map((p) => (
            <Box
              key={p.tokenId}
              p={6}
              borderRadius="lg"
              boxShadow="lg"
              bg="white"
              _dark={{ bg: 'gray.700' }}
            >
              <Image
                src={p.image}
                alt={p.name}
                boxSize="150px"
                mx="auto"
                mb={4}
              />
              <VStack spacing={2} align="stretch">
                <Heading as="h3" size="md" textAlign="center">
                  {p.name}
                </Heading>
                <Badge
                  colorScheme={p.type}
                  alignSelf="center"
                  px={2}
                  py={1}
                  borderRadius="full"
                >
                  {p.type}
                </Badge>
                <Text>Level: {p.level}</Text>
                <Text>Experience: {p.experience}</Text>
                <Text>Token ID: {p.tokenId}</Text>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
};

export default Pokemon; 