# Decentralized Healthcare Database

A blockchain-based platform for secure, privacy-preserved cross-organization healthcare collaboration built on Base L2.

## Features

- 🔒 **Encrypted Storage**: Patient data is encrypted and stored off-chain (IPFS), with hashes stored on-chain
- 🏥 **Cross-Organization Collaboration**: Secure access control for healthcare organizations
- 🔐 **Access Control**: Granular permissions for record access and sharing
- 📊 **Audit Trail**: All access grants and revocations are logged on-chain
- ⚡ **Base L2**: Low-cost transactions on Base Layer 2

## Project Structure

```
decentralised-db/
├── app/                    # Next.js frontend
│   ├── components/        # React components
│   ├── providers.tsx      # Web3 providers setup
│   └── page.tsx           # Main page
├── smart-contracts/        # Hardhat smart contracts
│   ├── contracts/         # Solidity contracts
│   ├── scripts/           # Deployment scripts
│   └── test/              # Contract tests
└── public/                # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A wallet with Base Sepolia ETH (for testing)
- WalletConnect Project ID (get from [cloud.walletconnect.com](https://cloud.walletconnect.com))

### 1. Install Dependencies

#### Frontend
```bash
npm install
```

#### Smart Contracts
```bash
cd smart-contracts
npm install
```

### 2. Configure Environment Variables

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Update after deployment
```

#### Smart Contracts (.env)
```bash
PRIVATE_KEY=your_private_key_here
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key_here
```

### 3. Deploy Smart Contracts

```bash
cd smart-contracts

# Compile contracts
npm run compile

# Deploy to Base Sepolia (testnet)
npm run deploy:base-sepolia

# Or deploy to Base (mainnet)
npm run deploy:base
```

After deployment, copy the contract address and update `NEXT_PUBLIC_CONTRACT_ADDRESS` in the frontend `.env.local` file.

### 4. Run the Frontend

```bash
# From project root
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Smart Contract Features

### HealthcareDB Contract

- **createRecord**: Create a new encrypted patient record
- **grantAccess**: Grant another organization access to a record
- **revokeAccess**: Revoke access from an organization
- **updateRecord**: Update record data location and hash
- **hasAccess**: Check if an organization has access to a record
- **getRecordAccess**: Get all organizations with access to a record

## Frontend Features

- 🔌 Wallet connection via ConnectKit
- 📝 Create patient records
- 🔑 Grant/revoke access to organizations
- 📊 View record statistics
- 🌐 Base L2 network support

## Testing

```bash
cd smart-contracts
npm test
```

## Network Configuration

The project is configured for:
- **Base Mainnet** (Chain ID: 8453)
- **Base Sepolia** (Chain ID: 84532)

## Security Considerations

- Patient data is encrypted before storage
- Only encrypted data hashes are stored on-chain
- Access control is enforced at the smart contract level
- Organizations must be registered before accessing records

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
