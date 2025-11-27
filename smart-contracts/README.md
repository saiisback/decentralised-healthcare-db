# Healthcare Database Smart Contracts

Decentralized Healthcare Database Smart Contracts deployed on Base L2.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `smart-contracts` directory:
```
PRIVATE_KEY=your_private_key_here
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key_here
```

## Compile

```bash
npm run compile
```

## Deploy

### Deploy to Base Sepolia (Testnet)
```bash
npm run deploy:base-sepolia
```

### Deploy to Base (Mainnet)
```bash
npm run deploy:base
```

After deployment, copy the contract address and update `NEXT_PUBLIC_CONTRACT_ADDRESS` in the frontend `.env.local` file.

## Contract Features

- **Patient Record Creation**: Organizations can create encrypted patient records
- **Access Control**: Granular access control for cross-organization collaboration
- **Privacy-Preserved**: Encrypted data stored off-chain, hashes stored on-chain
- **Audit Trail**: All access grants and revocations are logged on-chain

## Contract Address

Update this after deployment:
- Base Sepolia: `0x...`
- Base Mainnet: `0x...`

