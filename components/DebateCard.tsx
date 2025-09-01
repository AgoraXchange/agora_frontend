"use client";

import { formatEther } from "viem";
import { Name } from "@coinbase/onchainkit/identity";
import { baseSepolia } from "wagmi/chains";

interface DebateCardProps {
  id: string;
  status: "open" | "closed";
  title: string;
  debatePoints: string[];
  option1: {
    label: string;
    percentage?: number;
    multiplier?: string;
    votes?: number;
  };
  option2: {
    label: string;
    percentage?: number;
    multiplier?: string;
    votes?: number;
  };
  participants?: number;
  timeRemaining?: string;
  creator?: string;
  totalVolume?: bigint;
  author?: {
    name: string;
    avatar?: string;
  };
  image?: string;
  onClick?: () => void;
}

export function DebateCard({
  status,
  title,
  debatePoints,
  option1,
  option2,
  timeRemaining,
  creator,
  totalVolume,
  image,
  onClick,
}: DebateCardProps) {
  const totalVotes = (option1.votes || 0) + (option2.votes || 0);
  const option1Percentage = totalVotes > 0 ? ((option1.votes || 0) / totalVotes) * 100 : 50;
  const option2Percentage = totalVotes > 0 ? ((option2.votes || 0) / totalVotes) * 100 : 50;

  return (
    <div 
      className="bg-gray-900 rounded-2xl p-4 sm:p-6 cursor-pointer hover:bg-gray-800 transition-colors"
      onClick={onClick}
    >
      {/* Header with status */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          status === "open" 
            ? "bg-white text-gray-1000" 
            : "bg-gray-800 text-gray-100"
        }`}>
          {status === "open" ? "Open" : "Closed"}
        </span>
      </div>

      {/* Image if exists */}
      {image && (
        <div className="mb-4 -mx-4 sm:-mx-6 -mt-1">
          <img 
            src={image} 
            alt={title}
            className="w-full h-48 sm:h-64 object-cover"
          />
        </div>
      )}

      {/* Title */}
      <h3 className="text-white text-lg sm:text-xl font-semibold mb-3">
        {title}
      </h3>

      {/* Debate points */}
      <div className="text-gray-100 text-sm mb-4 space-y-1">
        <p className="font-medium mb-1">Debate points:</p>
        {debatePoints.map((point, index) => (
          <p key={index} className="text-xs sm:text-sm opacity-80">
            {index + 1}) {point}
          </p>
        ))}
      </div>

      {/* Options with voting bar */}
      <div className="space-y-3">
        {/* Option labels */}
        <div className="flex justify-between text-sm sm:text-base">
          <span className="text-gray-100">{option1.label}</span>
          <span className="text-gray-100">{option2.label}</span>
        </div>

        {/* Voting bar */}
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-green-700 transition-all duration-300"
            style={{ width: `${option1Percentage}%` }}
          />
          <div 
            className="absolute right-0 top-0 h-full bg-red-500 transition-all duration-300"
            style={{ width: `${option2Percentage}%` }}
          />
        </div>

        {/* Multipliers or percentages */}
        <div className="flex justify-between text-sm">
          <span className="text-white font-medium">
            {option1.multiplier || `${option1Percentage.toFixed(0)}%`}
          </span>
          <span className="text-white font-medium">
            {option2.multiplier || `${option2Percentage.toFixed(0)}%`}
          </span>
        </div>
      </div>

      {/* Footer with creator and volume */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-2">
          {/* Creator profile */}
          <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
            <img 
              src="/assets/icons/default_avatar.svg" 
              alt="Default Avatar"
              className="w-4 h-4"
            />
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-100">
            {creator ? (
              <Name 
                address={creator as `0x${string}`}
                chain={baseSepolia}
                className="!text-gray-100 text-xs"
              />
            ) : (
              <span>Unknown</span>
            )}
            {totalVolume !== undefined && (
              <>
                <span className="text-gray-800">•</span>
                <span className="text-gray-100">
                  Vol. {parseFloat(formatEther(totalVolume)).toFixed(3)} ETH
                </span>
              </>
            )}
          </div>
        </div>
        
        {timeRemaining && (
          <span className="text-xs sm:text-sm text-gray-100">
            {timeRemaining}
          </span>
        )}
      </div>
    </div>
  );
}
