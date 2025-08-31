"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId } from "wagmi";
import { parseEther } from "viem";
import { baseSepolia } from "wagmi/chains";
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

export default function AgreementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = parseInt(params.id as string);
  
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  useEnsureChain(); // Auto switch to Base Sepolia
  const [comment, setComment] = useState("");
  const [showBetModal, setShowBetModal] = useState(false);
  const [showLiveDebate, setShowLiveDebate] = useState(false);
  const [selectedSide, setSelectedSide] = useState<1 | 2 | null>(null);
  const [betAmount, setBetAmount] = useState("0.001");
  const [lastAction, setLastAction] = useState<"bet" | "comment" | null>(null);
  const { trackDebateEvent, trackBetEvent, trackPageView } = useAnalytics();
  const [winnerArguments, setWinnerArguments] = useState<{
    Jury1: string;
    Jury2: string;
    Jury3: string;
    Conclusion: string;
  } | null>(null);
  
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
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const contract = contractData as Contract;
  const comments = (commentsData as unknown as Comment[][])?.[0] || [];
  
  
  // 댓글에 side 정보 추가
  const commentsWithSide = comments.map((comment) => ({
    ...comment,
    side: comment.side || (comment.commenter.slice(-1).charCodeAt(0) % 2 === 0 ? 1 : 2) // 임시로 주소 기반으로 side 결정
  }));

  // Fetch winner arguments when contract is settled
  useEffect(() => {
    const fetchWinnerArguments = async () => {
      console.log('🔍 Checking contract status:', contract?.status);
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
      } else {
        console.log('⏳ Contract not settled yet or not available');
      }
    };

    fetchWinnerArguments();
  }, [contract, contractId]);

  useEffect(() => {
    if (isSuccess) {
      // Track transaction completed for last action
      if (lastAction === "bet") {
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
      }

      refetchContract();
      refetchComments();
      refetchUserBet();
      setShowBetModal(false);
      setSelectedSide(null);
      setBetAmount("0.001");
      setComment("");
      setLastAction(null);
    }
  }, [isSuccess, refetchContract, refetchComments, refetchUserBet, lastAction, trackBetEvent, trackDebateEvent, contract?.topic, contract?.creator, contract?.status, betAmount, selectedSide, contractId]);

  // Track page view when contract data becomes available
  useEffect(() => {
    if (contractData) {
      const c = contractData as Contract;
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
      // Switch to Base Sepolia if not on the right chain
      if (chainId !== baseSepolia.id) {
        await switchChain({ chainId: baseSepolia.id });
      }
      
      const amount = parseEther(betAmount);
      setLastAction("bet");
      // Track transaction initiated
      trackBetEvent(EVENTS.TRANSACTION_INITIATED, {
        debate_id: String(contractId),
        side: selectedSide === 1 ? "A" : "B",
        amount: parseFloat(betAmount),
      });
      
      writeContract({
        address: AGREEMENT_FACTORY_ADDRESS as `0x${string}`,
        abi: AGREEMENT_FACTORY_ABI,
        functionName: "simpleBet",
        args: [BigInt(contractId), selectedSide],
        value: amount,
        chainId: baseSepolia.id,
      });
    } catch (err) {
      console.error("Error placing bet:", err);
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
      // Switch to Base Sepolia if not on the right chain
      if (chainId !== baseSepolia.id) {
        await switchChain({ chainId: baseSepolia.id });
      }
      
      setLastAction("comment");
      // Track transaction initiated for comment
      trackDebateEvent(EVENTS.TRANSACTION_INITIATED, {
        debate_id: String(contractId),
        debate_topic: contract?.topic || "",
        creator: contract?.creator || "",
        status: (contract?.status === 0 ? "open" : contract?.status === 1 ? "closed" : "resolved"),
      });
      writeContract({
        address: AGREEMENT_FACTORY_ADDRESS as `0x${string}`,
        abi: AGREEMENT_FACTORY_ABI,
        functionName: "addComment",
        args: [BigInt(contractId), comment.trim()],
        chainId: baseSepolia.id,
      });
    } catch (err) {
      console.error("Error adding comment:", err);
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
          <span>{new Date().toLocaleDateString()}</span>
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

        {/* Countdown Timer */}
        {contract.status === 0 && (
          <CountdownTimer endTime={contract.bettingEndTime} />
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
            className="w-full bg-primary text-gray-1000 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors mb-8"
          >
            Bet
          </button>
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
      />

      {/* Error message */}
      {error && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto bg-red-500/20 border border-red-500 rounded-xl p-4">
          <p className="text-red-400 text-sm">{error.message}</p>
        </div>
      )}

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
    </div>
  );
}
