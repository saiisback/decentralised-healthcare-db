# Decentralized Healthcare Database

A blockchain-based platform for secure, privacy-preserved cross-organization healthcare collaboration built on Base L2.

## Features

- 🔒 **Encrypted Storage**: Patient data is encrypted and stored off-chain (IPFS), with hashes stored on-chain
- 🏥 **Cross-Organization Collaboration**: Secure access control for healthcare organizations
- 🔐 **Access Control**: Granular permissions for record access and sharing
- 📊 **Audit Trail**: All access grants and revocations are logged on-chain
- ⚡ **Base L2**: Low-cost transactions on Base Layer 2
- 🛡️ **Security First**: Reentrancy protection, input validation, and emergency pause functionality

## Project Structure

```
decentralised-db/
├── app/                    # Next.js frontend
│   ├── components/        # React components
│   │   ├── HealthcareDB.tsx
│   │   └── ConnectWallet.tsx
│   ├── lib/              # Utilities and contract config
│   │   └── contract.ts  # Contract ABI and address validation
│   ├── providers.tsx     # Web3 providers setup
│   └── page.tsx          # Main page
├── smart-contracts/       # Solidity contracts (deploy via Remix)
│   ├── contracts/        # Solidity contracts
│   │   └── HealthcareDB.sol
│   └── README.md         # Remix deployment guide
└── public/               # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Base Sepolia ETH (for testing) - Get from [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- WalletConnect Project ID (get from [cloud.walletconnect.com](https://cloud.walletconnect.com))

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Update after deployment
```

### 3. Deploy Smart Contracts via Remix IDE

**See detailed instructions in [smart-contracts/README.md](./smart-contracts/README.md)**

Quick steps:
1. Open [Remix IDE](https://remix.ethereum.org)
2. Create `contracts/HealthcareDB.sol` and paste the contract code
3. Compile with Solidity 0.8.24
4. Deploy to Base Sepolia (testnet) or Base (mainnet)
5. Copy the deployed contract address
6. Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`

### 4. Run the Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Smart Contract Features

### HealthcareDB Contract

**Record Management:**
- `createRecord`: Create a new encrypted patient record
- `updateRecord`: Update record data location and hash
- `deactivateRecord`: Soft delete a record (creator or admin only)

**Access Control:**
- `grantAccess`: Grant another organization access to a record
- `revokeAccess`: Revoke access from an organization
- `hasAccess`: Check if an organization has access to a record
- `getRecordAccess`: Get all organizations with access to a record

**View Functions:**
- `getRecord`: Get complete record details
- `getPatientRecords`: Get all records for a patient
- `getOrganizationRecords`: Get all records accessible by an organization
- `getTotalRecordCount`: Get total number of records

**Admin Functions:**
- `registerOrganization`: Register a new healthcare organization
- `batchRegisterOrganizations`: Register multiple organizations at once
- `pause`/`unpause`: Emergency stop functionality

## Frontend Features

- 🔌 **Wallet Connection**: ConnectKit integration for seamless wallet connection
- 📝 **Record Management**: Create, view, and manage patient records
- 🔑 **Access Control**: Grant and revoke access to organizations
- 📊 **Statistics**: View total records and your record count
- ✅ **Input Validation**: Comprehensive validation for addresses and record IDs
- 🎨 **Modern UI**: Beautiful, responsive interface with dark mode support
- ⚠️ **Error Handling**: Clear error messages and transaction status
- 🌐 **Network Detection**: Automatic network validation (Base/Base Sepolia)

## Security Features

### Smart Contract Security
- ✅ **Reentrancy Protection**: All state-changing functions protected
- ✅ **Access Control**: Role-based permissions (Admin, Organization)
- ✅ **Input Validation**: Comprehensive validation of all inputs
- ✅ **Pausable**: Emergency stop functionality
- ✅ **Gas Optimization**: Efficient storage and access patterns
- ✅ **Event Logging**: Complete audit trail

### Frontend Security
- ✅ **Address Validation**: All addresses validated before submission
- ✅ **Record ID Validation**: Proper format validation for record IDs
- ✅ **Network Validation**: Ensures correct network before transactions
- ✅ **Error Handling**: Secure error messages without exposing sensitive data

## Network Configuration

The project is configured for:
- **Base Mainnet** (Chain ID: 8453)
  - RPC: https://mainnet.base.org
  - Explorer: https://basescan.org
- **Base Sepolia** (Chain ID: 84532) - Testnet
  - RPC: https://sepolia.base.org
  - Explorer: https://sepolia.basescan.org
  - Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## Usage Guide

### For Healthcare Organizations

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection
2. **Ensure Network**: Make sure you're on Base or Base Sepolia network
3. **Create Records**: 
   - Enter patient address
   - Provide encrypted data hash
   - Specify data location (e.g., IPFS hash)
   - Click "Create Record"
4. **Grant Access**: 
   - Enter record ID
   - Enter organization address to grant access
   - Click "Grant Access"
5. **View Records**: Enter a record ID and click "View" to see record details

### For Administrators

After contract deployment, register organizations:
- Use Remix IDE to call `registerOrganization(address)` for each organization
- Or use `batchRegisterOrganizations(address[])` for multiple organizations

## Development

### Code Quality

- **TypeScript**: Full type safety throughout
- **ESLint**: Code linting and formatting
- **Best Practices**: Following Solidity and React best practices
- **Security**: Comprehensive security measures at both contract and frontend levels

### Project Structure

- **Separation of Concerns**: Clear separation between UI, logic, and contract interaction
- **Reusable Components**: Modular component architecture
- **Type Safety**: Strong typing for contract interactions
- **Error Handling**: Comprehensive error handling and user feedback

## Security Considerations

- 🔐 Patient data is encrypted before storage (off-chain)
- 🔐 Only encrypted data hashes are stored on-chain
- 🔐 Access control is enforced at the smart contract level
- 🔐 Organizations must be registered before accessing records
- 🔐 All transactions require proper authorization
- 🔐 Input validation prevents invalid data submission

## Troubleshooting

### Contract Not Configured
- Ensure `NEXT_PUBLIC_CONTRACT_ADDRESS` is set in `.env.local`
- Verify the address is a valid Ethereum address
- Make sure the contract is deployed on the correct network

### Wrong Network
- Switch your wallet to Base (8453) or Base Sepolia (84532)
- The app will automatically detect and warn if on wrong network

### Transaction Failures
- Ensure you have enough ETH for gas fees
- Verify you have proper permissions (organization role)
- Check that all input fields are valid
- Review error messages for specific issues

## License

MIT

## Support

For issues and questions:
- Check the [smart-contracts README](./smart-contracts/README.md) for deployment help
- Review contract code comments for function details
- Consult [Base documentation](https://docs.base.org) for network information
