# Healthcare Database Smart Contracts

Decentralized Healthcare Database Smart Contracts for Base L2 deployment via Remix IDE.

## Contract Overview

The `HealthcareDB` contract provides:
- **Secure Record Storage**: Encrypted patient records with off-chain data storage
- **Access Control**: Granular permissions for cross-organization collaboration
- **Audit Trail**: Complete on-chain logging of all access grants and revocations
- **Emergency Controls**: Pausable functionality for emergency situations

## Deployment via Remix IDE

### Prerequisites

1. **OpenZeppelin Contracts**: The contract uses OpenZeppelin's AccessControl, ReentrancyGuard, and Pausable contracts
2. **Remix IDE**: Access at [remix.ethereum.org](https://remix.ethereum.org)
3. **Base Network**: Ensure you have Base Sepolia (testnet) or Base (mainnet) configured in your wallet

### Step-by-Step Deployment

#### 1. Open Remix IDE

Navigate to [remix.ethereum.org](https://remix.ethereum.org)

#### 2. Install OpenZeppelin Contracts

1. In Remix, go to the **File Explorer** tab
2. Create a new file: `contracts/HealthcareDB.sol`
3. Copy the contract code from `contracts/HealthcareDB.sol`
4. Remix will automatically detect and install OpenZeppelin contracts via npm

Alternatively, you can manually install:
- Go to **File Explorer** → **contracts** folder
- Right-click → **New File** → Name it `@openzeppelin/contracts`
- Or use Remix's npm import feature

#### 3. Compile the Contract

1. Go to the **Solidity Compiler** tab
2. Select compiler version: **0.8.24** (or compatible)
3. Click **Compile HealthcareDB.sol**
4. Ensure compilation is successful (no errors)

#### 4. Deploy to Base Network

1. Go to the **Deploy & Run Transactions** tab
2. Select **Injected Provider - MetaMask** (or your wallet provider)
3. **Switch your wallet to Base Sepolia** (for testnet) or Base (for mainnet)
   - Base Sepolia Chain ID: 84532
   - Base Mainnet Chain ID: 8453
4. Ensure you have enough ETH for gas fees
5. Select **HealthcareDB** from the contract dropdown
6. Click **Deploy**
7. Confirm the transaction in your wallet
8. Wait for deployment confirmation

#### 5. Verify Contract (Optional but Recommended)

1. Copy the deployed contract address
2. Go to [BaseScan](https://basescan.org) (mainnet) or [BaseScan Sepolia](https://sepolia.basescan.org) (testnet)
3. Navigate to your contract address
4. Click **Contract** → **Verify and Publish**
5. Enter:
   - Compiler version: 0.8.24
   - License: MIT
   - Optimization: Yes, 200 runs
   - Paste your contract code
6. Click **Verify and Publish**

#### 6. Update Frontend Configuration

After deployment, update your frontend `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

#### 7. Register Organizations

After deployment, you need to register organizations:

1. In Remix, go to **Deploy & Run Transactions**
2. Connect to your deployed contract (paste the address in "At Address")
3. Call `registerOrganization(address)` function with organization addresses
4. Or use the frontend (if admin functions are exposed)

## Contract Functions

### Admin Functions
- `registerOrganization(address)`: Register a new healthcare organization
- `batchRegisterOrganizations(address[])`: Register multiple organizations at once
- `pause()`: Pause the contract (emergency)
- `unpause()`: Unpause the contract

### Record Management
- `createRecord(address, string, string)`: Create a new patient record
- `updateRecord(bytes32, string, string)`: Update record data
- `deactivateRecord(bytes32)`: Soft delete a record

### Access Control
- `grantAccess(bytes32, address)`: Grant access to an organization
- `revokeAccess(bytes32, address)`: Revoke access from an organization

### View Functions
- `getRecord(bytes32)`: Get record details
- `hasAccess(bytes32, address)`: Check if organization has access
- `getRecordAccess(bytes32)`: Get all organizations with access
- `getPatientRecords(address)`: Get all records for a patient
- `getTotalRecordCount()`: Get total number of records

## Security Features

- ✅ **Reentrancy Protection**: All state-changing functions are protected
- ✅ **Access Control**: Role-based permissions (Admin, Organization)
- ✅ **Input Validation**: Comprehensive validation of all inputs
- ✅ **Pausable**: Emergency stop functionality
- ✅ **Gas Optimization**: Efficient storage and access patterns
- ✅ **Event Logging**: Complete audit trail

## Network Configuration

### Base Sepolia (Testnet)
- Chain ID: 84532
- RPC URL: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### Base (Mainnet)
- Chain ID: 8453
- RPC URL: https://mainnet.base.org
- Explorer: https://basescan.org

## Important Notes

1. **Gas Costs**: Base L2 has significantly lower gas costs than Ethereum mainnet
2. **Contract Verification**: Always verify your contract for transparency
3. **Private Keys**: Never share your private keys or deploy from a compromised wallet
4. **Testing**: Test thoroughly on Base Sepolia before deploying to mainnet
5. **Organization Registration**: Only registered organizations can create records

## Support

For issues or questions:
- Check the contract code comments
- Review OpenZeppelin documentation
- Consult Base network documentation
