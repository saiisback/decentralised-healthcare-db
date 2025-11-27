"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useChainId 
} from "wagmi";
import { ConnectWallet } from "./ConnectWallet";
import { 
  getContractAddress, 
  validateAddress, 
  validateRecordId,
  formatAddress,
  formatRecordId,
  HEALTHCARE_DB_ABI 
} from "../lib/contract";
import { isAddress } from "viem";

interface PatientRecord {
  recordId: `0x${string}`;
  patientAddress: `0x${string}`;
  createdBy: `0x${string}`;
  timestamp: bigint;
  lastUpdated: bigint;
  encryptedDataHash: string;
  dataLocation: string;
  isActive: boolean;
}

export function HealthcareDB() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contractAddress = getContractAddress();

  // Form states
  const [patientAddress, setPatientAddress] = useState("");
  const [dataHash, setDataHash] = useState("");
  const [dataLocation, setDataLocation] = useState("");
  const [grantRecordId, setGrantRecordId] = useState("");
  const [grantOrgAddress, setGrantOrgAddress] = useState("");
  const [revokeRecordId, setRevokeRecordId] = useState("");
  const [revokeOrgAddress, setRevokeOrgAddress] = useState("");
  const [viewRecordId, setViewRecordId] = useState("");

  // Error states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Validate contract address
  const isContractConfigured = contractAddress !== null;
  const isBaseNetwork = chainId === 8453 || chainId === 84532; // Base mainnet or Sepolia

  // Read contract data
  const { data: totalRecords, refetch: refetchTotal } = useReadContract({
    address: contractAddress!,
    abi: HEALTHCARE_DB_ABI,
    functionName: "getTotalRecordCount",
    query: { enabled: isContractConfigured && isConnected },
  });

  const { data: patientRecordCount, refetch: refetchPatient } = useReadContract({
    address: contractAddress!,
    abi: HEALTHCARE_DB_ABI,
    functionName: "getPatientRecordCount",
    args: address ? [address] : undefined,
    query: { enabled: isContractConfigured && isConnected && !!address },
  });

  const { data: recordData, refetch: refetchRecord } = useReadContract({
    address: contractAddress!,
    abi: HEALTHCARE_DB_ABI,
    functionName: "getRecord",
    args: viewRecordId && validateRecordId(viewRecordId) ? [viewRecordId as `0x${string}`] : undefined,
    query: { enabled: isContractConfigured && isConnected && validateRecordId(viewRecordId) },
  });

  // Write contract hooks
  const { writeContract: createRecord, isPending: isCreating, error: createError } = useWriteContract();
  const { writeContract: grantAccess, isPending: isGranting, error: grantError } = useWriteContract();
  const { writeContract: revokeAccess, isPending: isRevoking, error: revokeError } = useWriteContract();

  const { data: createHash, isLoading: isCreatingConfirming } = useWaitForTransactionReceipt({
    hash: createRecord as `0x${string}`,
  });

  const { data: grantHash, isLoading: isGrantingConfirming } = useWaitForTransactionReceipt({
    hash: grantAccess as `0x${string}`,
  });

  const { data: revokeHash, isLoading: isRevokingConfirming } = useWaitForTransactionReceipt({
    hash: revokeAccess as `0x${string}`,
  });

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Refetch data after successful transactions
  useEffect(() => {
    if (createHash || grantHash || revokeHash) {
      refetchTotal();
      refetchPatient();
      setSuccessMessage("Transaction successful!");
      // Clear form
      setPatientAddress("");
      setDataHash("");
      setDataLocation("");
      setGrantRecordId("");
      setGrantOrgAddress("");
      setRevokeRecordId("");
      setRevokeOrgAddress("");
    }
  }, [createHash, grantHash, revokeHash, refetchTotal, refetchPatient]);

  // Validation helpers
  const validateForm = useCallback((formType: 'create' | 'grant' | 'revoke') => {
    const newErrors: Record<string, string> = {};

    if (formType === 'create') {
      if (!patientAddress || !validateAddress(patientAddress)) {
        newErrors.patientAddress = "Valid patient address is required";
      }
      if (!dataHash || dataHash.trim().length === 0) {
        newErrors.dataHash = "Data hash is required";
      }
      if (!dataLocation || dataLocation.trim().length === 0) {
        newErrors.dataLocation = "Data location is required";
      }
    } else if (formType === 'grant') {
      if (!grantRecordId || !validateRecordId(grantRecordId)) {
        newErrors.grantRecordId = "Valid record ID is required (0x followed by 64 hex characters)";
      }
      if (!grantOrgAddress || !validateAddress(grantOrgAddress)) {
        newErrors.grantOrgAddress = "Valid organization address is required";
      }
    } else if (formType === 'revoke') {
      if (!revokeRecordId || !validateRecordId(revokeRecordId)) {
        newErrors.revokeRecordId = "Valid record ID is required (0x followed by 64 hex characters)";
      }
      if (!revokeOrgAddress || !validateAddress(revokeOrgAddress)) {
        newErrors.revokeOrgAddress = "Valid organization address is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [patientAddress, dataHash, dataLocation, grantRecordId, grantOrgAddress, revokeRecordId, revokeOrgAddress]);

  // Handlers
  const handleCreateRecord = useCallback(async () => {
    if (!validateForm('create') || !contractAddress) return;

    try {
      await createRecord({
        address: contractAddress,
        abi: HEALTHCARE_DB_ABI,
        functionName: "createRecord",
        args: [patientAddress as `0x${string}`, dataHash, dataLocation],
      });
    } catch (error: any) {
      console.error("Error creating record:", error);
      setErrors({ submit: error?.message || "Failed to create record" });
    }
  }, [patientAddress, dataHash, dataLocation, contractAddress, createRecord, validateForm]);

  const handleGrantAccess = useCallback(async () => {
    if (!validateForm('grant') || !contractAddress) return;

    try {
      await grantAccess({
        address: contractAddress,
        abi: HEALTHCARE_DB_ABI,
        functionName: "grantAccess",
        args: [grantRecordId as `0x${string}`, grantOrgAddress as `0x${string}`],
      });
    } catch (error: any) {
      console.error("Error granting access:", error);
      setErrors({ submit: error?.message || "Failed to grant access" });
    }
  }, [grantRecordId, grantOrgAddress, contractAddress, grantAccess, validateForm]);

  const handleRevokeAccess = useCallback(async () => {
    if (!validateForm('revoke') || !contractAddress) return;

    try {
      await revokeAccess({
        address: contractAddress,
        abi: HEALTHCARE_DB_ABI,
        functionName: "revokeAccess",
        args: [revokeRecordId as `0x${string}`, revokeOrgAddress as `0x${string}`],
      });
    } catch (error: any) {
      console.error("Error revoking access:", error);
      setErrors({ submit: error?.message || "Failed to revoke access" });
    }
  }, [revokeRecordId, revokeOrgAddress, contractAddress, revokeAccess, validateForm]);

  // Show connection screen
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full mb-4">
              <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">
              Decentralized Healthcare DB
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
              Encrypted, blockchain-based platform for secure, privacy-preserved cross-organization collaboration
            </p>
          </div>
          <ConnectWallet />
        </div>
      </div>
    );
  }

  // Show configuration warning
  if (!isContractConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-yellow-800 dark:text-yellow-200">
              Contract Not Configured
            </h2>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env.local file with your deployed contract address.
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Deploy the contract using Remix IDE on Base Sepolia or Base Mainnet, then update the environment variable.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show network warning
  if (!isBaseNetwork) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-yellow-800 dark:text-yellow-200">
              Wrong Network
            </h2>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              Please switch to Base or Base Sepolia network to use this application.
            </p>
            <ConnectWallet />
          </div>
        </div>
      </div>
    );
  }

  const record = recordData as PatientRecord | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Healthcare DB
          </h1>
          <ConnectWallet />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}
        {errors.submit && (
          <div className="mb-6 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Records</p>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {totalRecords?.toString() || "0"}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Your Records</p>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {patientRecordCount?.toString() || "0"}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Network</p>
            <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
              {chainId === 8453 ? "Base Mainnet" : chainId === 84532 ? "Base Sepolia" : `Chain ${chainId}`}
            </p>
          </div>
        </div>

        {/* Main Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Create Record */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Record
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Patient Address
                </label>
                <input
                  type="text"
                  value={patientAddress}
                  onChange={(e) => {
                    setPatientAddress(e.target.value);
                    setErrors({ ...errors, patientAddress: "" });
                  }}
                  placeholder="0x..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                    errors.patientAddress ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.patientAddress && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.patientAddress}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Encrypted Data Hash
                </label>
                <input
                  type="text"
                  value={dataHash}
                  onChange={(e) => {
                    setDataHash(e.target.value);
                    setErrors({ ...errors, dataHash: "" });
                  }}
                  placeholder="Hash of encrypted data"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                    errors.dataHash ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.dataHash && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dataHash}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Location
                </label>
                <input
                  type="text"
                  value={dataLocation}
                  onChange={(e) => {
                    setDataLocation(e.target.value);
                    setErrors({ ...errors, dataLocation: "" });
                  }}
                  placeholder="ipfs://..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                    errors.dataLocation ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.dataLocation && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dataLocation}</p>
                )}
              </div>
              <button
                onClick={handleCreateRecord}
                disabled={isCreating || isCreatingConfirming}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating || isCreatingConfirming ? "Creating..." : "Create Record"}
              </button>
            </div>
          </div>

          {/* Grant Access */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Grant Access
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Record ID
                </label>
                <input
                  type="text"
                  value={grantRecordId}
                  onChange={(e) => {
                    setGrantRecordId(e.target.value);
                    setErrors({ ...errors, grantRecordId: "" });
                  }}
                  placeholder="0x..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                    errors.grantRecordId ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.grantRecordId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.grantRecordId}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Organization Address
                </label>
                <input
                  type="text"
                  value={grantOrgAddress}
                  onChange={(e) => {
                    setGrantOrgAddress(e.target.value);
                    setErrors({ ...errors, grantOrgAddress: "" });
                  }}
                  placeholder="0x..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                    errors.grantOrgAddress ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.grantOrgAddress && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.grantOrgAddress}</p>
                )}
              </div>
              <button
                onClick={handleGrantAccess}
                disabled={isGranting || isGrantingConfirming}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGranting || isGrantingConfirming ? "Granting..." : "Grant Access"}
              </button>
            </div>
          </div>

          {/* Revoke Access */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Revoke Access
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Record ID
                </label>
                <input
                  type="text"
                  value={revokeRecordId}
                  onChange={(e) => {
                    setRevokeRecordId(e.target.value);
                    setErrors({ ...errors, revokeRecordId: "" });
                  }}
                  placeholder="0x..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                    errors.revokeRecordId ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.revokeRecordId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.revokeRecordId}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Organization Address
                </label>
                <input
                  type="text"
                  value={revokeOrgAddress}
                  onChange={(e) => {
                    setRevokeOrgAddress(e.target.value);
                    setErrors({ ...errors, revokeOrgAddress: "" });
                  }}
                  placeholder="0x..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white ${
                    errors.revokeOrgAddress ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.revokeOrgAddress && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.revokeOrgAddress}</p>
                )}
              </div>
              <button
                onClick={handleRevokeAccess}
                disabled={isRevoking || isRevokingConfirming}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRevoking || isRevokingConfirming ? "Revoking..." : "Revoke Access"}
              </button>
            </div>
          </div>
        </div>

        {/* View Record */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Record
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Record ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={viewRecordId}
                  onChange={(e) => setViewRecordId(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={() => refetchRecord()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  View
                </button>
              </div>
            </div>
            {record && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Record ID</p>
                    <p className="font-mono text-sm">{formatRecordId(record.recordId)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Patient</p>
                    <p className="font-mono text-sm">{formatAddress(record.patientAddress)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Created By</p>
                    <p className="font-mono text-sm">{formatAddress(record.createdBy)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className={`text-sm font-semibold ${record.isActive ? "text-green-600" : "text-red-600"}`}>
                      {record.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Data Hash</p>
                    <p className="font-mono text-xs break-all">{record.encryptedDataHash}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                    <p className="font-mono text-xs break-all">{record.dataLocation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Connected Account</h2>
          <p className="text-gray-600 dark:text-gray-400 font-mono break-all">{address}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Contract: {formatAddress(contractAddress)}
          </p>
        </div>
      </div>
    </div>
  );
}
