"use client";

import type { Comment } from "@/types/contract";
import { Name } from "@coinbase/onchainkit/identity";
import { base } from "wagmi/chains";

interface CommentItemProps {
  comment: Comment;
}

export function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
        <img 
          src="/assets/icons/default_avatar.svg" 
          alt="Default Avatar"
          className="w-4 h-4"
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Name 
            address={comment.commenter as `0x${string}`}
            chain={base}
            className="text-white text-sm font-medium"
          />
        </div>
        <p className="text-gray-100 text-sm leading-relaxed">{comment.content}</p>
      </div>
    </div>
  );
}