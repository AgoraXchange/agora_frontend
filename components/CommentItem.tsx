"use client";

import type { Comment } from "@/types/contract";

interface CommentItemProps {
  comment: Comment;
  index: number;
}

export function CommentItem({ comment, index }: CommentItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-xs text-gray-1000 font-bold">
          {comment.commenter.slice(2, 4).toUpperCase()}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white font-medium text-sm">
            {comment.commenter === "James" ? "James" : `${comment.commenter.slice(0, 6)}...${comment.commenter.slice(-4)}`}
          </span>
          <span className="text-gray-100 text-xs">
            {index === 0 ? "43min ago" : `${Math.floor(Math.random() * 24)}h ago`}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-gray-100 text-xs">{24 - index}</span>
          </div>
        </div>
        <p className="text-gray-100 text-sm leading-relaxed">{comment.content}</p>
        <button className="text-primary text-xs mt-2 hover:text-primary/80">
          13 replies →
        </button>
      </div>
    </div>
  );
}