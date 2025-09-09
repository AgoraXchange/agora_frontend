"use client";

import { CommentItem } from "./CommentItem";
import type { Comment } from "@/types/contract";
import { ConnectButton } from "@rainbow-me/rainbowkit";

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
  isCorrectChain: boolean;
  isSwitching: boolean;
  needsSwitch: boolean;
  chainId?: number;
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
  isCorrectChain,
  isSwitching,
  needsSwitch,
  chainId,
}: LiveDebateBottomSheetProps) {
  if (!isOpen) return null;

  const getNetworkName = (chainId?: number) => {
    if (chainId === 84532) return "Base Sepolia";
    if (chainId === 10143) return "Monad Testnet";
    return "Base Sepolia";
  };

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
                <CommentItem key={index} comment={comment} />
              )) : (
                <div className="text-gray-100 text-center py-16">
                  No opinions yet. Be the first to share!
                </div>
              )}
            </div>
          </div>

          {/* Comment Input or Connect Wallet - Only show if status is open */}
          {contractStatus === 0 && (
            <div className="border-t border-gray-800 p-4">
              {!isConnected ? (
                /* Connect Wallet Button */
                <div className="w-full">
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
              ) : (
                /* Comment Input for connected users */
                <>
                  {/* Network Warning */}
                  {needsSwitch && (
                    <div className="mb-3 p-2 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                      <p className="text-yellow-400 text-xs text-center">
                        Switch to {getNetworkName(chainId)} network to comment
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => hasBet && setComment(e.target.value)}
                      onClick={() => {
                        if (!hasBet) {
                          onClose();
                          onBetClick();
                        }
                      }}
                      className={`flex-1 border-0 rounded-xl px-4 py-3 text-sm ${
                        hasBet 
                          ? "bg-gray-800 text-white placeholder-gray-100" 
                          : "bg-gray-800/50 text-gray-400 placeholder-gray-400 cursor-pointer"
                      }`}
                      placeholder={hasBet ? "Express your opinion..." : "Betting required before debate"}
                      maxLength={500}
                      readOnly={!hasBet}
                    />
                    <button
                      onClick={onSubmitComment}
                      disabled={!hasBet || !comment.trim() || isPending || isConfirming || !isCorrectChain || isSwitching}
                      className={`p-2 ${
                        hasBet && comment.trim() && isCorrectChain && !isSwitching
                          ? "text-primary hover:text-primary/80" 
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <img 
                        src="/assets/icons/arrow_right.svg" 
                        alt="Send" 
                        className="w-5 h-5"
                        style={{ 
                          filter: hasBet && isCorrectChain && !isSwitching
                            ? 'brightness(0) saturate(100%) invert(68%) sepia(86%) saturate(370%) hue-rotate(123deg) brightness(96%) contrast(94%)' 
                            : 'brightness(0) saturate(100%) invert(71%) sepia(0%) saturate(0%) hue-rotate(158deg) brightness(95%) contrast(86%)'
                        }}
                      />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}