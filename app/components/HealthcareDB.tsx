"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectWallet } from "./ConnectWallet";
import { parseEther, formatEther } from "viem";

// Contract ABI - Update this with your deployed contract address
const HEALTHCARE_DB_ABI = [
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
    inputs: [{ name: "recordId", type: "bytes32" }],
    name: "records",
    outputs: [
      { name: "recordId", type: "bytes32" },
      { name: "patientAddress", type: "address" },
      { name: "createdBy", type: "address" },
      { name: "timestamp", type: "uint256" },
      { name: "encryptedDataHash", type: "string" },
      { name: "dataLocation", type: "string" },
      { name: "isActive", type: "bool" },
    ],
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
] as const;

// Update this with your deployed contract address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || "0x0000000000000000000000000000000000000000";

export function HealthcareDB() {
  const { address, isConnected } = useAccount();
  const [patientAddress, setPatientAddress] = useState("");
  const [dataHash, setDataHash] = useState("");
  const [dataLocation, setDataLocation] = useState("");
  const [grantRecordId, setGrantRecordId] = useState("");
  const [grantOrgAddress, setGrantOrgAddress] = useState("");

  const { data: totalRecords } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HEALTHCARE_DB_ABI,
    functionName: "getTotalRecordCount",
  });

  const { data: patientRecordCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HEALTHCARE_DB_ABI,
    functionName: "getPatientRecordCount",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const {
    data: createHash,
    writeContract: createRecord,
    isPending: isCreating,
  } = useWriteContract();

  const {
    data: grantHash,
    writeContract: grantAccess,
    isPending: isGranting,
  } = useWriteContract();

  const { isLoading: isCreatingConfirming } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  const { isLoading: isGrantingConfirming } = useWaitForTransactionReceipt({
    hash: grantHash,
  });

  const handleCreateRecord = async () => {
    if (!address || !patientAddress || !dataHash || !dataLocation) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await createRecord({
        address: CONTRACT_ADDRESS,
        abi: HEALTHCARE_DB_ABI,
        functionName: "createRecord",
        args: [patientAddress as `0x${string}`, dataHash, dataLocation],
      });
    } catch (error) {
      console.error("Error creating record:", error);
      alert("Failed to create record. Please check console for details.");
    }
  };

  const handleGrantAccess = async () => {
    if (!grantRecordId || !grantOrgAddress) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await grantAccess({
        address: CONTRACT_ADDRESS,
        abi: HEALTHCARE_DB_ABI,
        functionName: "grantAccess",
        args: [grantRecordId as `0x${string}`, grantOrgAddress as `0x${string}`],
      });
    } catch (error) {
      console.error("Error granting access:", error);
      alert("Failed to grant access. Please check console for details.");
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">
            Decentralized Healthcare DB
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Please connect your wallet to continue
          </p>
          <ConnectWallet />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <ConnectWallet />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 text-gray-800 dark:text-white">
            Decentralized Healthcare DB
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Encrypted, blockchain-based platform for secure, privacy-preserved cross-organization collaboration
          </p>
          <div className="flex justify-center gap-8 mt-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {totalRecords?.toString() || "0"}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Your Records</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {patientRecordCount?.toString() || "0"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Record Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
              Create Patient Record
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Patient Address
                </label>
                <input
                  type="text"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Encrypted Data Hash
                </label>
                <input
                  type="text"
                  value={dataHash}
                  onChange={(e) => setDataHash(e.target.value)}
                  placeholder="Hash of encrypted data"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Location (IPFS, etc.)
                </label>
                <input
                  type="text"
                  value={dataLocation}
                  onChange={(e) => setDataLocation(e.target.value)}
                  placeholder="ipfs://..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={handleCreateRecord}
                disabled={isCreating || isCreatingConfirming}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating || isCreatingConfirming
                  ? "Creating..."
                  : "Create Record"}
              </button>
            </div>
          </div>

          {/* Grant Access Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
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
                  onChange={(e) => setGrantRecordId(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Organization Address
                </label>
                <input
                  type="text"
                  value={grantOrgAddress}
                  onChange={(e) => setGrantOrgAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={handleGrantAccess}
                disabled={isGranting || isGrantingConfirming}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGranting || isGrantingConfirming
                  ? "Granting..."
                  : "Grant Access"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
            Connected Account
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-mono break-all">
            {address}
          </p>
        </div>
      </div>
    </div>
  );
}

