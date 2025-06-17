import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Pokemon from './pages/Pokemon'
import Battle from './pages/Battle'
import Collection from './pages/Collection'
import Leaderboard from './pages/Leaderboard'
import Marketplace from './pages/Marketplace'
import { useWeb3 } from './context/Web3Context'

function App() {
  const { isConnected, connectWallet } = useWeb3()

  return (
    <Router>
      <Box minH="100vh">
        <Navbar />
        <Box as="main" p={4}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pokemon" element={<Pokemon />} />
            <Route path="/battle" element={<Battle />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  )
}

export default App 