"use client";

import { CommentItem } from "./CommentItem";
import type { Comment } from "@/types/contract";

interface LiveDebateBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  commentsCount: number;
  isConnected: boolean;
  contractStatus: number;
  comment: string;
  setComment: (comment: string) => void;
  onSubmitComment: () => void;
  onBetClick: () => void;
  isPending: boolean;
  isConfirming: boolean;
  hasBet?: boolean;
}

export function LiveDebateBottomSheet({
  isOpen,
  onClose,
  comments,
  commentsCount,
  isConnected,
  contractStatus,
  comment,
  setComment,
  onSubmitComment,
  onBetClick,
  isPending,
  isConfirming,
  hasBet = false,
}: LiveDebateBottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-end z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full bg-gray-900 rounded-t-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-white text-lg font-bold">Live Debate</h2>
          
          {/* Show Bet button only if status is open */}
          {contractStatus === 0 && (
            <button
              onClick={() => {
                onClose();
                onBetClick();
              }}
              className="bg-primary text-gray-1000 px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              Bet
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="p-4">
            <p className="text-gray-100 text-sm mb-4">{commentsCount.toLocaleString()} Opinion</p>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button className="bg-white text-gray-1000 px-4 py-2 rounded-lg font-medium text-sm">
                Latest
              </button>
            </div>
          </div>

          {/* Comments List - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-4">
              {comments.length > 0 ? comments.map((comment, index) => (
                <CommentItem key={index} comment={comment} index={index} />
              )) : (
                <div className="text-gray-100 text-center py-16">
                  No opinions yet. Be the first to share!
                </div>
              )}
            </div>
          </div>

          {/* Comment Input - Only show if connected and status is open */}
          {isConnected && contractStatus === 0 && (
            <div className="border-t border-gray-800 p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => hasBet && setComment(e.target.value)}
                  className={`flex-1 border-0 rounded-xl px-4 py-3 text-sm ${
                    hasBet 
                      ? "bg-gray-800 text-white placeholder-gray-100" 
                      : "bg-gray-800/50 text-gray-400 placeholder-gray-400 cursor-not-allowed"
                  }`}
                  placeholder={hasBet ? "Express your opinion..." : "Betting required before debate"}
                  maxLength={500}
                  disabled={!hasBet}
                />
                <button
                  onClick={onSubmitComment}
                  disabled={!hasBet || !comment.trim() || isPending || isConfirming}
                  className={`p-2 ${
                    hasBet && comment.trim() 
                      ? "text-primary hover:text-primary/80" 
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <img 
                    src="/assets/icons/arrow_right.svg" 
                    alt="Send" 
                    className="w-5 h-5"
                    style={{ 
                      filter: hasBet 
                        ? 'brightness(0) saturate(100%) invert(68%) sepia(86%) saturate(370%) hue-rotate(123deg) brightness(96%) contrast(94%)' 
                        : 'brightness(0) saturate(100%) invert(71%) sepia(0%) saturate(0%) hue-rotate(158deg) brightness(95%) contrast(86%)'
                    }}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}