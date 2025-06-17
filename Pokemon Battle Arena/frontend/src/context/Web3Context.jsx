import { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import contractAddresses from '../contracts/contract-addresses.json'

const Web3Context = createContext()

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [address, setAddress] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check if wallet is already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
      connectWallet()
    }
  }, [])

  const connectWallet = async () => {
    try {
      const web3Modal = new Web3Modal({
        cacheProvider: true,
        providerOptions: {}
      })
      
      const instance = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(instance)
      const signer = provider.getSigner()
      const address = await signer.getAddress()

      setProvider(provider)
      setSigner(signer)
      setAddress(address)
      setIsConnected(true)

      // Set up event listeners
      instance.on('accountsChanged', (accounts) => {
        setAddress(accounts[0])
      })

      instance.on('chainChanged', () => {
        window.location.reload()
      })
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const disconnectWallet = () => {
    setProvider(null)
    setSigner(null)
    setAddress('')
    setIsConnected(false)
  }

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        address,
        isConnected,
        connectWallet,
        disconnectWallet,
        contractAddresses
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
} 