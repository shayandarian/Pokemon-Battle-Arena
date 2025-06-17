import { Box, Container, Heading, Text, Button, SimpleGrid, Image } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useWeb3 } from '../context/Web3Context'

const Home = () => {
  const { isConnected } = useWeb3()

  return (
    <Container maxW="1200px" py={8}>
      <Box textAlign="center" mb={12}>
        <Heading as="h1" size="2xl" mb={4}>
          Welcome to Pokemon Battle
        </Heading>
        <Text fontSize="xl" color="gray.600" mb={8}>
          Collect, train, and battle with your favorite Pokemon in this blockchain-based game!
        </Text>
        {!isConnected && (
          <Button
            size="lg"
            colorScheme="blue"
            as={RouterLink}
            to="/collection"
          >
            Get Started
          </Button>
        )}
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
        <Box p={6} bg="white" borderRadius="lg" boxShadow="md">
          <Heading as="h3" size="md" mb={4}>
            Collect Pokemon
          </Heading>
          <Text color="gray.600">
            Build your team of up to 3 Pokemon. Each Pokemon is a unique NFT with its own stats and abilities.
          </Text>
        </Box>

        <Box p={6} bg="white" borderRadius="lg" boxShadow="md">
          <Heading as="h3" size="md" mb={4}>
            Battle System
          </Heading>
          <Text color="gray.600">
            Challenge other trainers in exciting battles. Win tokens and level up your Pokemon.
          </Text>
        </Box>

        <Box p={6} bg="white" borderRadius="lg" boxShadow="md">
          <Heading as="h3" size="md" mb={4}>
            Evolution & Trading
          </Heading>
          <Text color="gray.600">
            Evolve your Pokemon at certain levels and trade with other players in the marketplace.
          </Text>
        </Box>
      </SimpleGrid>
    </Container>
  )
}

export default Home 