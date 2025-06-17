import { Box, Flex, Button, Link, Text, useColorMode } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useWeb3 } from '../context/Web3Context'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'

const Navbar = () => {
  const { isConnected, address, connectWallet, disconnectWallet } = useWeb3()
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <Box bg={colorMode === 'light' ? 'white' : 'gray.800'} px={4} py={2} boxShadow="sm">
      <Flex maxW="1200px" mx="auto" justify="space-between" align="center">
        <Flex gap={6}>
          <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            <Text fontSize="xl" fontWeight="bold">Pokemon Battle</Text>
          </Link>
          {isConnected && (
            <>
              <Link as={RouterLink} to="/collection" _hover={{ textDecoration: 'none' }}>
                Collection
              </Link>
              <Link as={RouterLink} to="/battle" _hover={{ textDecoration: 'none' }}>
                Battle
              </Link>
              <Link as={RouterLink} to="/marketplace" _hover={{ textDecoration: 'none' }}>
                Marketplace
              </Link>
              <Link as={RouterLink} to="/leaderboard" _hover={{ textDecoration: 'none' }}>
                Leaderboard
              </Link>
            </>
          )}
        </Flex>
        
        <Flex align="center" gap={4}>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleColorMode}
            aria-label="Toggle color mode"
          >
            {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          </Button>
          {isConnected ? (
            <>
              <Text fontSize="sm" color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
                {address.slice(0, 6)}...{address.slice(-4)}
              </Text>
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                onClick={disconnectWallet}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              colorScheme="blue"
              onClick={connectWallet}
            >
              Connect Wallet
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  )
}

export default Navbar 