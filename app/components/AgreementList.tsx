"use client";

import { useRouter } from "next/navigation";
import { useReadContract, useReadContracts } from "wagmi";
import { AGREEMENT_FACTORY_ADDRESS, AGREEMENT_FACTORY_ABI } from "@/lib/agreementFactoryABI";

interface AgreementContract {
  id: number;
  creator: string;
  topic: string;
  description: string;
  partyA: string;
  partyB: string;
  bettingEndTime: bigint;
  revealEndTime: bigint;
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

interface AgreementCardProps {
  contract: AgreementContract;
  onSelect: (id: number) => void;
}

function AgreementCard({ contract, onSelect }: AgreementCardProps) {
  const totalPool = contract.totalPoolA + contract.totalPoolB;
  const poolAPercentage = totalPool > BigInt(0) ? Number((contract.totalPoolA * BigInt(100)) / totalPool) : 50;
  const poolBPercentage = 100 - poolAPercentage;
  
  const getStatusBadge = (status: number) => {
    const statusMap: { [key: number]: { label: string; color: string } } = {
      0: { label: "Open", color: "bg-green-500" },
      1: { label: "Closed", color: "bg-yellow-500" },
      2: { label: "Resolved", color: "bg-blue-500" },
      3: { label: "Distributed", color: "bg-purple-500" },
      4: { label: "Cancelled", color: "bg-red-500" },
    };
    
    const statusInfo = statusMap[status] || { label: "Unknown", color: "bg-gray-500" };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium text-white rounded-md ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

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

  return (
    <div 
      className="bg-[#2C2D33] rounded-lg p-4 cursor-pointer hover:bg-[#35363C] transition-colors"
      onClick={() => onSelect(contract.id)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          {getStatusBadge(contract.status)}
          <span className="px-2 py-1 text-xs font-medium text-gray-300 bg-[#1C1D21] rounded-md">
            Life
          </span>
        </div>
      </div>

      <h3 className="text-white font-semibold text-lg mb-2">{contract.topic}</h3>
      
      {contract.description && (
        <div className="text-gray-300 text-sm mb-3">
          {contract.description.length > 80 
            ? `${contract.description.substring(0, 80)}...` 
            : contract.description}
        </div>
      )}
      
      <div className="text-gray-400 text-sm mb-3">
        {contract.partyA} vs {contract.partyB}
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">{contract.partyA}</span>
            <span className="text-gray-300">{contract.partyB}</span>
          </div>
          
          <div className="relative h-2 bg-[#1C1D21] rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300"
              style={{ width: `${poolAPercentage}%` }}
            />
            <div 
              className="absolute right-0 top-0 h-full bg-red-500 transition-all duration-300"
              style={{ width: `${poolBPercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm mt-1">
            <span className="text-white font-medium">{poolAPercentage.toFixed(1)}%</span>
            <span className="text-white font-medium">{poolBPercentage.toFixed(1)}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>{contract.totalBettors.toString()}</span>
          </div>
          
          <div className="text-gray-400">
            {contract.status === 0 ? (
              <span className="flex items-center gap-1">
                <span className="text-red-500">-</span>
                {formatTimeRemaining(contract.bettingEndTime)}
              </span>
            ) : (
              <span>Ended</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgreementList() {
  const router = useRouter();
  
  const { data: contractCounter } = useReadContract({
    address: AGREEMENT_FACTORY_ADDRESS,
    abi: AGREEMENT_FACTORY_ABI,
    functionName: "contractCounter",
  });

  const count = contractCounter ? Number(contractCounter) : 0;
  const startIndex = Math.max(0, count - 10);
  
  // Use type assertion to avoid deep type inference
  const contractReads: any = [];
  for (let i = startIndex; i < count; i++) {
    contractReads.push({
      address: AGREEMENT_FACTORY_ADDRESS,
      abi: AGREEMENT_FACTORY_ABI,
      functionName: 'getContract',
      args: [BigInt(i)],
    });
  }

  const { data: contractsData }: { data: any } = useReadContracts({
    contracts: contractReads,
    query: {
      enabled: count > 0,
    },
  } as any);

  const contracts: AgreementContract[] = contractsData
    ? contractsData
        .map((result: any, index: number): AgreementContract | null => {
          if (result?.status === 'success' && result?.result) {
            const data = result.result;
            
            return {
              id: startIndex + index,
              creator: data.creator || '',
              topic: data.topic || '',
              description: data.description || '',
              partyA: data.partyA || '',
              partyB: data.partyB || '',
              bettingEndTime: data.bettingEndTime || BigInt(0),
              revealEndTime: data.revealEndTime || BigInt(0),
              status: data.status || 0,
              winner: data.winner || 0,
              totalPoolA: data.totalPoolA || BigInt(0),
              totalPoolB: data.totalPoolB || BigInt(0),
              partyRewardPercentage: data.partyRewardPercentage || BigInt(0),
              minBetAmount: data.minBetAmount || BigInt(0),
              maxBetAmount: data.maxBetAmount || BigInt(0),
              totalBettors: data.totalBettors || BigInt(0),
              totalComments: data.totalComments || BigInt(0)
            };
          }
          return null;
        })
        .filter((c: any): c is AgreementContract => c !== null)
    : [];

  const handleSelectAgreement = (id: number) => {
    router.push(`/agreement/${id}`);
  };

  if (!contractCounter || Number(contractCounter) === 0) {
    return null; // Don't show anything if there are no agreements
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Active Agreements</h2>
        <div className="text-sm text-gray-400">
          Total: {count} agreements
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contracts.map((contract) => (
          <AgreementCard
            key={contract.id}
            contract={contract}
            onSelect={handleSelectAgreement}
          />
        ))}
      </div>
      
      {contracts.length === 0 && contractsData === undefined && (
        <div className="bg-[#2C2D33] rounded-lg p-8 text-center">
          <p className="text-gray-400">Loading agreements...</p>
        </div>
      )}
    </div>
  );
}