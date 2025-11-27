import { expect } from "chai";
import { ethers } from "hardhat";
import { HealthcareDB } from "../typechain-types";

describe("HealthcareDB", function () {
  let healthcareDB: HealthcareDB;
  let owner: any;
  let org1: any;
  let org2: any;
  let patient: any;

  beforeEach(async function () {
    [owner, org1, org2, patient] = await ethers.getSigners();

    const HealthcareDBFactory = await ethers.getContractFactory("HealthcareDB");
    healthcareDB = await HealthcareDBFactory.deploy();
    await healthcareDB.waitForDeployment();

    // Register organizations
    await healthcareDB.registerOrganization(org1.address);
    await healthcareDB.registerOrganization(org2.address);
  });

  describe("Organization Registration", function () {
    it("Should register organizations", async function () {
      expect(await healthcareDB.hasRole(await healthcareDB.ORGANIZATION_ROLE(), org1.address)).to.be.true;
      expect(await healthcareDB.hasRole(await healthcareDB.ORGANIZATION_ROLE(), org2.address)).to.be.true;
    });
  });

  describe("Record Creation", function () {
    it("Should create a patient record", async function () {
      const encryptedDataHash = "QmHash123";
      const dataLocation = "ipfs://QmHash123";

      const tx = await healthcareDB.connect(org1).createRecord(
        patient.address,
        encryptedDataHash,
        dataLocation
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("RecordCreated(bytes32,address,address,uint256)")
      );

      expect(event).to.not.be.undefined;

      const recordCount = await healthcareDB.getPatientRecordCount(patient.address);
      expect(recordCount).to.equal(1);
    });

    it("Should fail with invalid patient address", async function () {
      await expect(
        healthcareDB.connect(org1).createRecord(
          ethers.ZeroAddress,
          "hash",
          "location"
        )
      ).to.be.revertedWith("Invalid patient address");
    });
  });

  describe("Access Control", function () {
    let recordId: string;

    beforeEach(async function () {
      const tx = await healthcareDB.connect(org1).createRecord(
        patient.address,
        "hash123",
        "ipfs://hash123"
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("RecordCreated(bytes32,address,address,uint256)")
      );
      if (event) {
        recordId = event.topics[1];
      }
    });

    it("Should grant access to another organization", async function () {
      await healthcareDB.connect(org1).grantAccess(recordId, org2.address);
      
      const hasAccess = await healthcareDB.hasAccess(recordId, org2.address);
      expect(hasAccess).to.be.true;
    });

    it("Should check access correctly", async function () {
      expect(await healthcareDB.hasAccess(recordId, org1.address)).to.be.true;
      expect(await healthcareDB.hasAccess(recordId, org2.address)).to.be.false;
    });
  });
});

