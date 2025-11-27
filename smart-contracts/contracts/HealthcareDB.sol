// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HealthcareDB
 * @dev Decentralized Healthcare Database for secure, privacy-preserved cross-organization collaboration
 * @notice This contract stores encrypted healthcare records with access control
 */
contract HealthcareDB is AccessControl, ReentrancyGuard {
    bytes32 public constant ORGANIZATION_ROLE = keccak256("ORGANIZATION_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct PatientRecord {
        bytes32 recordId;           // Unique record identifier
        address patientAddress;      // Patient's wallet address
        address createdBy;           // Organization that created the record
        uint256 timestamp;           // Creation timestamp
        string encryptedDataHash;    // Hash of encrypted data (stored off-chain)
        string dataLocation;          // IPFS or other storage location
        bool isActive;                // Record status
    }

    struct AccessGrant {
        address organization;        // Organization granted access
        uint256 grantedAt;           // Timestamp when access was granted
        bool isRevoked;              // Access revocation status
    }

    // Mapping from recordId to PatientRecord
    mapping(bytes32 => PatientRecord) public records;
    
    // Mapping from recordId to array of organizations with access
    mapping(bytes32 => AccessGrant[]) public recordAccess;
    
    // Mapping from patient address to their record IDs
    mapping(address => bytes32[]) public patientRecords;
    
    // Mapping from organization to all records they have access to
    mapping(address => bytes32[]) public organizationRecords;
    
    // Track all record IDs
    bytes32[] public allRecordIds;

    // Events
    event RecordCreated(
        bytes32 indexed recordId,
        address indexed patientAddress,
        address indexed createdBy,
        uint256 timestamp
    );

    event AccessGranted(
        bytes32 indexed recordId,
        address indexed organization,
        address indexed grantedBy
    );

    event AccessRevoked(
        bytes32 indexed recordId,
        address indexed organization,
        address indexed revokedBy
    );

    event RecordUpdated(
        bytes32 indexed recordId,
        address indexed updatedBy,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Register a new healthcare organization
     * @param organization Address of the organization to register
     */
    function registerOrganization(address organization) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _grantRole(ORGANIZATION_ROLE, organization);
    }

    /**
     * @dev Create a new patient record
     * @param patientAddress Address of the patient
     * @param encryptedDataHash Hash of the encrypted data
     * @param dataLocation Location where encrypted data is stored (IPFS, etc.)
     * @return recordId The unique identifier of the created record
     */
    function createRecord(
        address patientAddress,
        string memory encryptedDataHash,
        string memory dataLocation
    ) 
        external 
        onlyRole(ORGANIZATION_ROLE) 
        nonReentrant
        returns (bytes32 recordId)
    {
        require(patientAddress != address(0), "Invalid patient address");
        require(bytes(encryptedDataHash).length > 0, "Data hash required");

        recordId = keccak256(
            abi.encodePacked(
                patientAddress,
                msg.sender,
                block.timestamp,
                block.prevrandao
            )
        );

        records[recordId] = PatientRecord({
            recordId: recordId,
            patientAddress: patientAddress,
            createdBy: msg.sender,
            timestamp: block.timestamp,
            encryptedDataHash: encryptedDataHash,
            dataLocation: dataLocation,
            isActive: true
        });

        // Grant access to creator organization
        recordAccess[recordId].push(AccessGrant({
            organization: msg.sender,
            grantedAt: block.timestamp,
            isRevoked: false
        }));

        patientRecords[patientAddress].push(recordId);
        organizationRecords[msg.sender].push(recordId);
        allRecordIds.push(recordId);

        emit RecordCreated(recordId, patientAddress, msg.sender, block.timestamp);
    }

    /**
     * @dev Grant access to a record for another organization
     * @param recordId The record to grant access to
     * @param organization Address of the organization to grant access
     */
    function grantAccess(bytes32 recordId, address organization)
        external
        onlyRole(ORGANIZATION_ROLE)
        nonReentrant
    {
        require(records[recordId].isActive, "Record does not exist or is inactive");
        require(hasRole(ORGANIZATION_ROLE, organization), "Invalid organization");
        require(hasAccess(recordId, msg.sender), "You don't have access to this record");

        // Check if access already granted
        bool alreadyGranted = false;
        for (uint i = 0; i < recordAccess[recordId].length; i++) {
            if (recordAccess[recordId][i].organization == organization && 
                !recordAccess[recordId][i].isRevoked) {
                alreadyGranted = true;
                break;
            }
        }

        require(!alreadyGranted, "Access already granted");

        recordAccess[recordId].push(AccessGrant({
            organization: organization,
            grantedAt: block.timestamp,
            isRevoked: false
        }));

        organizationRecords[organization].push(recordId);

        emit AccessGranted(recordId, organization, msg.sender);
    }

    /**
     * @dev Revoke access to a record for an organization
     * @param recordId The record to revoke access from
     * @param organization Address of the organization to revoke access
     */
    function revokeAccess(bytes32 recordId, address organization)
        external
        onlyRole(ORGANIZATION_ROLE)
        nonReentrant
    {
        require(records[recordId].isActive, "Record does not exist or is inactive");
        require(hasAccess(recordId, msg.sender), "You don't have access to this record");

        for (uint i = 0; i < recordAccess[recordId].length; i++) {
            if (recordAccess[recordId][i].organization == organization) {
                recordAccess[recordId][i].isRevoked = true;
                emit AccessRevoked(recordId, organization, msg.sender);
                break;
            }
        }
    }

    /**
     * @dev Update a record's data location and hash
     * @param recordId The record to update
     * @param encryptedDataHash New hash of the encrypted data
     * @param dataLocation New location where encrypted data is stored
     */
    function updateRecord(
        bytes32 recordId,
        string memory encryptedDataHash,
        string memory dataLocation
    )
        external
        onlyRole(ORGANIZATION_ROLE)
        nonReentrant
    {
        require(records[recordId].isActive, "Record does not exist or is inactive");
        require(hasAccess(recordId, msg.sender), "You don't have access to this record");

        records[recordId].encryptedDataHash = encryptedDataHash;
        records[recordId].dataLocation = dataLocation;

        emit RecordUpdated(recordId, msg.sender, block.timestamp);
    }

    /**
     * @dev Check if an organization has access to a record
     * @param recordId The record to check
     * @param organization Address of the organization
     * @return true if organization has access
     */
    function hasAccess(bytes32 recordId, address organization)
        public
        view
        returns (bool)
    {
        if (!records[recordId].isActive) return false;
        
        for (uint i = 0; i < recordAccess[recordId].length; i++) {
            if (recordAccess[recordId][i].organization == organization &&
                !recordAccess[recordId][i].isRevoked) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get all organizations with access to a record
     * @param recordId The record to query
     * @return organizations Array of organization addresses
     */
    function getRecordAccess(bytes32 recordId)
        external
        view
        returns (address[] memory organizations)
    {
        uint256 activeCount = 0;
        for (uint i = 0; i < recordAccess[recordId].length; i++) {
            if (!recordAccess[recordId][i].isRevoked) {
                activeCount++;
            }
        }

        organizations = new address[](activeCount);
        uint256 index = 0;
        for (uint i = 0; i < recordAccess[recordId].length; i++) {
            if (!recordAccess[recordId][i].isRevoked) {
                organizations[index] = recordAccess[recordId][i].organization;
                index++;
            }
        }
    }

    /**
     * @dev Get a patient's record count
     * @param patientAddress Address of the patient
     * @return count Number of records
     */
    function getPatientRecordCount(address patientAddress)
        external
        view
        returns (uint256 count)
    {
        return patientRecords[patientAddress].length;
    }

    /**
     * @dev Get total number of records
     * @return count Total number of records
     */
    function getTotalRecordCount() external view returns (uint256 count) {
        return allRecordIds.length;
    }
}

