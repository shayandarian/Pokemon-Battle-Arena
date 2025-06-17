import { useState, useEffect } from 'react'
import { Box, Container, Heading, Table, Thead, Tbody, Tr, Th, Td, Text } from '@chakra-ui/react'
import { useWeb3 } from '../context/Web3Context'
import { ethers } from 'ethers'
import BattleContract from '../contracts/Battle.json'
import Pokemon from '../contracts/Pokemon.json'
import contractAddresses from '../contracts/contract-addresses.json'

const Leaderboard = () => {
  const { signer, isConnected } = useWeb3()
  const [topBattlers, setTopBattlers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isConnected) {
      loadLeaderboard()
    }
  }, [isConnected])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      const battleContract = new ethers.Contract(
        contractAddresses.battle,
        BattleContract.abi,
        signer
      )
      
      const [addresses, wins] = await battleContract.getTopBattlers(10)
      
      const battlers = addresses.map((address, index) => ({
        rank: index + 1,
        address,
        wins: wins[index].toString(),
      }))
      
      setTopBattlers(battlers)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <Container maxW="1200px" py={8} textAlign="center">
        <Heading mb={4}>Connect Your Wallet</Heading>
        <Text color="gray.600">
          Please connect your wallet to view the leaderboard.
        </Text>
      </Container>
    )
  }

  return (
    <Container maxW="1200px" py={8}>
      <Heading mb={8}>Top Battlers</Heading>
      
      <Box bg="white" borderRadius="lg" boxShadow="md" p={6}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Rank</Th>
              <Th>Address</Th>
              <Th isNumeric>Wins</Th>
            </Tr>
          </Thead>
          <Tbody>
            {topBattlers.map((battler) => (
              <Tr key={`${battler.address}-${battler.rank}`}>
                <Td>{battler.rank}</Td>
                <Td>
                  {battler.address.slice(0, 6)}...{battler.address.slice(-4)}
                </Td>
                <Td isNumeric>{battler.wins}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Container>
  )
}

export default Leaderboard 