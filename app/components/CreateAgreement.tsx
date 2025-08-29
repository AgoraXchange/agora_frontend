"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { AGREEMENT_FACTORY_ADDRESS, AGREEMENT_FACTORY_ABI } from "@/lib/agreementFactoryABI";

export function CreateAgreement() {
  const { address, isConnected } = useAccount();
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [partyA, setPartyA] = useState("");
  const [partyB, setPartyB] = useState("");

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Console log contract status tracking
  useEffect(() => {
    if (hash) {
      console.log("Transaction submitted:", hash);
    }
  }, [hash]);

  useEffect(() => {
    if (isConfirming) {
      console.log("Transaction confirming...");
    }
  }, [isConfirming]);

  useEffect(() => {
    if (isSuccess) {
      console.log("Contract created successfully!");
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      console.error("Contract creation error:", error);
    }
  }, [error]);

  const handleCreateContract = useCallback(() => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!topic.trim() || !description.trim() || !partyA.trim() || !partyB.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      writeContract({
        address: AGREEMENT_FACTORY_ADDRESS as `0x${string}`,
        abi: AGREEMENT_FACTORY_ABI,
        functionName: "createContract",
        args: [
          topic,
          description,
          partyA,
          partyB,
          BigInt(1440), // Fixed 24 hours duration (1440 minutes)
          parseEther("0.001"), // Fixed min bet
          parseEther("0.1") // Fixed max bet
        ],
      });
    } catch (err) {
      console.error("Error creating contract:", err);
    }
  }, [isConnected, address, writeContract, topic, description, partyA, partyB]);

  return (
    <div className="bg-gray-1000 min-h-screen flex flex-col">
      <div className="flex-1 px-4 pt-4 pb-24">
        {/* Title Field */}
        <div className="mb-4">
          <label className="block text-white text-lg font-medium mb-2">Title</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
            placeholder="Title"
          />
        </div>

        {/* Body Field */}
        <div className="mb-4">
          <label className="block text-white text-lg font-medium mb-2">Body</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-4 py-3 bg-gray-900 border rounded-xl text-white placeholder-gray-400 focus:outline-none transition-colors resize-none ${
              !description.trim() && topic.trim() ? 'border-red-500' : 'border-gray-800 focus:border-primary'
            }`}
            placeholder="Body"
            rows={6}
          />
          {!description.trim() && topic.trim() && (
            <p className="text-red-400 text-sm mt-2">This field is required.</p>
          )}
        </div>

        {/* Debate Points */}
        <div className="mb-4">
          <label className="block text-white text-lg font-medium mb-2">Debate Points</label>
          <div className="space-y-3">
            <input
              type="text"
              value={partyA}
              onChange={(e) => setPartyA(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
              placeholder="Point 1"
            />
            <input
              type="text"
              value={partyB}
              onChange={(e) => setPartyB(e.target.value)}
              className={`w-full px-4 py-3 bg-gray-900 border rounded-xl text-white placeholder-gray-400 focus:outline-none transition-colors ${
                !partyB.trim() && partyA.trim() ? 'border-red-500' : 'border-gray-800 focus:border-primary'
              }`}
              placeholder="Point 2"
            />
            {!partyB.trim() && partyA.trim() && (
              <p className="text-red-400 text-sm mt-2">This field is required.</p>
            )}
          </div>
        </div>
      </div>

      {/* Post Button - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-1000 border-t border-gray-800 p-4">
        <button
          onClick={handleCreateContract}
          disabled={!isConnected || isPending || isConfirming || !topic.trim() || !description.trim() || !partyA.trim() || !partyB.trim()}
          className="w-full bg-primary text-gray-1000 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 disabled:bg-gray-800 disabled:text-gray-400 transition-colors"
        >
          {isPending || isConfirming ? "Creating..." : "Post"}
        </button>

        {!isConnected && (
          <div className="mt-2 text-center">
            <p className="text-gray-400 text-sm">Please connect your wallet to create a debate</p>
          </div>
        )}
      </div>
    </div>
  );
}