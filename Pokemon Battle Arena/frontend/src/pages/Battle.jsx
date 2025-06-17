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
  Select,
  Spinner,
  Progress,
  Badge
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useWeb3 } from '../context/Web3Context'
import { ethers } from 'ethers'
import Pokemon from '../contracts/Pokemon.json'
import BattleContract from '../contracts/Battle.json'
import contractAddresses from '../contracts/contract-addresses.json'
import { pokemonNames } from '../utils/pokemonNames'

// Animation keyframes
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`

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

const Battle = () => {
  const { provider, address, isConnected, connectWallet } = useWeb3()
  const [pokemon, setPokemon] = useState([])
  const [opponents, setOpponents] = useState([])
  const [selectedPokemon, setSelectedPokemon] = useState(null)
  const [selectedOpponent, setSelectedOpponent] = useState(null)
  const [battleError, setBattleError] = useState('')
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
      loadPokemon()
    }
  }, [provider, address, isCorrectNetwork])

  const loadPokemon = async () => {
    if (!provider || !address) {
      console.log('Provider or address not available:', { provider, address });
      return;
    }
    
    try {
      console.log('Loading Pokemon for address:', address);
      const pokemonContract = new ethers.Contract(
        contractAddresses.pokemon,
        Pokemon.abi,
        provider.getSigner()
      );
      
      // Get user's Pokemon
      let userPokemon;
      try {
        userPokemon = await pokemonContract.getUserPokemon(address);
        console.log('User Pokemon tokens:', userPokemon);
      } catch (error) {
        console.error('Error getting user Pokemon:', error);
        toast({
          title: 'Error',
          description: 'Failed to get your Pokemon. Please check your connection and try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      // Convert user's Pokemon tokens to a Set for faster lookup and remove duplicates
      const uniqueUserPokemon = [...new Set(userPokemon.map(token => token.toString()))];
      console.log('Unique user Pokemon tokens:', uniqueUserPokemon);
      
      // Load user's Pokemon details
      const pokemonDetails = await Promise.all(
        uniqueUserPokemon.map(async (tokenId) => {
          try {
            console.log('Loading details for token:', tokenId);
            // Check actual ownership
            const owner = await pokemonContract.ownerOf(tokenId);
            if (owner.toLowerCase() !== address.toLowerCase()) {
              console.log(`Token ${tokenId} is not owned by current user`);
              return null;
            }
            const data = await pokemonContract.pokemonData(tokenId);
            console.log('Pokemon data for token', tokenId, ':', data);
            return {
              tokenId: tokenId,
              pokemonId: data.pokemonId.toString(),
              name: pokemonNames[data.pokemonId],
              level: data.level.toString(),
              experience: data.experience.toString(),
              attack: data.attack.toString(),
              defense: data.defense.toString(),
              speed: data.speed.toString(),
              stamina: data.stamina.toString(),
              isResting: data.isResting,
              image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.pokemonId}.png`
            };
          } catch (error) {
            console.error(`Error loading Pokemon ${tokenId}:`, error);
            return null;
          }
        })
      );
      
      const validPokemon = pokemonDetails.filter(p => p !== null);
      console.log('Valid user Pokemon:', validPokemon);
      setPokemon(validPokemon);
      
      // Load opponents
      try {
        // Get all minted Pokemon IDs first
        const mintedPokemon = [];
        // Start from token ID 1 and increment until we hit an error
        let tokenId = 1;
        while (true) {
          try {
            // First check if the token exists by trying to get its data
            const data = await pokemonContract.pokemonData(tokenId);
            // If we get here, the token exists, now check its owner
            const owner = await pokemonContract.ownerOf(tokenId);
            // Only include Pokemon not owned by the user and owned by someone
            if (owner && owner.toLowerCase() !== address.toLowerCase()) {
              mintedPokemon.push(tokenId);
            }
            tokenId++;
          } catch (error) {
            // If we get an invalid token ID error, we've reached the end of minted tokens
            if (error.message.includes('invalid token ID') || error.message.includes('ERC721: invalid token ID')) {
              break;
            }
            console.error(`Error checking token ${tokenId}:`, error);
            tokenId++;
          }
        }
        
        console.log('Found minted Pokemon:', mintedPokemon);
        
        // Load details for minted Pokemon
        const opponentDetails = await Promise.all(
          mintedPokemon.map(async (tokenId) => {
            try {
              console.log('Loading opponent details for token:', tokenId);
              const data = await pokemonContract.pokemonData(tokenId);
              console.log('Opponent data for token', tokenId, ':', data);
              return {
                tokenId: tokenId.toString(),
                pokemonId: data.pokemonId.toString(),
                name: pokemonNames[data.pokemonId],
                level: data.level.toString(),
                experience: data.experience.toString(),
                attack: data.attack.toString(),
                defense: data.defense.toString(),
                speed: data.speed.toString(),
                stamina: data.stamina.toString(),
                isResting: data.isResting,
                image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.pokemonId}.png`
              };
            } catch (error) {
              console.error(`Error loading opponent Pokemon ${tokenId}:`, error);
              return null;
            }
          })
        );
        
        const validOpponents = opponentDetails.filter(p => p !== null);
        console.log('Valid opponents:', validOpponents);
        setOpponents(validOpponents);
      } catch (error) {
        console.error('Error loading opponents:', error);
        toast({
          title: 'Error',
          description: 'Failed to load opponent Pokemon',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error in loadPokemon:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Pokemon. Please check your connection and try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleBattle = async () => {
    if (!selectedPokemon || !selectedOpponent) {
      setBattleError('Please select both your Pokemon and an opponent')
      return
    }

    try {
      setIsLoading(true)
      setBattleError('')

      const battleContract = new ethers.Contract(
        contractAddresses.battle,
        BattleContract.abi,
        provider.getSigner()
      )

      // Get the battle transaction
      const tx = await battleContract.battle(selectedPokemon, selectedOpponent)
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait()
      
      // Get the battle result from the event
      const battleEndedEvent = receipt.events?.find(e => e.event === 'BattleEnded')
      if (battleEndedEvent) {
        const { winner, loser, winnerPokemonId, loserPokemonId } = battleEndedEvent.args
        
        // Check if the user won or lost
        const userWon = winner.toLowerCase() === address.toLowerCase()
        const userTokenId = userWon ? winnerPokemonId : loserPokemonId
        
        // Get the user's Pokemon data
        const userPokemon = pokemon.find(p => p.tokenId === userTokenId.toString())
        
        // Show battle result
        toast({
          title: userWon ? 'Victory!' : 'Defeat!',
          description: userWon 
            ? `Your ${userPokemon?.name} won the battle and gained experience!` 
            : `Your ${userPokemon?.name} lost the battle but still gained some experience.`,
          status: userWon ? 'success' : 'warning',
          duration: 5000,
          isClosable: true,
        })
      }

      // Reload Pokemon data to update experience and stats
      await loadPokemon()
      
      // Clear selections
      setSelectedPokemon(null)
      setSelectedOpponent(null)
    } catch (error) {
      console.error('Battle error:', error)
      setBattleError(error.message)
      toast({
        title: 'Battle Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={10}>
          <Text fontSize="xl" mb={4}>
            Please connect your wallet to start battling!
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
      <Heading as="h1" size="xl" mb={8} textAlign="center">
        Pokemon Battle Arena
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
        {/* Your Pokemon Selection */}
        <Box
          p={6}
          borderRadius="lg"
          boxShadow="lg"
          bg="white"
          _dark={{ bg: 'gray.700' }}
        >
          <Heading as="h2" size="md" mb={4}>
            Your Pokemon
          </Heading>
          {pokemon.length === 0 ? (
            <Text>You don't have any Pokemon to battle with.</Text>
          ) : (
            <VStack spacing={4}>
              <Select
                placeholder="Select your Pokemon"
                value={selectedPokemon || ''}
                onChange={(e) => setSelectedPokemon(e.target.value)}
                mb={4}
                id="user-pokemon-select"
              >
                {pokemon.map((p) => (
                  <option key={`user-pokemon-${p.tokenId}`} value={p.tokenId}>
                    {p.name} (Level {p.level})
                  </option>
                ))}
              </Select>
              {selectedPokemon && (
                <Box
                  p={4}
                  borderRadius="md"
                  bg={`${typeColors[pokemonTypes[pokemon.find(p => p.tokenId === selectedPokemon)?.pokemonId]]}20`}
                  textAlign="center"
                >
                  <Image
                    src={pokemon.find(p => p.tokenId === selectedPokemon)?.image}
                    alt={pokemon.find(p => p.tokenId === selectedPokemon)?.name}
                    boxSize="150px"
                    mx="auto"
                    animation={`${float} 3s ease-in-out infinite`}
                  />
                  <Text fontWeight="bold" mt={2}>
                    {pokemon.find(p => p.tokenId === selectedPokemon)?.name}
                  </Text>
                  <Text>Level: {pokemon.find(p => p.tokenId === selectedPokemon)?.level}</Text>
                  <Text>Attack: {pokemon.find(p => p.tokenId === selectedPokemon)?.attack}</Text>
                  <Text>Defense: {pokemon.find(p => p.tokenId === selectedPokemon)?.defense}</Text>
                  <Text>Speed: {pokemon.find(p => p.tokenId === selectedPokemon)?.speed}</Text>
                  <Progress
                    value={pokemon.find(p => p.tokenId === selectedPokemon)?.stamina}
                    max={100}
                    colorScheme="green"
                    size="sm"
                    mt={2}
                  />
                  <Text fontSize="sm" mt={1}>
                    Stamina: {pokemon.find(p => p.tokenId === selectedPokemon)?.stamina}/100
                  </Text>
                </Box>
              )}
            </VStack>
          )}
        </Box>

        {/* Opponent Selection */}
        <Box
          p={6}
          borderRadius="lg"
          boxShadow="lg"
          bg="white"
          _dark={{ bg: 'gray.700' }}
        >
          <Heading as="h2" size="md" mb={4}>
            Choose Opponent
          </Heading>
          {opponents.length === 0 ? (
            <Text>No opponents available.</Text>
          ) : (
            <VStack spacing={4}>
              <Select
                placeholder="Select opponent"
                value={selectedOpponent || ''}
                onChange={(e) => setSelectedOpponent(e.target.value)}
                mb={4}
                id="opponent-pokemon-select"
              >
                {opponents.map((o) => (
                  <option key={`opponent-pokemon-${o.tokenId}`} value={o.tokenId}>
                    {o.name} (Level {o.level})
                  </option>
                ))}
              </Select>
              {selectedOpponent && (
                <Box
                  p={4}
                  borderRadius="md"
                  bg={`${typeColors[pokemonTypes[opponents.find(o => o.tokenId === selectedOpponent)?.pokemonId]]}20`}
                  textAlign="center"
                >
                  <Image
                    src={opponents.find(o => o.tokenId === selectedOpponent)?.image}
                    alt={opponents.find(o => o.tokenId === selectedOpponent)?.name}
                    boxSize="150px"
                    mx="auto"
                    animation={`${float} 3s ease-in-out infinite`}
                  />
                  <Text fontWeight="bold" mt={2}>
                    {opponents.find(o => o.tokenId === selectedOpponent)?.name}
                  </Text>
                  <Text>Level: {opponents.find(o => o.tokenId === selectedOpponent)?.level}</Text>
                  <Text>Attack: {opponents.find(o => o.tokenId === selectedOpponent)?.attack}</Text>
                  <Text>Defense: {opponents.find(o => o.tokenId === selectedOpponent)?.defense}</Text>
                  <Text>Speed: {opponents.find(o => o.tokenId === selectedOpponent)?.speed}</Text>
                  <Progress
                    value={opponents.find(o => o.tokenId === selectedOpponent)?.stamina}
                    max={100}
                    colorScheme="green"
                    size="sm"
                    mt={2}
                  />
                  <Text fontSize="sm" mt={1}>
                    Stamina: {opponents.find(o => o.tokenId === selectedOpponent)?.stamina}/100
                  </Text>
                </Box>
              )}
            </VStack>
          )}
        </Box>
      </SimpleGrid>

      {isConnected && isCorrectNetwork && (
        <Box mt={8} textAlign="center">
          <Button
            colorScheme="red"
            size="lg"
            onClick={handleBattle}
            isLoading={isLoading}
            isDisabled={!selectedPokemon || !selectedOpponent}
          >
            Start Battle!
          </Button>
          {battleError && (
            <Text color="red.500" mt={4}>
              {battleError}
            </Text>
          )}
        </Box>
      )}
    </Container>
  )
}

export default Battle 