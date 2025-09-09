"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useConfig, useReconnect } from "wagmi";
import { getChainId } from "wagmi/actions";
import { baseSepolia } from "wagmi/chains";
import { parseEther } from "viem";
import { getAgreementFactoryAddress, AGREEMENT_FACTORY_ABI } from "@/lib/agreementFactoryABI";
import { useRouter } from "next/navigation";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { EVENTS } from "@/lib/analytics";
import { useEnsureChain } from "@/lib/hooks/useEnsureChain";
import { monadTestnet } from "@/lib/utils/customChains";
// Toasts removed

export function CreateAgreement() {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const { reconnect } = useReconnect();
  const { isCorrectChain, isSwitching, needsSwitch, ensureCorrectChain } = useEnsureChain(); // Auto switch to Base Sepolia
  
  // Debug logging
  console.log("useAccount chain:", chain?.id);
  console.log("useChainId:", chainId);
  
  // Check for potential state mismatch early
  let configChainId;
  try {
    configChainId = getChainId(config);
    console.log("Early config chainId check:", configChainId);
  } catch (error) {
    console.log("Early config chainId error:", error);
    configChainId = chainId;
  }
  
  // Use the actual connected chain ID from the account, fallback to useChainId()
  const actualChainId = chain?.id ?? chainId;
  
  // Detect mismatch early and show warning
  const hasChainMismatch = configChainId !== actualChainId;
  console.log("Chain mismatch detected:", hasChainMismatch, "Config:", configChainId, "Hook:", actualChainId);
  
  // Toasts removed
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [partyA, setPartyA] = useState("");
  const [partyB, setPartyB] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [minBet, setMinBet] = useState<string>("0.0002");
  const [maxBet, setMaxBet] = useState<string>("0.1");
  // Betting end time input removed; default duration is fixed (24h)
  
  // Determine currency symbol based on chain
  const currencySymbol = actualChainId === monadTestnet.id ? "MON" : "ETH";

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

      // Notify Telegram bot (server-side route)
      try {
        const appUrl = (process.env.NEXT_PUBLIC_URL || '') as string;
        void fetch('/api/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'debate_created',
            topic,
            creator: address,
            url: appUrl || null,
          }),
        });
      } catch (e) {
        console.warn('Telegram notification (debate_created) failed:', e);
      }
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

    // Validate bet limits
    let minWei: bigint | null = null;
    let maxWei: bigint | null = null;
    try {
      minWei = parseEther((minBet || '').trim());
      maxWei = parseEther((maxBet || '').trim());
      
      // Contract validation rules:
      // - minBetAmount must be > 0
      // - maxBetAmount must be >= minBetAmount
      // - Default limits: 0.0002 ETH min, 100 ETH max
      const MIN_ALLOWED = parseEther("0.0002"); // Contract's defaultMinBet
      const MAX_ALLOWED = parseEther("100"); // Contract's defaultMaxBet
      
      if (minWei <= BigInt(0)) {
        alert("Minimum bet must be greater than 0");
        return;
      }
      if (minWei < MIN_ALLOWED) {
        alert(`Minimum bet must be at least 0.0002 ${currencySymbol}`);
        return;
      }
      if (maxWei <= BigInt(0)) {
        alert("Maximum bet must be greater than 0");
        return;
      }
      if (maxWei > MAX_ALLOWED) {
        alert(`Maximum bet cannot exceed 100 ${currencySymbol}`);
        return;
      }
      if (minWei > maxWei) {
        alert("Maximum bet must be greater than or equal to minimum bet");
        return;
      }
    } catch {
      alert(`Please enter valid ${currencySymbol} amounts`);
      return;
    }

    // Use fixed duration (24 hours)
    const durationMinutes: number = 24 * 60;

    try {
      // Ensure we're on the correct chain before transaction
      const ok = await ensureCorrectChain();
      if (!ok) { return; }
      
      console.log("Current chainId from useChainId:", chainId);
      console.log("Current chainId from useAccount:", chain?.id);
      console.log("Using actualChainId:", actualChainId);
      console.log("Contract address:", getAgreementFactoryAddress(actualChainId));
      
      // Double-check the actual chain from config
      let configChainId;
      try {
        configChainId = getChainId(config);
        console.log("Config chainId:", configChainId);
      } catch (error) {
        console.error("Failed to get config chain ID:", error);
        configChainId = actualChainId;
      }
      
      // If there's a mismatch between wagmi state and config, show error and ask user to refresh
      if (configChainId && configChainId !== actualChainId) {
        console.log("Chain mismatch detected! Config:", configChainId, "vs Hook:", actualChainId);
        
        alert(`Network sync issue detected.\n\nWallet connector: Chain ${configChainId}\nApp state: Chain ${actualChainId}\n\nPlease refresh the page to sync your wallet properly.`);
        return;
      }
      
      // Use the actual chain ID from the wallet for consistency
      const transactionChainId = actualChainId;
      
      // Track create button click (page view again optional)
      trackPageView('create_submit');
      
      console.log("Transaction details:", {
        address: getAgreementFactoryAddress(transactionChainId),
        chainId: transactionChainId
      });
      
      await writeContract({
        address: getAgreementFactoryAddress(transactionChainId) as `0x${string}`,
        abi: AGREEMENT_FACTORY_ABI,
        functionName: "createContract",
        args: [
          topic,
          description,
          partyA,
          partyB,
          BigInt(durationMinutes), // Fixed 24 hours
          minWei, // User-defined min bet (validated)
          maxWei  // User-defined max bet (validated)
        ],
        chainId: transactionChainId,
      });
    } catch (err) {
      // Check if user rejected the transaction
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected') || 
          errorMessage.includes('User denied') || errorMessage.includes('user denied')) {
        // Don't show error for user rejections, it's a normal action
        console.log("User cancelled the contract creation transaction");
        return;
      }
      console.error("Error creating contract:", err);
      
      // Toast removed
    }
  }, [isConnected, address, writeContract, topic, description, partyA, partyB, minBet, maxBet, trackPageView, ensureCorrectChain]);

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
        {/* Betting End Time input removed */}

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

        {/* Bet Limits */}
        <div className="mb-4">
          <label className="block text-white text-lg font-medium mb-2">Bet Limits</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 text-xs mb-1">Min Bet ({currencySymbol})</label>
              <input
                type="number"
                value={minBet}
                onChange={(e) => setMinBet(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-900 border rounded-xl text-white placeholder-gray-400 focus:outline-none transition-colors ${
                  (() => {
                    try {
                      const v = parseEther((minBet || '').trim());
                      const MIN_ALLOWED = parseEther("0.0002");
                      return v >= MIN_ALLOWED ? 'border-gray-800 focus:border-primary' : 'border-red-500';
                    } catch { return 'border-red-500'; }
                  })()
                }`}
                placeholder="0.0002"
                step="0.0001"
                min="0.0002"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-xs mb-1">Max Bet ({currencySymbol})</label>
              <input
                type="number"
                value={maxBet}
                onChange={(e) => setMaxBet(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-900 border rounded-xl text-white placeholder-gray-400 focus:outline-none transition-colors ${
                  (() => {
                    try {
                      const minV = parseEther((minBet || '').trim());
                      const maxV = parseEther((maxBet || '').trim());
                      const MAX_ALLOWED = parseEther("100");
                      return maxV >= minV && maxV > BigInt(0) && maxV <= MAX_ALLOWED ? 'border-gray-800 focus:border-primary' : 'border-red-500';
                    } catch { return 'border-red-500'; }
                  })()
                }`}
                placeholder="0.1"
                step="0.001"
                min="0.0002"
                max="100"
              />
            </div>
          </div>
          {/* Inline validation messages */}
          {(() => {
            try {
              const minV = parseEther((minBet || '').trim());
              const maxV = parseEther((maxBet || '').trim());
              const MIN_ALLOWED = parseEther("0.0002");
              const MAX_ALLOWED = parseEther("100");
              
              if (minV < MIN_ALLOWED) return <p className="text-red-400 text-sm mt-2">Min bet must be at least 0.0002 {currencySymbol}.</p>;
              if (maxV <= BigInt(0)) return <p className="text-red-400 text-sm mt-2">Max bet must be greater than 0.</p>;
              if (maxV > MAX_ALLOWED) return <p className="text-red-400 text-sm mt-2">Max bet cannot exceed 100 {currencySymbol}.</p>;
              if (maxV < minV) return <p className="text-red-400 text-sm mt-2">Max bet must be at least {minBet} {currencySymbol}.</p>;
              return null;
            } catch {
              return <p className="text-red-400 text-sm mt-2">Enter valid {currencySymbol} amounts (e.g., 0.001).</p>;
            }
          })()}
        </div>
      </div>

      {/* Post Button - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-1000 border-t border-gray-800 p-4">
        <button
          onClick={handleCreateContract}
          disabled={(() => {
            if (!isConnected || isPending || isConfirming || isSwitching || !isCorrectChain || hasChainMismatch || !topic.trim() || !description.trim() || !partyA.trim() || !partyB.trim()) return true;
            try {
              const minV = parseEther((minBet || '').trim());
              const maxV = parseEther((maxBet || '').trim());
              const MIN_ALLOWED = parseEther("0.0002");
              const MAX_ALLOWED = parseEther("100");
              
              if (minV < MIN_ALLOWED || maxV <= BigInt(0) || maxV > MAX_ALLOWED || maxV < minV) return true;
              return false;
            } catch { return true; }
          })()}
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
            <p className="text-yellow-400 text-sm">Please switch to a supported network first</p>
          </div>
        )}

        {hasChainMismatch && (
          <div className="mt-2 text-center p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm mb-2">Network sync issue detected!</p>
            <p className="text-red-300 text-xs mb-2">
              Wallet: Chain {configChainId} • App: Chain {actualChainId}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
            >
              Refresh Page
            </button>
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

      {/* Toasts removed */}
    </div>
  );
}
