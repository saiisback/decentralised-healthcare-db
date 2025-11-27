# Deployment Checklist

## Pre-Deployment

- [ ] Install frontend dependencies: `npm install`
- [ ] Get WalletConnect Project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com)
- [ ] Create `.env.local` file with `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- [ ] Ensure you have Base Sepolia ETH for testnet deployment (get from [faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))

## Smart Contract Deployment (Remix IDE)

- [ ] Open [Remix IDE](https://remix.ethereum.org)
- [ ] Create new file: `contracts/HealthcareDB.sol`
- [ ] Copy contract code from `smart-contracts/contracts/HealthcareDB.sol`
- [ ] Install OpenZeppelin contracts (Remix will auto-detect)
- [ ] Compile contract with Solidity 0.8.24
- [ ] Switch MetaMask to Base Sepolia (Chain ID: 84532) or Base (Chain ID: 8453)
- [ ] Deploy contract via Remix
- [ ] Copy deployed contract address
- [ ] (Optional) Verify contract on BaseScan
- [ ] Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`

## Post-Deployment

- [ ] Register initial organizations using `registerOrganization(address)` in Remix
- [ ] Test contract functions in Remix
- [ ] Start frontend: `npm run dev`
- [ ] Test wallet connection
- [ ] Test creating a record
- [ ] Test granting access
- [ ] Test viewing records

## Security Checklist

- [ ] Contract is verified on BaseScan
- [ ] Only trusted addresses are registered as organizations
- [ ] Admin private keys are secured
- [ ] Frontend contract address is correctly configured
- [ ] Network validation is working (Base/Base Sepolia only)
- [ ] Input validation is working on frontend

## Production Checklist

- [ ] Deploy to Base Mainnet (not testnet)
- [ ] Verify contract on BaseScan
- [ ] Register all production organizations
- [ ] Test all functions on mainnet
- [ ] Monitor gas costs
- [ ] Set up monitoring/alerts
- [ ] Document all registered organizations
- [ ] Backup admin keys securely

