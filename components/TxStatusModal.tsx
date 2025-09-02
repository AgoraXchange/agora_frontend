"use client";

import React from "react";

type Phase = "signing" | "submitted" | "confirming" | "success" | "error";

interface TxStatusModalProps {
  isOpen: boolean;
  phase: Phase;
  hash?: string;
  network?: "base-sepolia" | "base";
  errorTitle?: string;
  errorDetails?: string[];
  onClose: () => void;
}

export function TxStatusModal({
  isOpen,
  phase,
  hash,
  network = "base-sepolia",
  errorTitle,
  errorDetails,
  onClose,
}: TxStatusModalProps) {
  if (!isOpen) return null;

  const explorerBase = network === "base-sepolia" ? "https://sepolia.basescan.org" : "https://basescan.org";
  const shortHash = hash ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : "";

  const renderIcon = () => {
    if (phase === "success") {
      return (
        <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    if (phase === "error") {
      return (
        <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-spin">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  };

  const renderTitle = () => {
    if (phase === "success") return "Bet Confirmed";
    if (phase === "error") return errorTitle || "Bet Failed";
    if (phase === "submitted") return "Transaction Submitted";
    if (phase === "confirming") return "Awaiting Confirmation";
    return "Awaiting Signature";
  };

  const renderSubtitle = () => {
    if (phase === "success") return "Your transaction is finalized on Base Sepolia.";
    if (phase === "error") return "Something went wrong submitting or confirming your transaction.";
    if (phase === "submitted") return "We received your transaction. Waiting for confirmations…";
    if (phase === "confirming") return "Processing on-chain. This can take a moment.";
    return "Please sign in your wallet to continue.";
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-[100001] w-[92%] max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col items-center text-center gap-3">
          {renderIcon()}
          <h3 className="text-white text-lg font-semibold">{renderTitle()}</h3>
          <p className="text-gray-300 text-sm">{renderSubtitle()}</p>

          {hash && (
            <a
              href={`${explorerBase}/tx/${hash}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 text-primary text-xs underline underline-offset-2"
            >
              View on Basescan {shortHash}
            </a>
          )}

          {phase === "error" && Array.isArray(errorDetails) && errorDetails.length > 0 && (
            <div className="w-full mt-2 text-left bg-red-900/20 border border-red-700 rounded-lg p-3 max-h-40 overflow-auto">
              <ul className="list-disc list-inside text-red-200 text-xs space-y-1">
                {errorDetails.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            {hash && (
              <a
                href={`${explorerBase}/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm border border-gray-700 hover:bg-gray-700"
              >
                Open Explorer
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-primary text-gray-1000 text-sm font-medium hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

