"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useConfig, useBalance } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { parseEther, formatEther } from "viem";
import { readContract } from "@wagmi/core";
import { AGREEMENT_FACTORY_ADDRESS, AGREEMENT_FACTORY_ABI } from "@/lib/agreementFactoryABI";
import { BettingOptions } from "@/components/BettingOptions";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ResultSection } from "@/components/ResultSection";
import { LiveDebateCard } from "@/components/LiveDebateCard";
import { LiveDebateBottomSheet } from "@/components/LiveDebateBottomSheet";
import { BetModal } from "@/components/BetModal";
import type { Comment, Contract } from "@/types/contract";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { EVENTS } from "@/lib/analytics";
import { useEnsureChain } from "@/lib/hooks/useEnsureChain";
// Toasts removed
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function AgreementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = parseInt(params.id as string);
  
  const { isConnected, address } = useAccount();
  const { data: balanceData } = useBalance({ address, chainId: baseSepolia.id, query: { enabled: !!address } });
  const { isCorrectChain, isSwitching, needsSwitch, ensureCorrectChain } = useEnsureChain(); // Auto switch to Base Sepolia
  // Toasts removed
  const [betError, setBetError] = useState<{ title: string; details: string[] } | null>(null);
  const [hasShownSubmitted, setHasShownSubmitted] = useState(false);
  const [comment, setComment] = useState("");
  const [showBetModal, setShowBetModal] = useState(false);
  const [showLiveDebate, setShowLiveDebate] = useState(false);
  const [selectedSide, setSelectedSide] = useState<1 | 2 | null>(null);
  const [betAmount, setBetAmount] = useState("0.001");
  const [lastAction, setLastAction] = useState<"bet" | "comment" | null>(null);
  const { trackDebateEvent, trackBetEvent, trackPageView } = useAnalytics();
  const [winnerArguments, setWinnerArguments] = useState<
    | {
        Jury1?: string;
        Jury2?: string;
        Jury3?: string;
        Conclusion?: string;
      }
    | {
        reasoning?: string;
        confidence?: number;
        evidence?: string[];
        deliberationMode?: string;
        decisionId?: string;
        committeeDecisionId?: string;
      }
    | null
  >(null);
  
  // Contract data
  const { data: contractData, refetch: refetchContract } = useReadContract({
    address: AGREEMENT_FACTORY_ADDRESS as `0x${string}`,
    abi: AGREEMENT_FACTORY_ABI,
    functionName: "getContract",
    args: [BigInt(contractId)],
  });

  // Comments data
  const { data: commentsData, refetch: refetchComments } = useReadContract({
    address: AGREEMENT_FACTORY_ADDRESS as `0x${string}`,
    abi: AGREEMENT_FACTORY_ABI,
    functionName: "getComments",
    args: [BigInt(contractId), BigInt(0), BigInt(50)],
  });

  // Check if user has bet
  const { data: hasUserBet, refetch: refetchUserBet } = useReadContract({
    address: AGREEMENT_FACTORY_ADDRESS as `0x${string}`,
    abi: AGREEMENT_FACTORY_ABI,
    functionName: "hasUserBet",
    args: address ? [BigInt(contractId), address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: isTxError, error: txError } = useWaitForTransactionReceipt({ hash });

  const contract = contractData as Contract;
  const comments = (commentsData as unknown as Comment[][])?.[0] || [];
  
  // Get wagmi config
  const config = useConfig();
  
  // Admin controls removed
  
  // State to store commenter sides
  const [commenterSides, setCommenterSides] = useState<Map<string, number>>(new Map());
  // Notify backend once when countdown reaches zero
  const endNotifiedRef = useRef(false);
  
  // Fetch bet sides for all commenters
  useEffect(() => {
    const fetchCommenterSides = async () => {
      if (comments.length === 0) return;
      
      const uniqueCommenters = [...new Set(comments.map(c => c.commenter))];
      const sideMap = new Map<string, number>();
      
      // Fetch sides for each commenter
      for (const commenter of uniqueCommenters) {
        try {
          const result = await readContract(config, {
            address: AGREEMENT_FACTORY_ADDRESS as `0x${string}`,
            abi: AGREEMENT_FACTORY_ABI,
            functionName: "getUserBetsPaginated",
            args: [BigInt(contractId), commenter as `0x${string}`, BigInt(0), BigInt(1)],
          });
          
          // Result is a tuple: [amounts, choices, claimed, totalBets]
          const [, choices, ,] = result as readonly [readonly bigint[], readonly number[], readonly boolean[], bigint];
          
          if (choices && choices.length > 0) {
            // choices[0] contains the side (1 or 2)
            sideMap.set(commenter.toLowerCase(), choices[0]);
          }
        } catch (error) {
          console.error(`Failed to fetch side for ${commenter}:`, error);
        }
      }
      
      setCommenterSides(sideMap);
    };
    
    fetchCommenterSides();
  }, [comments, contractId, config]);
  
  // 댓글에 side 정보 추가
  const commentsWithSide = comments.map((comment) => ({
    ...comment,
    side: commenterSides.get(comment.commenter.toLowerCase()) || 0 // 0 if no bet found
  }));

  // Fetch winner arguments when contract is settled
  useEffect(() => {
    const fetchWinnerArguments = async () => {
      if (contract && (contract.status === 1 || contract.status === 2 || contract.status === 3)) {
        console.log('📡 Fetching winner arguments for contract:', contractId);
        try {
          const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/oracle/contracts/${contractId}/winner-arguments?lang=en`;
          console.log('🌐 API URL:', url);
          
          const response = await fetch(url);
          console.log('📥 Response status:', response.status, response.statusText);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📊 API Response:', data);
            if (data.success) {
              console.log('✅ Setting winner arguments:', data.data);
              setWinnerArguments(data.data);
            } else {
              console.log('❌ API returned success: false');
            }
          } else {
            console.log('❌ Response not ok:', response.status);
          }
        } catch (error) {
          console.error('💥 Failed to fetch winner arguments:', error);
        }
      }
    };

    fetchWinnerArguments();
  }, [contract, contractId]);

  useEffect(() => {
    if (isSuccess) {
      // Track transaction completed for last action
      if (lastAction === "bet") {
        // Verify on-chain recorded amount for the latest bet (debug)
        (async () => {
          try {
            if (!address) return;
            const result = await readContract(config, {
              address: AGREEMENT_FACTORY_ADDRESS as `0x${string}`,
              abi: AGREEMENT_FACTORY_ABI,
              functionName: "getUserBetsPaginated",
              args: [BigInt(contractId), address as `0x${string}`, BigInt(0), BigInt(1)],
            });
            const [amounts] = result as readonly [readonly bigint[], readonly number[], readonly boolean[], bigint];
            const lastAmount = (amounts && amounts.length > 0) ? amounts[0] : BigInt(0);
            console.log('[Bet Debug] on-chain last bet amount (wei):', lastAmount.toString());
          } catch (e) {
            console.warn('[Bet Debug] failed to fetch on-chain bet amount:', e);
          }
        })();
        trackBetEvent(EVENTS.TRANSACTION_COMPLETED, {
          debate_id: String(contractId),
          side: selectedSide === 1 ? "A" : "B",
          amount: parseFloat(betAmount),
        });
        trackBetEvent(EVENTS.BET_PLACED, {
          debate_id: String(contractId),
          side: selectedSide === 1 ? "A" : "B",
          amount: parseFloat(betAmount),
        });
      } else if (lastAction === "comment") {
        trackDebateEvent(EVENTS.TRANSACTION_COMPLETED, {
          debate_id: String(contractId),
          debate_topic: contract?.topic || "",
          creator: contract?.creator || "",
          status: (contract?.status === 0 ? "open" : contract?.status === 1 ? "closed" : "resolved"),
        });
        trackDebateEvent(EVENTS.COMMENT_POSTED, {
          debate_id: String(contractId),
          debate_topic: contract?.topic || "",
          creator: contract?.creator || "",
          status: (contract?.status === 0 ? "open" : contract?.status === 1 ? "closed" : "resolved"),
        });
        // Notify Telegram bot (comment_created)
        try {
          const openUrl = (process.env.NEXT_PUBLIC_URL || '') as string;
          const deepLink = openUrl ? `${openUrl}/agreement/${contractId}` : null;
          void fetch('/api/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'comment_created',
              contractId,
              topic: contract?.topic || '',
              commenter: address,
              content: comment,
              url: deepLink,
            }),
          });
        } catch (e) {
          console.warn('Telegram notification (comment_created) failed:', e);
        }
      }

      refetchContract();
      refetchComments();
      refetchUserBet();
      setShowBetModal(false);
      setSelectedSide(null);
      setBetAmount("0.001");
      setComment("");
      setLastAction(null);
      setBetError(null);
      setHasShownSubmitted(false);
      
      // Refresh the page after successful bet
      if (lastAction === "bet") {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  }, [isSuccess, refetchContract, refetchComments, refetchUserBet, lastAction, trackBetEvent, trackDebateEvent, contract?.topic, contract?.creator, contract?.status, betAmount, selectedSide, contractId, address, config]);

  // Show explicit feedback when the transaction fails after submission
  useEffect(() => {
    if (isTxError) {
      const msg = txError && txError instanceof Error ? txError.message : 'Transaction failed';
      const details: string[] = [];
      try {
        const balEth = balanceData?.value ? Number(formatEther(balanceData.value)) : 0;
        if (!Number.isNaN(balEth)) details.push(`Wallet balance: ${balEth.toFixed(6)} ETH`);
      } catch {}
      try {
        if (contractData) {
          const c = contractData as Contract;
          if (typeof c.minBetAmount === 'bigint') details.push(`Min bet: ${Number(formatEther(c.minBetAmount)).toFixed(6)} ETH`);
          if (typeof c.maxBetAmount === 'bigint') details.push(`Max bet: ${Number(formatEther(c.maxBetAmount)).toFixed(6)} ETH`);
        }
      } catch {}
      details.push(`Reason: ${msg.length > 160 ? msg.slice(0,160) + '…' : msg}`);
      setBetError({ title: 'Bet failed', details });
      setHasShownSubmitted(false);
    }
  }, [isTxError, txError, contractData, balanceData]);

  // Show a submitted state as soon as we get a hash (helps mini-app users)
  useEffect(() => {
    if (hash && !hasShownSubmitted) {
      setHasShownSubmitted(true);
    }
  }, [hash, hasShownSubmitted]);


  // Track page view when contract data becomes available
  useEffect(() => {
    if (contractData) {
      const c = contractData as Contract;
      console.log('[Bet Debug] contract minBetAmount (wei):', c.minBetAmount?.toString?.());
      trackPageView('agreement_detail', {
        debate_id: String(contractId),
        debate_topic: c.topic,
        status: (c.status === 0 ? 'open' : c.status === 1 ? 'closed' : 'resolved'),
      });
      trackDebateEvent(EVENTS.AGREEMENT_PAGE_ACCESSED, {
        debate_id: String(contractId),
        debate_topic: c.topic,
        creator: c.creator,
        status: (c.status === 0 ? 'open' : c.status === 1 ? 'closed' : 'resolved'),
      });
    }
  }, [contractData, contractId, trackPageView, trackDebateEvent]);

  // Calculate odds
  const calculateOdds = (sidePool: bigint, loserPool: bigint) => {
    if (sidePool === BigInt(0)) return "--";
    if (loserPool === BigInt(0)) return "1.0";
    
    const platformFee = (loserPool * BigInt(5)) / BigInt(100);
    const poolAfterPlatformFee = loserPool - platformFee;
    const creatorReward = (poolAfterPlatformFee * BigInt(1)) / BigInt(100);
    const finalPrizePool = poolAfterPlatformFee - creatorReward;
    
    const odds = (Number(sidePool) + Number(finalPrizePool)) / Number(sidePool);
    return odds.toFixed(1);
  };

  // Handle betting
  const handleBet = async () => {
    if (!selectedSide || !betAmount || !isConnected) return;
    
    try {
      setHasShownSubmitted(false);
      // Ensure we're on the correct chain before transaction
      const ok = await ensureCorrectChain();
      if (!ok) { return; }
      
      const amount = parseEther(betAmount);
      // Client-side gating: block if wallet balance < bet amount (value)
      if (balanceData?.value !== undefined && balanceData.value < amount) {
        const balEth = Number(formatEther(balanceData.value));
        const amtEth = Number(betAmount);
        const details = [
          `Wallet balance: ${balEth.toFixed(6)} ETH`,
          `Attempted amount: ${amtEth.toFixed(6)} ETH`,
        ];
        setBetError({ title: 'Insufficient funds', details: ["Insufficient ETH to cover the bet amount.", ...details] });
        
        return;
      }
      console.log('[Bet Debug] balance:', balanceData?.value?.toString(), 'betAmount (wei):', amount.toString());
      setLastAction("bet");
      // Track transaction initiated
      trackBetEvent(EVENTS.TRANSACTION_INITIATED, {
        debate_id: String(contractId),
        side: selectedSide === 1 ? "A" : "B",
        amount: parseFloat(betAmount),
      });
      
      await writeContract({
        address: AGREEMENT_FACTORY_ADDRESS as `0x${string}`,
        abi: AGREEMENT_FACTORY_ABI,
        functionName: "simpleBet",
        args: [BigInt(contractId), selectedSide],
        value: amount,
        chainId: baseSepolia.id,
      });
    } catch (err) {
      
      // Check if user rejected the transaction
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected') || 
          errorMessage.includes('User denied') || errorMessage.includes('user denied')) {
        // Don't track analytics for user rejections, it's a normal action
        console.log("User cancelled the betting transaction");
        return;
      }
      console.error("Error placing bet:", err);
      
      // Show error toast for actual failures
      // Toast removed

      // Build detailed state message for the modal
      const details: string[] = [];
      try {
        const balEth = balanceData?.value ? Number(formatEther(balanceData.value)) : 0;
        const amtEth = Number(betAmount);
        if (!Number.isNaN(balEth)) details.push(`Wallet balance: ${balEth.toFixed(6)} ETH`);
        if (!Number.isNaN(amtEth)) details.push(`Attempted amount: ${amtEth.toFixed(6)} ETH`);
      } catch {}
      try {
        if (contractData) {
          const c = contractData as Contract;
          if (typeof c.minBetAmount === 'bigint') {
            details.push(`Min bet: ${Number(formatEther(c.minBetAmount)).toFixed(6)} ETH`);
          }
          if (typeof c.maxBetAmount === 'bigint') {
            details.push(`Max bet: ${Number(formatEther(c.maxBetAmount)).toFixed(6)} ETH`);
          }
          const statusText = c.status === 0 ? 'open' : c.status === 1 ? 'closed' : 'resolved';
          details.push(`Contract status: ${statusText}`);
        }
      } catch {}
      // Add a compact reason from RPC error
      const compact = errorMessage.length > 160 ? errorMessage.slice(0, 160) + '…' : errorMessage;
      details.push(`Reason: ${compact}`);
      setBetError({ title: 'Bet failed', details });
      
      
      // Only track actual failures (not user cancellations)
      trackBetEvent(EVENTS.TRANSACTION_FAILED, {
        debate_id: String(contractId),
        side: selectedSide === 1 ? "A" : "B",
        amount: parseFloat(betAmount),
      });
    }
  };

  // Handle comment
  const handleComment = async () => {
    if (!comment.trim() || !isConnected) return;
    
    try {
      // Ensure we're on the correct chain before transaction
      const ok = await ensureCorrectChain();
      if (!ok) { return; }
      
      setLastAction("comment");
      // Track transaction initiated for comment
      trackDebateEvent(EVENTS.TRANSACTION_INITIATED, {
        debate_id: String(contractId),
        debate_topic: contract?.topic || "",
        creator: contract?.creator || "",
        status: (contract?.status === 0 ? "open" : contract?.status === 1 ? "closed" : "resolved"),
      });
      await writeContract({
        address: AGREEMENT_FACTORY_ADDRESS as `0x${string}`,
        abi: AGREEMENT_FACTORY_ABI,
        functionName: "addComment",
        args: [BigInt(contractId), comment.trim()],
        chainId: baseSepolia.id,
      });
    } catch (err) {
      console.error("Error adding comment:", err);
      
      // Check if user rejected the transaction
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected') || 
          errorMessage.includes('User denied') || errorMessage.includes('user denied')) {
        // Don't track analytics for user rejections, it's a normal action
        console.log("User cancelled the comment transaction");
        return;
      }
      
      // Only track actual failures (not user cancellations)
      trackDebateEvent(EVENTS.TRANSACTION_FAILED, {
        debate_id: String(contractId),
        debate_topic: contract?.topic || "",
        creator: contract?.creator || "",
        status: (contract?.status === 0 ? "open" : contract?.status === 1 ? "closed" : "resolved"),
      });
    }
  };

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-1000 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalPool = contract.totalPoolA + contract.totalPoolB;
  const poolAPercentage = totalPool > BigInt(0) ? Number((contract.totalPoolA * BigInt(100)) / totalPool) : 50;
  const poolBPercentage = 100 - poolAPercentage;
  
  const oddsA = calculateOdds(contract.totalPoolA, contract.totalPoolB);
  const oddsB = calculateOdds(contract.totalPoolB, contract.totalPoolA);

  return (
    <div className="min-h-screen bg-gray-1000">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-1000 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="text-white hover:text-primary transition-colors p-2"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-1.5">
            <img src="/assets/icons/logo.svg" alt="Agora" className="w-[18px] h-[18px] sm:w-6 sm:h-6" />
            <span className="text-white text-lg sm:text-xl font-bold">agora</span>
          </div>
          
          <div className="w-10 sm:w-12"></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Author and timestamp */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-100">
          <img 
            src="/assets/icons/default_avatar.svg" 
            alt="Profile" 
            className="w-6 h-6"
          />
          <span>{contract.creator.slice(0, 6)}...{contract.creator.slice(-4)}</span>
          <span className="text-gray-800">•</span>
          <span>
            {(() => {
              // Calculate creation time: bettingEndTime - 24 hours (fixed duration)
              const creationTime = Number(contract.bettingEndTime) - (24 * 60 * 60);
              return new Date(creationTime * 1000).toLocaleDateString();
            })()}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
          {contract.topic}
        </h1>

        {/* Description */}
        <p className="text-gray-100 text-base sm:text-lg leading-relaxed mb-8">
          {contract.description}
        </p>

        {/* Betting Options */}
        <BettingOptions 
          partyA={contract.partyA}
          partyB={contract.partyB}
          poolAPercentage={poolAPercentage}
          poolBPercentage={poolBPercentage}
          oddsA={oddsA}
          oddsB={oddsB}
          status={contract.status}
          winner={contract.winner}
        />

        {/* Admin Controls removed */}

        {/* Countdown Timer */}
        {contract.status === 0 && (
          <CountdownTimer 
            endTime={contract.bettingEndTime}
            onEnd={() => {
              if (endNotifiedRef.current) return;
              endNotifiedRef.current = true;
              try {
                const urlBase = process.env.NEXT_PUBLIC_BACKEND_URL;
                if (urlBase) {
                  const url = `${urlBase}/api/oracle/contracts/${contractId}/ended`;
                  // Fire-and-forget with error handling; keepalive increases reliability during unload
                  void fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contractId,
                      endedAt: new Date().toISOString(),
                      bettingEndTime: Number(contract.bettingEndTime ?? 0),
                      chainId: baseSepolia.id,
                    }),
                    cache: 'no-store',
                    keepalive: true,
                  })
                  .then((res) => {
                    if (!res.ok) {
                      console.warn('Backend end-notify responded non-OK:', res.status, res.statusText);
                    }
                  })
                  .catch((e) => {
                    console.warn('Failed to notify backend about debate end', e);
                  });
                }
              } catch (e) {
                console.warn('Failed to notify backend about debate end', e);
              }
            }}
          />
        )}

        {/* Connect Wallet CTA when not connected and open */}
        {!isConnected && contract.status === 0 && (
          <div className="mb-4">
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="w-full h-12 text-base bg-transparent border border-primary text-primary hover:bg-primary hover:text-gray-1000 rounded-xl transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </ConnectButton.Custom>
          </div>
        )}

        {/* Bet Button */}
        {isConnected && contract.status === 0 && (
          <button
            onClick={() => {
              trackBetEvent(EVENTS.TRANSACTION_INITIATED, {
                debate_id: String(contractId),
                side: selectedSide === 1 ? "A" : selectedSide === 2 ? "B" : undefined,
                amount: parseFloat(betAmount) || 0,
              });
              setShowBetModal(true);
            }}
            disabled={!isCorrectChain || isSwitching}
            className="w-full bg-primary text-gray-1000 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 disabled:bg-gray-800 disabled:text-gray-400 transition-colors mb-8"
          >
            {isSwitching ? "Switching Network..." : needsSwitch ? "Wrong Network" : "Bet"}
          </button>
        )}

        {/* Network Warning */}
        {isConnected && needsSwitch && (
          <div className="mb-8 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <p className="text-yellow-400 text-sm text-center">
              Please switch to Base Sepolia network to place bets
            </p>
          </div>
        )}

        {/* Live Debate Card - Show for both open and closed status */}
        <LiveDebateCard 
          commentsCount={comments.length}
          latestComment={comments.length > 0 ? comments[0] : undefined}
          onClick={() => {
            trackDebateEvent(EVENTS.DEBATE_VIEWED, {
              debate_id: String(contractId),
              debate_topic: contract?.topic || "",
              creator: contract?.creator || "",
              status: (contract?.status === 0 ? "open" : contract?.status === 1 ? "closed" : "resolved"),
              time_remaining: "live_debate_panel",
            });
            setShowLiveDebate(true);
          }}
        />

      </div>

      {/* Result to Bottom Section with gray-900 background */}
      <div className="bg-gray-900 -mt-8">
        <div className="max-w-4xl mx-auto px-4 pb-6 sm:pb-8">
          {/* Result Section - Only show when closed */}
          {(contract.status === 1 || contract.status === 2 || contract.status === 3) && (
            <div className="pt-6 sm:pt-8">
              <ResultSection 
                partyA={contract.partyA}
                partyB={contract.partyB}
                winner={contract.winner}
                winnerArguments={winnerArguments}
              />
            </div>
          )}

          {/* Debate TL;DR */}
          <div className={contract.status === 0 ? "pb-24" : ""}>
            <div className="pt-6 sm:pt-8 px-6">
              <h2 className="text-white text-xl font-bold mb-1">Debate TL;DR</h2>
              <p className="text-gray-100 text-sm mb-6">{comments.length} Opinion</p>

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-4" style={{color: '#85E0A3'}}>Viewpoint 1</h3>
                  <div className="space-y-3">
                    {(() => {
                      const side1Comments = commentsWithSide
                        .filter(comment => comment.side === 1)
                        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                        .slice(0, 3);
                      
                      return side1Comments.length > 0 ? (
                        side1Comments.map((comment, index) => (
                          <div key={index} className="border-l-4 pl-4" style={{borderColor: '#009951'}}>
                            <p className="text-gray-100 text-sm leading-relaxed">{comment.content}</p>
                          </div>
                        ))
                      ) : (
                        <div className="border-l-4 pl-4" style={{borderColor: '#009951'}}>
                          <p className="text-gray-400 text-sm leading-relaxed italic">No opinions for this viewpoint yet.</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-4" style={{color: '#F4776A'}}>Viewpoint 2</h3>
                  <div className="space-y-3">
                    {(() => {
                      const side2Comments = commentsWithSide
                        .filter(comment => comment.side === 2)
                        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                        .slice(0, 3);
                      
                      return side2Comments.length > 0 ? (
                        side2Comments.map((comment, index) => (
                          <div key={index} className="border-l-4 pl-4" style={{borderColor: '#F4776A'}}>
                            <p className="text-gray-100 text-sm leading-relaxed">{comment.content}</p>
                          </div>
                        ))
                      ) : (
                        <div className="border-l-4 pl-4" style={{borderColor: '#F4776A'}}>
                          <p className="text-gray-400 text-sm leading-relaxed italic">No opinions for this viewpoint yet.</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Debate Bottom Sheet */}
      <LiveDebateBottomSheet 
        isOpen={showLiveDebate}
        onClose={() => setShowLiveDebate(false)}
        comments={comments}
        commentsCount={comments.length}
        isConnected={isConnected}
        contractStatus={contract.status}
        comment={comment}
        setComment={setComment}
        onSubmitComment={handleComment}
        onBetClick={() => {
          trackBetEvent(EVENTS.TRANSACTION_INITIATED, {
            debate_id: String(contractId),
            side: selectedSide === 1 ? "A" : selectedSide === 2 ? "B" : undefined,
            amount: parseFloat(betAmount) || 0,
          });
          setShowBetModal(true);
        }}
        isPending={isPending}
        isConfirming={isConfirming}
        hasBet={!!hasUserBet}
        isCorrectChain={isCorrectChain}
        isSwitching={isSwitching}
        needsSwitch={needsSwitch}
      />

      {/* Bet Modal */}
      <BetModal 
        isOpen={showBetModal}
        onClose={() => setShowBetModal(false)}
        partyA={contract.partyA}
        partyB={contract.partyB}
        oddsA={oddsA}
        oddsB={oddsB}
        selectedSide={selectedSide}
        setSelectedSide={setSelectedSide}
        onSideSelect={(side) => {
          trackBetEvent(EVENTS.TRANSACTION_INITIATED, {
            debate_id: String(contractId),
            side: side === 1 ? "A" : "B",
            amount: parseFloat(betAmount) || 0,
          });
        }}
        betAmount={betAmount}
        setBetAmount={setBetAmount}
        onBet={handleBet}
        isPending={isPending}
        isConfirming={isConfirming}
        isCorrectChain={isCorrectChain}
        isSwitching={isSwitching}
        needsSwitch={needsSwitch}
        errorTitle={betError?.title}
        errorDetails={betError?.details}
        onClearError={() => setBetError(null)}
        insufficientBalance={(() => { try { const a = parseEther(betAmount); return balanceData?.value !== undefined && balanceData.value < a; } catch { return true; } })()}
        minBet={contract.minBetAmount ? formatEther(contract.minBetAmount) : "0.0002"}
        maxBet={contract.maxBetAmount ? formatEther(contract.maxBetAmount) : "100"}
      />

      {/* Error message (hide benign user-rejected errors) */}
      {(() => {
        const msg = error?.message ?? "";
        const isUserCancel = typeof msg === 'string' && (
          msg.toLowerCase().includes('user rejected') ||
          msg.toLowerCase().includes('user denied')
        );
        if (!msg || isUserCancel) return null;
        return (
          <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto bg-red-500/20 border border-red-500 rounded-xl p-4">
            <p className="text-red-400 text-sm">{msg}</p>
          </div>
        );
      })()}

      {/* Bottom Input Bar - Only show for open status */}
      {contract.status === 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-1000 border-t border-gray-800 p-4">
          <button
            onClick={() => setShowLiveDebate(true)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-left text-gray-400 hover:bg-gray-800 transition-colors flex items-center justify-between"
          >
            <span>Express your opinion...</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      )}

      {/* Toasts removed */}
    </div>
  );
}
