"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { AGREEMENT_FACTORY_ADDRESS, AGREEMENT_FACTORY_ABI } from "@/lib/agreementFactoryABI";

interface Comment {
  commenter: string;
  content: string;
  timestamp: bigint;
  likes: bigint;
}

export default function AgreementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = parseInt(params.id as string);
  
  const { address, isConnected } = useAccount();
  const [selectedSide, setSelectedSide] = useState<1 | 2 | null>(null);
  const [betAmount, setBetAmount] = useState("0.0002");
  const [comment, setComment] = useState("");
  
  // Contract data
  const { data: contractData, refetch: refetchContract } = useReadContract({
    address: AGREEMENT_FACTORY_ADDRESS,
    abi: AGREEMENT_FACTORY_ABI,
    functionName: "getContract",
    args: [BigInt(contractId)],
  });

  // Comments data
  const { data: commentsData, refetch: refetchComments } = useReadContract({
    address: AGREEMENT_FACTORY_ADDRESS,
    abi: AGREEMENT_FACTORY_ABI,
    functionName: "getComments",
    args: [BigInt(contractId), BigInt(0), BigInt(50)],
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const contract = contractData as any;
  const comments = (commentsData as any)?.[0] || [];

  useEffect(() => {
    if (isSuccess) {
      refetchContract();
      refetchComments();
      setSelectedSide(null);
      setBetAmount("0.0002");
    }
  }, [isSuccess, refetchContract, refetchComments]);


  // Calculate odds (considering platform fees)
  const calculateOdds = (sidePool: bigint, loserPool: bigint) => {
    if (sidePool === BigInt(0)) return "∞";
    if (loserPool === BigInt(0)) return "1.0";
    
    // Apply fees to loser pool
    const platformFee = (loserPool * BigInt(5)) / BigInt(100);  // 5%
    const poolAfterPlatformFee = loserPool - platformFee;
    const creatorReward = (poolAfterPlatformFee * BigInt(1)) / BigInt(100);  // 1%
    const finalPrizePool = poolAfterPlatformFee - creatorReward;
    
    // Calculate odds: (original bet + share of prize pool) / original bet
    const odds = (Number(sidePool) + Number(finalPrizePool)) / Number(sidePool);
    return odds.toFixed(2);
  };

  // Calculate personal expected return for a given bet amount
  const calculatePersonalReturn = (betAmount: string, sidePool: bigint, loserPool: bigint) => {
    if (!betAmount || sidePool === BigInt(0)) return { odds: "1.0", totalReturn: "0", winnings: "0" };
    
    const myBet = parseFloat(betAmount);
    const mySidePool = Number(sidePool) / 1e18;  // Convert to ETH
    const loserPoolEth = Number(loserPool) / 1e18;
    
    if (loserPoolEth === 0) return { odds: "1.0", totalReturn: betAmount, winnings: "0" };
    
    // Apply fees
    const platformFee = loserPoolEth * 0.05;
    const poolAfterPlatformFee = loserPoolEth - platformFee;
    const creatorReward = poolAfterPlatformFee * 0.01;
    const finalPrizePool = poolAfterPlatformFee - creatorReward;
    
    // Calculate my share and returns
    const newSidePool = mySidePool + myBet;  // Pool after my bet
    const myShare = myBet / newSidePool;
    const myWinnings = finalPrizePool * myShare;
    const totalReturn = myBet + myWinnings;
    
    return {
      odds: (totalReturn / myBet).toFixed(2),
      totalReturn: totalReturn.toFixed(4),
      winnings: myWinnings.toFixed(4)
    };
  };

  // Handle betting (using simple betting)
  const handleBet = async () => {
    if (!selectedSide || !betAmount || !isConnected || !address) return;
    
    try {
      const amount = parseEther(betAmount);
      
      writeContract({
        address: AGREEMENT_FACTORY_ADDRESS,
        abi: AGREEMENT_FACTORY_ABI,
        functionName: "simpleBet",
        args: [BigInt(contractId), selectedSide],
        value: amount,
      });
      
      console.log(`Simple bet placed! Choice: ${selectedSide === 1 ? contract.partyA : contract.partyB}`);
    } catch (err) {
      console.error("Error placing bet:", err);
    }
  };

  // Handle comment
  const handleComment = async () => {
    if (!comment.trim() || !isConnected) return;
    
    try {
      writeContract({
        address: AGREEMENT_FACTORY_ADDRESS,
        abi: AGREEMENT_FACTORY_ABI,
        functionName: "addComment",
        args: [BigInt(contractId), comment.trim()],
      });
      setComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  if (!contract) {
    return (
      <div className="min-h-screen bg-[#1C1D21] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const totalPool = contract.totalPoolA + contract.totalPoolB;
  const poolAPercentage = totalPool > BigInt(0) ? Number((contract.totalPoolA * BigInt(100)) / totalPool) : 50;
  const poolBPercentage = 100 - poolAPercentage;
  
  const oddsA = calculateOdds(contract.totalPoolA, contract.totalPoolB);
  const oddsB = calculateOdds(contract.totalPoolB, contract.totalPoolA);
  
  // Calculate personal returns based on current bet amount
  const personalReturnA = calculatePersonalReturn(betAmount, contract.totalPoolA, contract.totalPoolB);
  const personalReturnB = calculatePersonalReturn(betAmount, contract.totalPoolB, contract.totalPoolA);

  return (
    <div className="min-h-screen bg-[#1C1D21]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <button 
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white p-1"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-gray-400 text-sm">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {/* Title and Description */}
        <h1 className="text-white text-2xl font-bold mb-4">{contract.topic}</h1>
        <p className="text-gray-300 text-sm leading-relaxed mb-6">
          {contract.description}
        </p>

        {/* Betting Options */}
        <div className="space-y-4 mb-8">
          {/* Option A */}
          <div className="bg-[#2C2D33] rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">{contract.partyA} ({poolAPercentage.toFixed(1)}%)</span>
              <span className="text-white text-lg font-bold">Odds : {oddsA}x</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${poolAPercentage}%` }}
              />
            </div>
          </div>

          {/* Option B */}
          <div className="bg-[#2C2D33] rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">{contract.partyB} ({poolBPercentage.toFixed(1)}%)</span>
              <span className="text-white text-lg font-bold">Odds : {oddsB}x</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${poolBPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Debate Summary Section */}
        <div className="bg-[#2C2D33] rounded-lg p-4 mb-8">
          <h3 className="text-white font-medium mb-4">Debate Summary</h3>
          <div className="space-y-3">
            <div className="bg-green-900/20 border-l-4 border-green-500 p-3 rounded">
              <h4 className="text-green-400 font-medium text-sm">Viewpoint 1</h4>
              <p className="text-gray-300 text-sm mt-1">
                Support for {contract.partyA} - Based on recent comments and betting patterns.
              </p>
            </div>
            <div className="bg-red-900/20 border-l-4 border-red-500 p-3 rounded">
              <h4 className="text-red-400 font-medium text-sm">Viewpoint 2</h4>
              <p className="text-gray-300 text-sm mt-1">
                Support for {contract.partyB} - Counter-arguments and alternative perspectives.
              </p>
            </div>
          </div>
        </div>

        {/* Betting Interface */}
        {isConnected && contract.status === 0 && (
          <div className="bg-[#2C2D33] rounded-lg p-4 mb-8">
            <h3 className="text-white font-medium mb-4">Place Your Bet</h3>
            
            {/* Side Selection */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setSelectedSide(1)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedSide === 1 
                    ? 'border-green-500 bg-green-500/20 text-green-400' 
                    : 'border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                <div className="font-medium mb-1">Bet on {contract.partyA}</div>
                <div className="text-sm opacity-80">
                  {betAmount} ETH → {personalReturnA.totalReturn} ETH
                </div>
                <div className="text-xs opacity-60">
                  ({personalReturnA.odds}x odds)
                </div>
              </button>
              <button
                onClick={() => setSelectedSide(2)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedSide === 2 
                    ? 'border-red-500 bg-red-500/20 text-red-400' 
                    : 'border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                <div className="font-medium mb-1">Bet on {contract.partyB}</div>
                <div className="text-sm opacity-80">
                  {betAmount} ETH → {personalReturnB.totalReturn} ETH
                </div>
                <div className="text-xs opacity-60">
                  ({personalReturnB.odds}x odds)
                </div>
              </button>
            </div>

            {/* Bet Amount */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">Bet Amount (ETH)</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full bg-[#1C1D21] border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="0.0002"
                step="0.0001"
                min="0"
              />
            </div>

            <button
              onClick={handleBet}
              disabled={!selectedSide || !betAmount || isPending || isConfirming}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {isPending || isConfirming ? "Processing..." : "Vote"}
            </button>
          </div>
        )}

        {/* Live Debate */}
        <div className="bg-[#2C2D33] rounded-lg p-4">
          <h3 className="text-white font-medium mb-4">
            Live Debate
          </h3>
          <div className="text-gray-400 text-sm mb-4">
            {comments.length} Opinion{comments.length !== 1 ? 's' : ''}
          </div>

          {/* Comments List */}
          <div className="max-h-60 overflow-y-auto mb-4 space-y-3">
            {comments.length > 0 ? comments.map((comment: Comment, index: number) => (
              <div key={index} className="bg-[#1C1D21] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">
                      {comment.commenter.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {comment.commenter.slice(0, 6)}...{comment.commenter.slice(-4)}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(Number(comment.timestamp) * 1000).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{comment.content}</p>
              </div>
            )) : (
              <div className="text-gray-500 text-center py-8">
                No comments yet. Be the first to share your opinion!
              </div>
            )}
          </div>

          {/* Comment Input */}
          {isConnected && (
            <div className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1 bg-[#1C1D21] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Express your opinion..."
                maxLength={500}
              />
              <button
                onClick={handleComment}
                disabled={!comment.trim() || isPending || isConfirming}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Comment
              </button>
            </div>
          )}
        </div>

        {/* Transaction Status */}
        {hash && (
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              Transaction submitted: 
              <a 
                href={`https://sepolia.basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                View on Explorer
              </a>
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}