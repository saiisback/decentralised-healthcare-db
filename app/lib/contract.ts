import { isAddress } from "viem";

/**
 * Contract configuration and utilities
 */

// Contract ABI - Complete ABI for HealthcareDB contract
export const HEALTHCARE_DB_ABI = [
  {
    inputs: [
      { name: "patientAddress", type: "address" },
      { name: "encryptedDataHash", type: "string" },
      { name: "dataLocation", type: "string" },
    ],
    name: "createRecord",
    outputs: [{ name: "recordId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "recordId", type: "bytes32" },
      { name: "organization", type: "address" },
    ],
    name: "grantAccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "recordId", type: "bytes32" },
      { name: "organization", type: "address" },
    ],
    name: "revokeAccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "recordId", type: "bytes32" },
      { name: "encryptedDataHash", type: "string" },
      { name: "dataLocation", type: "string" },
    ],
    name: "updateRecord",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "recordId", type: "bytes32" }],
    name: "getRecord",
    outputs: [
      {
        components: [
          { name: "recordId", type: "bytes32" },
          { name: "patientAddress", type: "address" },
          { name: "createdBy", type: "address" },
          { name: "timestamp", type: "uint256" },
          { name: "lastUpdated", type: "uint256" },
          { name: "encryptedDataHash", type: "string" },
          { name: "dataLocation", type: "string" },
          { name: "isActive", type: "bool" },
        ],
        name: "record",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "recordId", type: "bytes32" },
      { name: "organization", type: "address" },
    ],
    name: "hasAccess",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "recordId", type: "bytes32" }],
    name: "getRecordAccess",
    outputs: [{ name: "organizations", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "patientAddress", type: "address" }],
    name: "getPatientRecords",
    outputs: [{ name: "recordIds", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "patientAddress", type: "address" }],
    name: "getPatientRecordCount",
    outputs: [{ name: "count", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalRecordCount",
    outputs: [{ name: "count", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "organization", type: "address" }],
    name: "getOrganizationRecords",
    outputs: [{ name: "recordIds", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Get contract address from environment or return null
 * Validates that the address is a valid Ethereum address
 */
export function getContractAddress(): `0x${string}` | null {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  
  if (!address) {
    return null;
  }

  // Validate address format
  if (!isAddress(address)) {
    console.error("Invalid contract address format:", address);
    return null;
  }

  return address as `0x${string}`;
}

/**
 * Validate Ethereum address format
 */
export function validateAddress(address: string): boolean {
  if (!address || address.trim().length === 0) {
    return false;
  }
  
  try {
    return isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Validate bytes32 format (record ID)
 */
export function validateRecordId(recordId: string): boolean {
  if (!recordId || recordId.trim().length === 0) {
    return false;
  }
  
  // Check if it's a valid hex string
  const hexPattern = /^0x[a-fA-F0-9]{64}$/;
  return hexPattern.test(recordId);
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format record ID for display
 */
export function formatRecordId(recordId: string): string {
  if (!recordId || recordId.length < 10) return recordId;
  return `${recordId.slice(0, 10)}...${recordId.slice(-8)}`;
}

