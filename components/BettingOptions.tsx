"use client";

interface BettingOptionsProps {
  partyA: string;
  partyB: string;
  poolAPercentage: number;
  poolBPercentage: number;
  oddsA: string;
  oddsB: string;
  status: number;
  winner: number;
}

export function BettingOptions({
  partyA,
  partyB,
  poolAPercentage,
  poolBPercentage,
  oddsA,
  oddsB,
  status,
  winner,
}: BettingOptionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      {/* Option A */}
      <div className={`rounded-xl p-5 ${
        status === 0 
          ? "bg-green-900" 
          : winner === 1 
            ? "bg-green-900" 
            : "bg-gray-900"
      }`}>
        <div className="text-white/80 text-sm mb-1">
          {partyA}({poolAPercentage.toFixed(0)}%)
        </div>
        <div className="text-white text-lg font-bold">
          Odds : {oddsA}x
        </div>
      </div>

      {/* Option B */}
      <div className={`rounded-xl p-5 ${
        status === 0 
          ? "bg-red-900" 
          : winner === 2 
            ? "bg-red-900" 
            : "bg-gray-900"
      }`}>
        <div className="text-white/80 text-sm mb-1">
          {partyB}({poolBPercentage.toFixed(0)}%)
        </div>
        <div className="text-white text-lg font-bold">
          Odds : {oddsB}x
        </div>
      </div>
    </div>
  );
}