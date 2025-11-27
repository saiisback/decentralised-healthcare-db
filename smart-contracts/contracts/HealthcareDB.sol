// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title HealthcareDB
 * @author Decentralized Healthcare Platform
 * @notice Decentralized Healthcare Database for secure, privacy-preserved cross-organization collaboration
 * @dev This contract stores encrypted healthcare records with granular access control
 *      Patient data is encrypted off-chain; only hashes and metadata are stored on-chain
 */
contract HealthcareDB is AccessControl, ReentrancyGuard, Pausable {
    // ============ Constants ============
    bytes32 public constant ORGANIZATION_ROLE = keccak256("ORGANIZATION_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Maximum string length to prevent gas issues
    uint256 public constant MAX_STRING_LENGTH = 256;
    
    // ============ Structs ============
    struct PatientRecord {
        bytes32 recordId;           // Unique record identifier
        address patientAddress;     // Patient's wallet address
        address createdBy;           // Organization that created the record
        uint256 timestamp;           // Creation timestamp
        uint256 lastUpdated;         // Last update timestamp
        string encryptedDataHash;    // Hash of encrypted data (stored off-chain)
        string dataLocation;         // IPFS or other storage location
        bool isActive;               // Record status
    }

    struct AccessGrant {
        address organization;       // Organization granted access
        uint256 grantedAt;          // Timestamp when access was granted
        uint256 revokedAt;          // Timestamp when access was revoked (0 if active)
        bool isRevoked;             // Access revocation status
    }

    // ============ State Variables ============
    // Mapping from recordId to PatientRecord
    mapping(bytes32 => PatientRecord) private _records;
    
    // Mapping from recordId to array of organizations with access
    mapping(bytes32 => AccessGrant[]) private _recordAccess;
    
    // Mapping from patient address to their record IDs
    mapping(address => bytes32[]) private _patientRecords;
    
    // Mapping from organization to all records they have access to
    mapping(address => bytes32[]) private _organizationRecords;
    
    // Mapping to check if organization has access (for gas optimization)
    mapping(bytes32 => mapping(address => bool)) private _hasAccessCache;
    
    // Track all record IDs
    bytes32[] private _allRecordIds;
    
    // Track registered organizations
    address[] private _registeredOrganizations;

    // ============ Events ============
    event RecordCreated(
        bytes32 indexed recordId,
        address indexed patientAddress,
        address indexed createdBy,
        uint256 timestamp,
        string encryptedDataHash,
        string dataLocation
    );

    event AccessGranted(
        bytes32 indexed recordId,
        address indexed organization,
        address indexed grantedBy,
        uint256 timestamp
    );

    event AccessRevoked(
        bytes32 indexed recordId,
        address indexed organization,
        address indexed revokedBy,
        uint256 timestamp
    );

    event RecordUpdated(
        bytes32 indexed recordId,
        address indexed updatedBy,
        uint256 timestamp,
        string newEncryptedDataHash,
        string newDataLocation
    );

    event OrganizationRegistered(
        address indexed organization,
        address indexed registeredBy
    );

    event RecordDeactivated(
        bytes32 indexed recordId,
        address indexed deactivatedBy,
        uint256 timestamp
    );

    // ============ Modifiers ============
    modifier validAddress(address _addr) {
        require(_addr != address(0), "HealthcareDB: Invalid address");
        _;
    }

    modifier validString(string memory _str, uint256 _maxLength) {
        require(bytes(_str).length > 0, "HealthcareDB: Empty string");
        require(bytes(_str).length <= _maxLength, "HealthcareDB: String too long");
        _;
    }

    modifier recordExists(bytes32 _recordId) {
        require(_records[_recordId].isActive, "HealthcareDB: Record does not exist or is inactive");
        _;
    }

    // ============ Constructor ============
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ============ Organization Management ============
    /**
     * @dev Register a new healthcare organization
     * @param organization Address of the organization to register
     * @notice Only admins can register organizations
     */
    function registerOrganization(address organization) 
        external 
        onlyRole(ADMIN_ROLE)
        validAddress(organization)
        whenNotPaused
    {
        require(!hasRole(ORGANIZATION_ROLE, organization), "HealthcareDB: Organization already registered");
        
        _grantRole(ORGANIZATION_ROLE, organization);
        _registeredOrganizations.push(organization);
        
        emit OrganizationRegistered(organization, msg.sender);
    }

    /**
     * @dev Batch register multiple organizations
     * @param organizations Array of organization addresses to register
     */
    function batchRegisterOrganizations(address[] calldata organizations)
        external
        onlyRole(ADMIN_ROLE)
        whenNotPaused
    {
        require(organizations.length > 0, "HealthcareDB: Empty array");
        require(organizations.length <= 50, "HealthcareDB: Too many organizations");
        
        for (uint256 i = 0; i < organizations.length; i++) {
            if (organizations[i] != address(0) && !hasRole(ORGANIZATION_ROLE, organizations[i])) {
                _grantRole(ORGANIZATION_ROLE, organizations[i]);
                _registeredOrganizations.push(organizations[i]);
                emit OrganizationRegistered(organizations[i], msg.sender);
            }
        }
    }

    // ============ Record Management ============
    /**
     * @dev Create a new patient record
     * @param patientAddress Address of the patient
     * @param encryptedDataHash Hash of the encrypted data (must be non-empty)
     * @param dataLocation Location where encrypted data is stored (IPFS, etc.)
     * @return recordId The unique identifier of the created record
     * @notice Only registered organizations can create records
     */
    function createRecord(
        address patientAddress,
        string calldata encryptedDataHash,
        string calldata dataLocation
    ) 
        external 
        onlyRole(ORGANIZATION_ROLE) 
        nonReentrant
        whenNotPaused
        validAddress(patientAddress)
        validString(encryptedDataHash, MAX_STRING_LENGTH)
        validString(dataLocation, MAX_STRING_LENGTH)
        returns (bytes32 recordId)
    {
        // Generate unique record ID using multiple entropy sources
        recordId = keccak256(
            abi.encodePacked(
                patientAddress,
                msg.sender,
                block.timestamp,
                block.prevrandao,
                block.number,
                _allRecordIds.length
            )
        );

        // Ensure record ID is unique (extremely unlikely collision, but check anyway)
        require(!_records[recordId].isActive, "HealthcareDB: Record ID collision");

        _records[recordId] = PatientRecord({
            recordId: recordId,
            patientAddress: patientAddress,
            createdBy: msg.sender,
            timestamp: block.timestamp,
            lastUpdated: block.timestamp,
            encryptedDataHash: encryptedDataHash,
            dataLocation: dataLocation,
            isActive: true
        });

        // Grant access to creator organization
        _recordAccess[recordId].push(AccessGrant({
            organization: msg.sender,
            grantedAt: block.timestamp,
            revokedAt: 0,
            isRevoked: false
        }));

        // Update access cache
        _hasAccessCache[recordId][msg.sender] = true;

        // Update mappings
        _patientRecords[patientAddress].push(recordId);
        _organizationRecords[msg.sender].push(recordId);
        _allRecordIds.push(recordId);

        emit RecordCreated(recordId, patientAddress, msg.sender, block.timestamp, encryptedDataHash, dataLocation);
    }

    /**
     * @dev Grant access to a record for another organization
     * @param recordId The record to grant access to
     * @param organization Address of the organization to grant access
     * @notice Only organizations with existing access can grant access to others
     */
    function grantAccess(bytes32 recordId, address organization)
        external
        onlyRole(ORGANIZATION_ROLE)
        nonReentrant
        whenNotPaused
        recordExists(recordId)
        validAddress(organization)
    {
        require(hasRole(ORGANIZATION_ROLE, organization), "HealthcareDB: Invalid organization");
        require(_hasAccess(recordId, msg.sender), "HealthcareDB: You don't have access to this record");
        require(!_hasAccess(recordId, organization), "HealthcareDB: Access already granted");

        _recordAccess[recordId].push(AccessGrant({
            organization: organization,
            grantedAt: block.timestamp,
            revokedAt: 0,
            isRevoked: false
        }));

        // Update access cache
        _hasAccessCache[recordId][organization] = true;

        _organizationRecords[organization].push(recordId);

        emit AccessGranted(recordId, organization, msg.sender, block.timestamp);
    }

    /**
     * @dev Revoke access to a record for an organization
     * @param recordId The record to revoke access from
     * @param organization Address of the organization to revoke access
     * @notice Only organizations with access can revoke access (cannot revoke own access)
     */
    function revokeAccess(bytes32 recordId, address organization)
        external
        onlyRole(ORGANIZATION_ROLE)
        nonReentrant
        whenNotPaused
        recordExists(recordId)
        validAddress(organization)
    {
        require(_hasAccess(recordId, msg.sender), "HealthcareDB: You don't have access to this record");
        require(organization != msg.sender, "HealthcareDB: Cannot revoke own access");
        require(_hasAccess(recordId, organization), "HealthcareDB: Organization does not have access");

        // Find and revoke access
        for (uint256 i = 0; i < _recordAccess[recordId].length; i++) {
            if (_recordAccess[recordId][i].organization == organization && !_recordAccess[recordId][i].isRevoked) {
                _recordAccess[recordId][i].isRevoked = true;
                _recordAccess[recordId][i].revokedAt = block.timestamp;
                
                // Update access cache
                _hasAccessCache[recordId][organization] = false;
                
                emit AccessRevoked(recordId, organization, msg.sender, block.timestamp);
                return;
            }
        }
        
        revert("HealthcareDB: Access not found");
    }

    /**
     * @dev Update a record's data location and hash
     * @param recordId The record to update
     * @param encryptedDataHash New hash of the encrypted data
     * @param dataLocation New location where encrypted data is stored
     * @notice Only organizations with access can update records
     */
    function updateRecord(
        bytes32 recordId,
        string calldata encryptedDataHash,
        string calldata dataLocation
    )
        external
        onlyRole(ORGANIZATION_ROLE)
        nonReentrant
        whenNotPaused
        recordExists(recordId)
        validString(encryptedDataHash, MAX_STRING_LENGTH)
        validString(dataLocation, MAX_STRING_LENGTH)
    {
        require(_hasAccess(recordId, msg.sender), "HealthcareDB: You don't have access to this record");

        _records[recordId].encryptedDataHash = encryptedDataHash;
        _records[recordId].dataLocation = dataLocation;
        _records[recordId].lastUpdated = block.timestamp;

        emit RecordUpdated(recordId, msg.sender, block.timestamp, encryptedDataHash, dataLocation);
    }

    /**
     * @dev Deactivate a record (soft delete)
     * @param recordId The record to deactivate
     * @notice Only the creator or admin can deactivate a record
     */
    function deactivateRecord(bytes32 recordId)
        external
        nonReentrant
        whenNotPaused
        recordExists(recordId)
    {
        require(
            _records[recordId].createdBy == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "HealthcareDB: Only creator or admin can deactivate"
        );

        _records[recordId].isActive = false;

        emit RecordDeactivated(recordId, msg.sender, block.timestamp);
    }

    // ============ View Functions ============
    /**
     * @dev Get a patient record by ID
     * @param recordId The record ID to query
     * @return record The patient record
     */
    function getRecord(bytes32 recordId)
        external
        view
        returns (PatientRecord memory record)
    {
        return _records[recordId];
    }

    /**
     * @dev Check if an organization has access to a record
     * @param recordId The record to check
     * @param organization Address of the organization
     * @return true if organization has access
     */
    function hasAccess(bytes32 recordId, address organization)
        external
        view
        returns (bool)
    {
        return _hasAccess(recordId, organization);
    }

    /**
     * @dev Internal function to check access (uses cache for gas optimization)
     */
    function _hasAccess(bytes32 recordId, address organization)
        internal
        view
        returns (bool)
    {
        if (!_records[recordId].isActive) return false;
        if (!_hasAccessCache[recordId][organization]) return false;
        
        // Verify in access list (cache might be stale)
        for (uint256 i = 0; i < _recordAccess[recordId].length; i++) {
            if (_recordAccess[recordId][i].organization == organization &&
                !_recordAccess[recordId][i].isRevoked) {
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
        for (uint256 i = 0; i < _recordAccess[recordId].length; i++) {
            if (!_recordAccess[recordId][i].isRevoked) {
                activeCount++;
            }
        }

        organizations = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < _recordAccess[recordId].length; i++) {
            if (!_recordAccess[recordId][i].isRevoked) {
                organizations[index] = _recordAccess[recordId][i].organization;
                index++;
            }
        }
    }

    /**
     * @dev Get all record IDs for a patient
     * @param patientAddress Address of the patient
     * @return recordIds Array of record IDs
     */
    function getPatientRecords(address patientAddress)
        external
        view
        returns (bytes32[] memory recordIds)
    {
        return _patientRecords[patientAddress];
    }

    /**
     * @dev Get all record IDs for an organization
     * @param organization Address of the organization
     * @return recordIds Array of record IDs
     */
    function getOrganizationRecords(address organization)
        external
        view
        returns (bytes32[] memory recordIds)
    {
        return _organizationRecords[organization];
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
        return _patientRecords[patientAddress].length;
    }

    /**
     * @dev Get total number of records
     * @return count Total number of records
     */
    function getTotalRecordCount() external view returns (uint256 count) {
        return _allRecordIds.length;
    }

    /**
     * @dev Get total number of registered organizations
     * @return count Total number of organizations
     */
    function getOrganizationCount() external view returns (uint256 count) {
        return _registeredOrganizations.length;
    }

    /**
     * @dev Get all registered organizations
     * @return organizations Array of organization addresses
     */
    function getAllOrganizations() external view returns (address[] memory organizations) {
        return _registeredOrganizations;
    }

    // ============ Admin Functions ============
    /**
     * @dev Pause the contract (emergency stop)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
