"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useReadContract, useReadContracts, useChainId } from "wagmi";
import { Header } from "@/components/Header";
import { DebateCard } from "@/components/DebateCard";
import { getAgreementFactoryAddress, AGREEMENT_FACTORY_ABI } from "@/lib/agreementFactoryABI";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { EVENTS } from "@/lib/analytics";

interface AgreementContract {
  id: number;
  creator: string;
  topic: string;
  description: string;
  partyA: string;
  partyB: string;
  bettingEndTime: bigint;
  status: number;
  winner: number;
  totalPoolA: bigint;
  totalPoolB: bigint;
  partyRewardPercentage: bigint;
  minBetAmount: bigint;
  maxBetAmount: bigint;
  totalBettors: bigint;
  totalComments: bigint;
}

export default function App() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const router = useRouter();
  const chainId = useChainId();
  const { trackPageView, trackDebateEvent } = useAnalytics();

  // Read contract count
  const { data: agreementCountData } = useReadContract({
    address: getAgreementFactoryAddress(chainId) as `0x${string}`,
    abi: AGREEMENT_FACTORY_ABI,
    functionName: "contractCounter",
  });

  const agreementCount = agreementCountData ? Number(agreementCountData) : 0;
  const agreementIds = Array.from({ length: agreementCount }, (_, i) => i);

  // Prefetch create page on mount and track page view once we have count
  useEffect(() => {
    router.prefetch('/create');
    trackPageView('home', {
      agreement_count: agreementCount
    });
  }, [router, trackPageView, agreementCount]);

  // Read all agreements
  const { data: agreementsData, isLoading } = useReadContracts({
    contracts: agreementIds.map((id) => ({
      address: getAgreementFactoryAddress(chainId) as `0x${string}`,
      abi: AGREEMENT_FACTORY_ABI,
      functionName: "contracts",
      args: [BigInt(id)],
    })),
  });

  const agreements: AgreementContract[] = useMemo(() => {
    if (!agreementsData) return [];
    
    return agreementsData
      .map((result, index) => {
        if (!result.result) return null;
        const data = result.result as unknown as [
          string, // creator
          string, // topic
          string, // description
          string, // partyA
          string, // partyB
          bigint, // bettingEndTime
          number, // status
          number, // winner
          bigint, // totalPoolA
          bigint, // totalPoolB
          bigint, // partyRewardPercentage
          bigint, // minBetAmount
          bigint, // maxBetAmount
          bigint, // totalBettors
          bigint  // totalComments
        ];
        
        return {
          id: index,
          creator: data[0],
          topic: data[1],
          description: data[2],
          partyA: data[3],
          partyB: data[4],
          bettingEndTime: data[5],
          status: data[6],
          winner: data[7],
          totalPoolA: data[8],
          totalPoolB: data[9],
          partyRewardPercentage: data[10],
          minBetAmount: data[11],
          maxBetAmount: data[12],
          totalBettors: data[13],
          totalComments: data[14],
        };
      })
      .filter((agreement): agreement is AgreementContract => agreement !== null)
      .reverse(); // Reverse to show newest first (highest ID first)
  }, [agreementsData]);

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);



  return (
    <div className="min-h-screen bg-gray-1000">
      <Header />
      
      {/* Main content with padding for fixed header */}
      <main className="pt-14 sm:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {/* No debates state */}
          {!isLoading && agreements.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-100 text-lg mb-4">No debates yet</p>
              <button
                onClick={() => {
                  trackDebateEvent(EVENTS.CREATE_PAGE_ACCESSED, {
                    debate_id: '',
                    debate_topic: '',
                    creator: '',
                    status: 'open'
                  });
                  router.push('/create');
                }}
                className="bg-primary text-gray-1000 px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Create the first debate
              </button>
            </div>
          )}

          {/* Debate cards grid */}
          {!isLoading && agreements.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {agreements.map((agreement) => {
                const poolAVotes = Number(agreement.totalPoolA);
                const poolBVotes = Number(agreement.totalPoolB);
                
                const formatTimeRemaining = (endTime: bigint) => {
                  const now = Date.now() / 1000;
                  const end = Number(endTime);
                  
                  if (end <= now) return "Ended";
                  
                  const diff = end - now;
                  const days = Math.floor(diff / 86400);
                  const hours = Math.floor((diff % 86400) / 3600);
                  const minutes = Math.floor((diff % 3600) / 60);
                  
                  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
                  if (hours > 0) return `${hours}h ${minutes}m`;
                  return `${minutes}m`;
                };

                const getStatusLabel = (status: number) => {
                  const statusMap: { [key: number]: string } = {
                    0: "open",
                    1: "closed",
                    2: "resolved",
                    3: "distributed",
                    4: "cancelled",
                  };
                  return statusMap[status] || "unknown";
                };
                
                return (
                  <DebateCard
                    key={agreement.id}
                    id={agreement.id.toString()}
                    status={getStatusLabel(agreement.status) as "open" | "closed"}
                    title={agreement.topic}
                    debatePoints={[
                      agreement.description || "No description available"
                    ]}
                    option1={{
                      label: agreement.partyA,
                      votes: poolAVotes,
                    }}
                    option2={{
                      label: agreement.partyB,
                      votes: poolBVotes,
                    }}
                    creator={agreement.creator}
                    totalVolume={agreement.totalPoolA + agreement.totalPoolB}
                    timeRemaining={formatTimeRemaining(agreement.bettingEndTime)}
                    chainId={chainId}
                    onClick={() => {
                      trackDebateEvent(EVENTS.DEBATE_CARD_CLICKED, {
                        debate_id: agreement.id.toString(),
                        debate_topic: agreement.topic,
                        creator: agreement.creator,
                        status: getStatusLabel(agreement.status) as "open" | "closed" | "resolved",
                        total_volume: Number(agreement.totalPoolA + agreement.totalPoolB),
                        time_remaining: formatTimeRemaining(agreement.bettingEndTime)
                      });
                      router.push(`/agreement/${agreement.id}`);
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Floating action button for mobile */}
          <button
            onClick={() => {
              trackDebateEvent(EVENTS.FLOATING_BUTTON_CLICKED, {
                debate_id: '',
                debate_topic: '',
                creator: '',
                status: 'open'
              });
              router.prefetch('/create');
              router.push('/create');
            }}
            className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-40"
          >
            <svg 
              className="w-6 h-6 text-gray-1000" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}
