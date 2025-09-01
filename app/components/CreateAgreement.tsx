"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { AGREEMENT_FACTORY_ADDRESS, AGREEMENT_FACTORY_ABI } from "@/lib/agreementFactoryABI";
import { useRouter } from "next/navigation";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { EVENTS } from "@/lib/analytics";
import { useEnsureChain } from "@/lib/hooks/useEnsureChain";
import { useToast } from "@/components/Toast";

export function CreateAgreement() {
  const { address, isConnected } = useAccount();
  const { isCorrectChain, isSwitching, needsSwitch, switchNetwork } = useEnsureChain(); // Auto switch to Base Sepolia
  const { showToast, ToastContainer } = useToast();
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [partyA, setPartyA] = useState("");
  const [partyB, setPartyB] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Short delay to ensure smooth transition
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { trackDebateEvent, trackPageView } = useAnalytics();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Console log contract status tracking
  useEffect(() => {
    if (hash) {
      console.log("Transaction submitted:", hash);
      // Track transaction initiated for contract creation
      trackDebateEvent(EVENTS.TRANSACTION_INITIATED, {
        debate_id: "",
        debate_topic: topic,
        creator: address || "",
        status: "open",
      });
    }
  }, [hash, address, topic, trackDebateEvent]);

  useEffect(() => {
    if (isConfirming) {
      console.log("Transaction confirming...");
    }
  }, [isConfirming]);

  useEffect(() => {
    if (isSuccess) {
      console.log("Contract created successfully!");
      setShowSuccessModal(true);
      // Track debate created and transaction completed
      trackDebateEvent(EVENTS.DEBATE_CREATED, {
        debate_id: "",
        debate_topic: topic,
        creator: address || "",
        status: "open",
      });
      trackDebateEvent(EVENTS.TRANSACTION_COMPLETED, {
        debate_id: "",
        debate_topic: topic,
        creator: address || "",
        status: "open",
      });
    }
  }, [isSuccess, trackDebateEvent, topic, address]);

  useEffect(() => {
    if (error) {
      console.error("Contract creation error:", error);
      // Track transaction failed
      trackDebateEvent(EVENTS.TRANSACTION_FAILED, {
        debate_id: "",
        debate_topic: topic,
        creator: address || "",
        status: "open",
      });
    }
  }, [error, trackDebateEvent, topic, address]);

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/');  // Navigate to home page instead of using back()
  };

  const handleCreateContract = useCallback(async () => {
    if (!isConnected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!topic.trim() || !description.trim() || !partyA.trim() || !partyB.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // Ensure we're on the correct chain before transaction
      if (!isCorrectChain) {
        await switchNetwork();
      }
      
      // Track create button click (page view again optional)
      trackPageView('create_submit');
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
      
      // Check if user rejected the transaction
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected') || 
          errorMessage.includes('User denied') || errorMessage.includes('user denied')) {
        // Don't show error for user rejections, it's a normal action
        console.log("User cancelled the contract creation transaction");
        return;
      }
      
      // Show error toast for actual failures
      showToast("Failed to create contract. Please try again.", "error");
    }
  }, [isConnected, address, writeContract, topic, description, partyA, partyB, trackPageView, switchNetwork, isCorrectChain, showToast]);

  if (!isReady) {
    return (
      <div className="bg-gray-1000 min-h-screen flex flex-col">
        <div className="flex-1 px-4 pt-4 pb-24">
          {/* Title Field Skeleton */}
          <div className="mb-4">
            <div className="h-6 w-16 bg-gray-800 rounded mb-2 animate-pulse"></div>
            <div className="w-full h-12 bg-gray-900 border border-gray-800 rounded-xl animate-pulse"></div>
          </div>

          {/* Body Field Skeleton */}
          <div className="mb-4">
            <div className="h-6 w-16 bg-gray-800 rounded mb-2 animate-pulse"></div>
            <div className="w-full h-32 bg-gray-900 border border-gray-800 rounded-xl animate-pulse"></div>
          </div>

          {/* Debate Points Skeleton */}
          <div className="mb-4">
            <div className="h-6 w-32 bg-gray-800 rounded mb-2 animate-pulse"></div>
            <div className="space-y-3">
              <div className="w-full h-12 bg-gray-900 border border-gray-800 rounded-xl animate-pulse"></div>
              <div className="w-full h-12 bg-gray-900 border border-gray-800 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Post Button Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-1000 border-t border-gray-800 p-4">
          <div className="w-full h-14 bg-gray-800 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-1000 min-h-screen flex flex-col">
      <div className="flex-1 px-4 pt-4 pb-24">
        {/* Title Field */}
        <div className="mb-4">
          <label className="block text-white text-lg font-medium mb-2">Title</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors resize-none overflow-hidden"
            placeholder="Title"
            maxLength={300}
            rows={1}
            style={{
              minHeight: '48px',
              height: 'auto'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = '48px';
              target.style.height = target.scrollHeight + 'px';
            }}
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
            <textarea
              value={partyA}
              onChange={(e) => setPartyA(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors resize-none overflow-hidden"
              placeholder="Point 1"
              maxLength={50}
              rows={1}
              style={{
                minHeight: '48px',
                height: 'auto'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '48px';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
            <textarea
              value={partyB}
              onChange={(e) => setPartyB(e.target.value)}
              className={`w-full px-4 py-3 bg-gray-900 border rounded-xl text-white placeholder-gray-400 focus:outline-none transition-colors resize-none overflow-hidden ${
                !partyB.trim() && partyA.trim() ? 'border-red-500' : 'border-gray-800 focus:border-primary'
              }`}
              placeholder="Point 2"
              maxLength={50}
              rows={1}
              style={{
                minHeight: '48px',
                height: 'auto'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '48px';
                target.style.height = target.scrollHeight + 'px';
              }}
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
          disabled={!isConnected || isPending || isConfirming || isSwitching || !isCorrectChain || !topic.trim() || !description.trim() || !partyA.trim() || !partyB.trim()}
          className="w-full bg-primary text-gray-1000 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 disabled:bg-gray-800 disabled:text-gray-400 transition-colors"
        >
          {isSwitching ? "Switching Network..." : isPending || isConfirming ? "Creating..." : "Post"}
        </button>

        {!isConnected && (
          <div className="mt-2 text-center">
            <p className="text-gray-400 text-sm">Please connect your wallet to create a debate</p>
          </div>
        )}

        {needsSwitch && (
          <div className="mt-2 text-center">
            <p className="text-yellow-400 text-sm">Please switch to Base Sepolia network first</p>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-800">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
              <p className="text-gray-400 mb-6">Your debate has been created successfully.</p>
              <button
                onClick={handleSuccessModalClose}
                className="w-full bg-primary text-gray-1000 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
