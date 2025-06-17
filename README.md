This project is from 2025.<br/>
# Pokemon Battle Arena

A decentralized Pokemon battle game built on Ethereum using Hardhat and React. Battle your Pokemon against others, gain experience, and climb the leaderboard!

## Contributors
Name: Robin Khiv

Name: Shayan Darian

Name: Sarah Greenfield

Name: Yash Dusane

## Features

### Blockchain Features
- **NFT-based Pokemon**: Each Pokemon is a unique ERC-721 token on the blockchain
- **Decentralized Ownership**: True ownership of your Pokemon through blockchain technology
- **Smart Contract Battles**: All battles are executed through smart contracts, ensuring fairness and transparency
- **On-chain Experience**: Pokemon experience and stats are stored on the blockchain
- **Battle History**: All battle results are permanently recorded on the blockchain
- **Leaderboard**: Global rankings are calculated from on-chain battle data
- **Token Rewards**: Earn ERC-20 tokens through successful battles
- **Lazy Listing Marketplace**: List your Pokemon for sale without transferring them to the marketplace contract. You can still train, battle, and interact with your Pokemon while they are listed. Ownership only transfers when purchased.

### Game Features
- **Starter Pokemon**: Choose from Bulbasaur, Charmander, Squirtle, or Pikachu as your first Pokemon
- **Training System**: Train your Pokemon to gain experience and level up
- **Battle System**: Challenge other trainers' Pokemon in battles
- **Stats System**: Each Pokemon has HP, Attack, Defense, and Speed stats that increase with level
- **Stamina System**: Pokemon need to rest to recover stamina after training or battles
- **Marketplace**: Buy and sell Pokemon using the game's token currency
- **Modern UI**: Clean and responsive interface for managing your Pokemon collection

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MetaMask wallet
- Local Hardhat node

## Installation

1. Clone the repository:
```bash
git clone https://github.com/robinkhiv/CPSC-559-Final-Project.git
cd CPSC-559-Final-Project
```

2. Install dependencies:
```bash
npm install
```

3. Start the local Hardhat node:
```bash
npx hardhat node
```

4. In a new terminal, deploy the contracts:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

5. Copy contract artifacts to frontend:
```bash
node scripts/copy-artifacts.js
```

6. Start the frontend development server:
```bash
cd frontend
npm install
npm run dev
```

## Configuration

1. Connect MetaMask to the local Hardhat network:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. Import an account from your Hardhat node into MetaMask:
   - Copy a private key from the Hardhat node output
   - In MetaMask, click "Import Account"
   - Paste the private key

## How to Play

1. **Connect Your Wallet**
   - Click the "Connect Wallet" button
   - Make sure you're connected to the Hardhat network

2. **Get Your Starter Pokemon**
   - Go to the "Pokemon" or "Collection" page
   - Click "Mint Starter Pokemon"
   - Choose your starter Pokemon (Bulbasaur, Charmander, Squirtle, or Pikachu)
   - **If you sell or transfer your only Pokemon, you can mint a new starter!**

3. **Train Your Pokemon**
   - Go to the "Collection" page
   - Select a Pokemon from your collection
   - Click "Train" to gain experience
   - Your Pokemon will gain 50 experience points per training session
   - Level up occurs at 100 experience points
   - Stats increase by 5 points per level

4. **Battle Other Pokemon**
   - Go to the "Battle" page
   - Select your Pokemon and an opponent
   - Click "Start Battle!"
   - Watch the battle unfold and see the results
   - Winners receive 10 tokens and 100 experience points
   - Losers receive 50 experience points

5. **List a Pokemon for Sale**
   - Go to the "Marketplace" page
   - Select a Pokemon from your collection
   - Enter a price in tokens
   - Click "List Pokemon"
   - **Your Pokemon stays in your wallet and can still be trained or battled while listed.**

6. **Purchase a Pokemon**
   - Go to the "Marketplace" page
   - Click "Purchase" on a listed Pokemon
   - The Pokemon will be transferred to your account

7. **Track Your Progress**
   - View your Pokemon's stats and experience
   - Check your battle history
   - See where you rank on the leaderboard

## Game Mechanics

### Experience and Leveling
- Each training session grants 50 experience points
- Level up occurs at 100 experience points
- Stats increase by 5 points per level
- HP is fully restored upon level up
- Stamina is fully restored upon level up

### Battle System
- Battles are determined by Pokemon stats and level
- Winners receive 10 tokens and 100 experience points
- Losers receive 50 experience points
- Pokemon need stamina to battle
- Battle history is recorded on the blockchain

### Stamina System
- Training costs 10 stamina points
- Battles cost 20 stamina points
- Pokemon can rest to recover stamina
- Full stamina is 100 points

## Common Issues & Troubleshooting

1. **Can't connect to wallet**
   - Make sure MetaMask is installed
   - Check that you're connected to the Hardhat network
   - Try refreshing the page

2. **Transaction fails**
   - Check your Hardhat node is running
   - Ensure you have enough ETH in your account
   - Verify your Pokemon has enough stamina
   - Make sure you have enough ERC-20 tokens for purchases

3. **Pokemon not showing up**
   - Refresh the page
   - Check the console for errors
   - Make sure you've minted a Pokemon
   - If you listed a Pokemon, it will still show in your collection until purchased

4. **Can't mint a starter after selling**
   - You can mint a new starter if you have no Pokemon in your wallet
   - If you see an error, make sure your contract and frontend are up to date and synced

5. **Can't purchase a Pokemon**
   - Make sure you have enough tokens
   - Check that the listing is still active
   - Verify you're not trying to purchase your own Pokemon

6. **ABI or contract errors**
   - If you see errors about missing functions, make sure you have copied the latest contract artifacts to the frontend
   - Restart your dev server after updating artifacts

## Contributing

Feel free to submit issues and enhancement requests!
