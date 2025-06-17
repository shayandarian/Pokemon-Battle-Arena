import { useState, useEffect } from 'react'
import { Box, Container, Heading, Text, SimpleGrid, Button, Image, useToast, VStack, Select, Spinner, Badge } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useWeb3 } from '../context/Web3Context'
import { ethers } from 'ethers'
import Pokemon from '../contracts/Pokemon.json'
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

const Collection = () => {
  const { signer, isConnected, address, provider, connectWallet } = useWeb3()
  const [pokemonList, setPokemonList] = useState([])
  const [loading, setLoading] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const toast = useToast()
  const [selectedPokemon, setSelectedPokemon] = useState('')
  const [pokemonContract, setPokemonContract] = useState(null)

  useEffect(() => {
    if (isConnected && signer && address) {
      const contract = new ethers.Contract(
        contractAddresses.pokemon,
        Pokemon.abi,
        signer
      )
      setPokemonContract(contract)
      checkNetwork()
      loadPokemon(contract)
    }
  }, [isConnected, signer, address])

  const checkNetwork = async () => {
    try {
      if (!provider) return
      const network = await provider.getNetwork()
      if (network.chainId !== 31337) {
        setNetworkError(true)
        toast({
          title: 'Wrong Network',
          description: 'Please connect to the local development network',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } else {
        setNetworkError(false)
      }
    } catch (error) {
      console.error('Error checking network:', error)
    }
  }

  const loadPokemon = async (contract) => {
    try {
      if (!signer || !address) {
        throw new Error('Wallet not connected')
      }

      if (networkError) {
        throw new Error('Please connect to the correct network')
      }

      setLoading(true)
      
      const code = await provider.getCode(contractAddresses.pokemon)
      if (code === '0x') {
        throw new Error('Contract not deployed at this address')
      }
      
      // Get all tokens ever owned by the user
      const userPokemon = await contract.getUserPokemon(address)
      if (userPokemon.length === 0) {
        setPokemonList([])
        return
      }

      // Filter out duplicate tokenIds and verify ownership
      const uniqueTokenIds = [...new Set(userPokemon.map(id => id.toString()))]
      
      const pokemonData = await Promise.all(
        uniqueTokenIds.map(async (tokenId) => {
          try {
            // Check actual ownership
            const owner = await contract.ownerOf(tokenId);
            if (owner.toLowerCase() !== address.toLowerCase()) {
              console.log(`Token ${tokenId} is not owned by current user`);
              return null;
            }

            const data = await contract.pokemonData(tokenId)
            return {
              tokenId: tokenId,
              pokemonId: data.pokemonId.toString(),
              level: data.level.toString(),
              experience: data.experience.toString(),
              hp: data.hp.toString(),
              maxHp: data.maxHp.toString(),
              attack: data.attack.toString(),
              defense: data.defense.toString(),
              speed: data.speed.toString(),
              stamina: data.stamina.toString(),
              isResting: data.isResting
            }
          } catch (error) {
            console.error(`Error processing token ${tokenId}:`, error);
            return null;
          }
        })
      )
      
      const validPokemon = pokemonData.filter(p => p !== null);
      setPokemonList(validPokemon)
    } catch (error) {
      console.error('Error loading Pokemon:', error)
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMintStarter = async (pokemonId) => {
    try {
      if (!signer || !address) {
        throw new Error('Wallet not connected')
      }

      setLoading(true)
      const pokemonContract = new ethers.Contract(
        contractAddresses.pokemon,
        Pokemon.abi,
        signer
      )
      
      // Check if user already has Pokemon
      // const userPokemon = await pokemonContract.getUserPokemon(address)
      // if (userPokemon.length > 0) {
      //   throw new Error('You already have a Pokemon!')
      // }
      
      const tx = await pokemonContract.mintStarterPokemon(pokemonId)
      await tx.wait()
      
      toast({
        title: 'Success',
        description: 'Starter Pokemon minted successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      
      loadPokemon(pokemonContract)
    } catch (error) {
      console.error('Error minting Pokemon:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to mint starter Pokemon',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePokemon = async (tokenId) => {
    try {
      if (!signer || !address) {
        throw new Error('Wallet not connected')
      }

      setLoading(true)
      const pokemonContract = new ethers.Contract(
        contractAddresses.pokemon,
        Pokemon.abi,
        signer
      )
      
      const tx = await pokemonContract.removePokemon(tokenId)
      await tx.wait()
      
      toast({
        title: 'Success',
        description: 'Pokemon removed successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      
      loadPokemon(pokemonContract)
    } catch (error) {
      console.error('Error removing Pokemon:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove Pokemon',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const validateTraining = (pokemon) => {
    if (!pokemon) {
      return {
        canTrain: false,
        error: ''
      }
    }

    const stamina = parseInt(pokemon.stamina)
    if (stamina < 10) {
      return {
        canTrain: false,
        error: 'Pokemon needs at least 10 stamina to train'
      }
    }

    if (pokemon.isResting) {
      return {
        canTrain: false,
        error: 'Pokemon is resting'
      }
    }

    return {
      canTrain: true,
      error: ''
    }
  }

  const validateRest = (pokemon) => {
    if (!pokemon) return false
    if (pokemon.isResting) return false
    if (parseInt(pokemon.stamina) === 100) return false
    return true
  }

  const handleTrain = async (tokenId) => {
    try {
      if (!tokenId) {
        throw new Error('No Pokemon selected')
      }

      const pokemon = pokemonList.find(p => p.tokenId === tokenId)
      const { canTrain, error } = validateTraining(pokemon)
      
      if (!canTrain) {
        throw new Error(error || 'Cannot train this Pokemon')
      }

      setLoading(true)
      const tx = await pokemonContract.train(tokenId)
      await tx.wait()

      // Get updated Pokemon data
      const updatedPokemon = await pokemonContract.getPokemon(tokenId)
      
      toast({
        title: 'Training Complete',
        description: `Your Pokemon gained 50 experience points!${
          updatedPokemon.level > pokemonList.find(p => p.tokenId === tokenId).level
            ? ' Your Pokemon leveled up!'
            : ''
        }`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Reload Pokemon data
      loadPokemon(pokemonContract)
    } catch (error) {
      console.error('Error training Pokemon:', error)
      toast({
        title: 'Training Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRest = async (tokenId) => {
    if (!pokemonContract) {
      toast({
        title: "Error",
        description: "Contract not initialized",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setLoading(true);
      const tx = await pokemonContract.restPokemon(tokenId);
      await tx.wait();
      toast({
        title: "Pokemon is now resting",
        description: "Your Pokemon will recover stamina while resting",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      loadPokemon(pokemonContract);
    } catch (error) {
      console.error("Error resting Pokemon:", error);
      toast({
        title: "Failed to rest Pokemon",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWakeUp = async (tokenId) => {
    if (!pokemonContract) {
      toast({
        title: "Error",
        description: "Contract not initialized",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setLoading(true);
      const tx = await pokemonContract.wakeUpPokemon(tokenId);
      await tx.wait();
      toast({
        title: "Pokemon woke up",
        description: "Your Pokemon is ready for action!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      loadPokemon(pokemonContract);
    } catch (error) {
      console.error("Error waking up Pokemon:", error);
      toast({
        title: "Failed to wake up Pokemon",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected || !signer || !address) {
    return (
      <Box 
        textAlign="center" 
        py={10}
        minH="100vh"
        bg="gray.900"
      >
        <Heading size="lg" color="white" textShadow="2px 2px 4px rgba(0,0,0,0.4)">
          Please connect your wallet to view your Pokemon collection
        </Heading>
        <Button 
          mt={4} 
          onClick={connectWallet}
          colorScheme="blue"
          size="lg"
          _hover={{ transform: 'scale(1.05)' }}
          transition="all 0.2s"
        >
          Connect Wallet
        </Button>
      </Box>
    )
  }

  if (pokemonList.length === 0) {
    return (
      <Box 
        minH="100vh"
        bg="gray.900"
        py={10}
      >
        <Container maxW="container.xl">
          <VStack spacing={8}>
            <Heading textAlign="center" color="white" textShadow="2px 2px 4px rgba(0,0,0,0.4)">
              Choose Your Starter Pokemon
            </Heading>
            <Text color="white" fontSize="xl" textAlign="center" textShadow="1px 1px 2px rgba(0,0,0,0.3)">
              Select one of these Pokemon to begin your journey!
            </Text>
            <SimpleGrid columns={[1, 2, 4]} spacing={8}>
              {[
                { id: 1, name: 'Bulbasaur', type: 'grass' },
                { id: 4, name: 'Charmander', type: 'fire' },
                { id: 7, name: 'Squirtle', type: 'water' },
                { id: 25, name: 'Pikachu', type: 'electric' }
              ].map((starter) => (
                <Box
                  key={starter.id}
                  position="relative"
                  bg={`linear-gradient(135deg, ${typeColors[starter.type]} 0%, ${typeColors[starter.type]}88 100%)`}
                  borderRadius="xl"
                  boxShadow="xl"
                  p={6}
                  transition="all 0.3s"
                  _hover={{ transform: 'translateY(-5px)' }}
                  onClick={() => !loading && handleMintStarter(starter.id)}
                  cursor={loading ? 'not-allowed' : 'pointer'}
                >
                  <VStack spacing={4}>
                    <Image
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${starter.id}.png`}
                      alt={starter.name}
                      width="120px"
                      height="120px"
                      objectFit="contain"
                      animation={`${pulse} 2s ease-in-out infinite`}
                    />
                    <Text
                      color="white"
                      fontSize="xl"
                      fontWeight="bold"
                      textShadow="1px 1px 2px rgba(0,0,0,0.3)"
                    >
                      {starter.name}
                    </Text>
                    <Text
                      color="white"
                      fontSize="sm"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      textShadow="1px 1px 2px rgba(0,0,0,0.3)"
                    >
                      {starter.type} type
                    </Text>
                  </VStack>
                  {loading && (
                    <Box
                      position="absolute"
                      top="0"
                      left="0"
                      right="0"
                      bottom="0"
                      bg="blackAlpha.600"
                      borderRadius="xl"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="white" fontSize="lg" fontWeight="bold">
                        Minting...
                      </Text>
                    </Box>
                  )}
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>
    )
  }

  return (
    <Box 
      minH="100vh"
      bg="gray.900"
      py={8}
    >
      <Container maxW="1400px">
        <Heading 
          mb={8} 
          textAlign="center" 
          color="white" 
          textShadow="2px 2px 4px rgba(0,0,0,0.4)"
          fontSize="4xl"
          letterSpacing="wide"
        >
          Your Pokemon Collection
        </Heading>
        
        <SimpleGrid columns={[1, 2, 3]} spacing={8}>
          {pokemonList.map((pokemon) => {
            const { canTrain, error } = validateTraining(pokemon)
            const canRest = validateRest(pokemon)
            const pokemonType = pokemonTypes[pokemon.pokemonId] || 'normal'
            
            return (
              <Box
                key={pokemon.tokenId}
                bg="white"
                p={6}
                borderRadius="lg"
                boxShadow="xl"
                position="relative"
                overflow="hidden"
                transition="all 0.3s"
                _hover={{
                  transform: 'translateY(-5px)',
                  boxShadow: '2xl',
                }}
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  bg: typeColors[pokemonType],
                }}
              >
                <VStack spacing={4} align="stretch">
                  <Box position="relative">
                    <Image
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonId}.png`}
                      alt={pokemonNames[pokemon.pokemonId]}
                      width="150px"
                      height="150px"
                      objectFit="contain"
                      mx="auto"
                      opacity={pokemon.isResting ? 0.5 : 1}
                      animation={`${float} 3s ease-in-out infinite`}
                    />
                    {pokemon.isResting && (
                      <Text
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        fontSize="2xl"
                        fontWeight="bold"
                        color="gray.600"
                        textShadow="2px 2px 4px rgba(0,0,0,0.2)"
                      >
                        Zzzz...
                      </Text>
                    )}
                  </Box>

                  <VStack spacing={2} align="stretch">
                    <Heading 
                      size="md" 
                      textAlign="center"
                      color="gray.700"
                      letterSpacing="tight"
                      lineHeight="1.2"
                    >
                      {pokemonNames[pokemon.pokemonId]}
                    </Heading>
                    
                    <Badge
                      colorScheme={pokemonType}
                      alignSelf="center"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      {pokemonType} Type
                    </Badge>

                    <Box 
                      bg="gray.50" 
                      p={3} 
                      borderRadius="md"
                      boxShadow="inner"
                    >
                      <SimpleGrid columns={2} spacing={2}>
                        <Stat label="Level" value={pokemon.level} />
                        <Stat label="Exp" value={pokemon.experience} />
                        <Stat label="HP" value={`${pokemon.hp}/${pokemon.maxHp}`} />
                        <Stat label="Stamina" value={pokemon.stamina} />
                        <Stat label="Attack" value={pokemon.attack} />
                        <Stat label="Defense" value={pokemon.defense} />
                        <Stat label="Speed" value={pokemon.speed} />
                        <Stat 
                          label="Status" 
                          value={pokemon.isResting ? "Resting" : "Active"} 
                          color={pokemon.isResting ? "orange.500" : "green.500"}
                        />
                      </SimpleGrid>
                    </Box>

                    <SimpleGrid columns={2} spacing={2} mt={4}>
                      <Button
                        colorScheme="red"
                        onClick={() => handleRemovePokemon(pokemon.tokenId)}
                        size="sm"
                        variant="outline"
                      >
                        Remove
                      </Button>
                      
                      {!pokemon.isResting ? (
                        <>
                          <Button
                            colorScheme="blue"
                            onClick={() => handleTrain(pokemon.tokenId)}
                            isDisabled={!canTrain || loading}
                            size="sm"
                            variant="solid"
                          >
                            Train
                          </Button>
                          <Button
                            colorScheme="teal"
                            onClick={() => handleRest(pokemon.tokenId)}
                            isDisabled={!canRest || loading}
                            size="sm"
                            variant="solid"
                          >
                            Rest
                          </Button>
                        </>
                      ) : (
                        <Button
                          colorScheme="orange"
                          onClick={() => handleWakeUp(pokemon.tokenId)}
                          isDisabled={loading}
                          size="sm"
                          variant="solid"
                        >
                          Wake Up
                        </Button>
                      )}
                    </SimpleGrid>
                  </VStack>
                </VStack>
              </Box>
            )
          })}
        </SimpleGrid>
      </Container>
    </Box>
  )
}

// Enhanced Stat component
const Stat = ({ label, value, color }) => (
  <Box>
    <Text 
      fontSize="xs" 
      color="gray.500" 
      fontWeight="medium"
      letterSpacing="wide"
      textTransform="uppercase"
      lineHeight="1"
    >
      {label}
    </Text>
    <Text 
      fontSize="md" 
      fontWeight="bold" 
      color={color || "gray.700"}
      letterSpacing="tight"
      lineHeight="1.2"
    >
      {value}
    </Text>
  </Box>
)

export default Collection 