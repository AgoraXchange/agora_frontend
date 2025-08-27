"use client";

import type { Comment } from "@/types/contract";

interface LiveDebateCardProps {
  commentsCount: number;
  latestComment?: Comment;
  onClick: () => void;
}

export function LiveDebateCard({ commentsCount, latestComment, onClick }: LiveDebateCardProps) {
  return (
    <div className="mb-8">
      <div 
        className="bg-gray-900 rounded-xl p-4 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={onClick}
      >
        <h2 className="text-white text-xl font-bold mb-1">
          Live Debate <span className="text-gray-100 font-normal text-xs">{commentsCount.toLocaleString()}</span>
        </h2>
        {latestComment && (
          <div className="text-gray-100 text-sm mt-3">
            &quot;{latestComment.content}&quot;
          </div>
        )}
      </div>
    </div>
  );
}