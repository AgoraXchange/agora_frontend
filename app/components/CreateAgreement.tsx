"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseEther } from "viem";
import { AGREEMENT_FACTORY_ADDRESS, AGREEMENT_FACTORY_ABI } from "@/lib/agreementFactoryABI";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
};

function Button({ children, variant = "primary", onClick, disabled = false, loading = false }: ButtonProps) {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors";
  const variantClasses = {
    primary: "bg-[#0052FF] hover:bg-[#0044DD] text-white disabled:bg-gray-400",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:bg-gray-100",
    outline: "border border-[#0052FF] text-[#0052FF] hover:bg-[#0052FF] hover:text-white disabled:border-gray-300 disabled:text-gray-300",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${disabled || loading ? "cursor-not-allowed opacity-50" : ""}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

type CardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

export function CreateAgreement() {
  const { address, isConnected } = useAccount();
  const [topic, setTopic] = useState("El Clasico Match");
  const [description, setDescription] = useState("Real Madrid vs Barcelona football match");
  const [partyA, setPartyA] = useState("Real Madrid");
  const [partyB, setPartyB] = useState("Barcelona");
  const [duration, setDuration] = useState("60");
  const [minBet, setMinBet] = useState("0.0002");
  const [maxBet, setMaxBet] = useState("1");

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: contractCounter } = useReadContract({
    address: AGREEMENT_FACTORY_ADDRESS,
    abi: AGREEMENT_FACTORY_ABI,
    functionName: "contractCounter",
  });

  const { data: platformStats } = useReadContract({
    address: AGREEMENT_FACTORY_ADDRESS,
    abi: AGREEMENT_FACTORY_ABI,
    functionName: "getPlatformStats",
  });

  const handleCreateContract = useCallback(() => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      writeContract({
        address: AGREEMENT_FACTORY_ADDRESS,
        abi: AGREEMENT_FACTORY_ABI,
        functionName: "createContract",
        args: [
          topic,
          description,
          partyA,
          partyB,
          BigInt(duration),
          parseEther(minBet),
          parseEther(maxBet)
        ],
      });
    } catch (err) {
      console.error("Error creating contract:", err);
    }
  }, [isConnected, address, writeContract, topic, description, partyA, partyB, duration, minBet, maxBet]);

  return (
    <div className="space-y-6">
      <Card title="Create Betting Contract">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Contract Address:</strong> {AGREEMENT_FACTORY_ADDRESS}
            </p>
            <p className="text-sm text-blue-800 mt-1">
              <strong>Network:</strong> Base Sepolia
            </p>
            <p className="text-sm text-blue-800 mt-1">
              <strong>Connected Account:</strong> {address || "Not connected"}
            </p>
          </div>

          {!isConnected ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">Please connect your wallet to create a betting contract</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Betting Topic
                  <span className="text-gray-500 text-xs ml-1">What is this bet about?</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. El Clasico Match, Election Winner, Stock Price Prediction"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                  <span className="text-gray-500 text-xs ml-1">Provide more details about this bet</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Real Madrid vs Barcelona football match on December 23, 2024"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>💡 Tip:</strong> Options A and B represent the two choices people can bet on. 
                    For example: "Real Madrid" vs "Barcelona" or "Yes" vs "No" for a prediction.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option A (First Choice) 
                      <span className="text-gray-500 text-xs ml-1">e.g. Team A, Yes, Candidate A</span>
                    </label>
                    <input
                      type="text"
                      value={partyA}
                      onChange={(e) => setPartyA(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Real Madrid"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option B (Second Choice)
                      <span className="text-gray-500 text-xs ml-1">e.g. Team B, No, Candidate B</span>
                    </label>
                    <input
                      type="text"
                      value={partyB}
                      onChange={(e) => setPartyB(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Barcelona"
                    />
                  </div>
                </div>
                
                <div className="mt-3 text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Preview:</p>
                  <p className="font-semibold text-gray-800">{topic}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold text-blue-600">{partyA}</span> vs <span className="font-semibold text-red-600">{partyB}</span>
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="60"
                  min="1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Agreement creator reward is fixed at 1% of the losing pool (after 5% platform fee)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Bet (ETH)</label>
                  <input
                    type="number"
                    value={minBet}
                    onChange={(e) => setMinBet(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.0002"
                    step="0.0001"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Bet (ETH)</label>
                  <input
                    type="number"
                    value={maxBet}
                    onChange={(e) => setMaxBet(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1"
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleCreateContract}
                disabled={isPending || isConfirming}
                loading={isPending || isConfirming}
              >
                Create Betting Contract
              </Button>

              {hash && !isSuccess && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Status:</strong> {isConfirming ? "⏳ Confirming transaction..." : "📝 Transaction submitted"}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Transaction Hash:</strong>{" "}
                    <a
                      href={`https://sepolia.basescan.org/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {hash}
                    </a>
                  </p>
                </div>
              )}

              {isSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">✅ Betting contract created successfully!</p>
                  {contractCounter && (
                    <p className="text-green-700 text-sm mt-1">
                      Contract ID: {(contractCounter as bigint).toString()}
                    </p>
                  )}
                  {hash && (
                    <p className="text-green-700 text-sm mt-1">
                      <a
                        href={`https://sepolia.basescan.org/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        View on Basescan →
                      </a>
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">Error: {error.message}</p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {platformStats && (
        <Card title="Platform Statistics">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Total Contracts</p>
              <p className="text-xl font-semibold text-gray-800">
                {(() => {
                  try {
                    const stats = platformStats as any;
                    return stats?.totalContracts?.toString() || "0";
                  } catch {
                    return "0";
                  }
                })()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Total Bets</p>
              <p className="text-xl font-semibold text-gray-800">
                {(() => {
                  try {
                    const stats = platformStats as any;
                    return stats?.totalBets?.toString() || "0";
                  } catch {
                    return "0";
                  }
                })()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Total Volume</p>
              <p className="text-xl font-semibold text-gray-800">
                {(() => {
                  try {
                    const stats = platformStats as any;
                    return stats?.totalVolume ? (Number(stats.totalVolume) / 1e18).toFixed(4) : "0.0000";
                  } catch {
                    return "0.0000";
                  }
                })()} ETH
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Fees Collected</p>
              <p className="text-xl font-semibold text-gray-800">
                {(() => {
                  try {
                    const stats = platformStats as any;
                    return stats?.totalFeesCollected ? (Number(stats.totalFeesCollected) / 1e18).toFixed(4) : "0.0000";
                  } catch {
                    return "0.0000";
                  }
                })()} ETH
              </p>
            </div>
          </div>
        </Card>
      )}

      {contractCounter && Number(contractCounter) > 0 && (
        <Card title="Recent Contracts">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              View the latest contracts on Base Sepolia explorer:
            </p>
            <div className="space-y-1">
              {[...Array(Math.min(3, Number(contractCounter)))].map((_, i) => {
                const contractId = Number(contractCounter) - i;
                return (
                  <a
                    key={contractId}
                    href={`https://sepolia.basescan.org/address/${AGREEMENT_FACTORY_ADDRESS}#readContract`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-600 hover:underline"
                  >
                    Contract #{contractId}
                  </a>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}