import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const HealthcareDB = await ethers.getContractFactory("HealthcareDB");
  const healthcareDB = await HealthcareDB.deploy();

  await healthcareDB.waitForDeployment();

  const address = await healthcareDB.getAddress();
  console.log("HealthcareDB deployed to:", address);

  // Save deployment info
  console.log("\n=== Deployment Information ===");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Contract Address:", address);
  console.log("Deployer:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

