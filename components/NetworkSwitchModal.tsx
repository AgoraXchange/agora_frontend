"use client";

import { useEffect } from "react";

interface NetworkSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchNetwork: () => void;
  isSwitching: boolean;
  error: string | null;
  onResetError: () => void;
  onRetrySwitch?: () => void;
}

export function NetworkSwitchModal({
  isOpen,
  onClose,
  onSwitchNetwork,
  isSwitching,
  error,
  onResetError,
  onRetrySwitch
}: NetworkSwitchModalProps) {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 mx-4 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Wrong Network</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-300">
            Please switch to Base Sepolia network to continue using this application.
          </p>

          {/* Network Details */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Network Name:</span>
                <span className="text-white font-medium">Base Sepolia</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Chain ID:</span>
                <span className="text-white font-medium">84532 (0x14a34)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">RPC URL:</span>
                <span className="text-white font-medium text-xs">https://sepolia.base.org</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-red-300 text-sm font-medium">Network Switch Failed</p>
                  <p className="text-red-400 text-xs mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {error && onRetrySwitch ? (
              <button
                onClick={onRetrySwitch}
                disabled={isSwitching}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Switch
              </button>
            ) : (
              <button
                onClick={onSwitchNetwork}
                disabled={isSwitching}
                className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-gray-1000 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSwitching ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Switching...
                  </>
                ) : (
                  "Switch to Base Sepolia"
                )}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

          {error && (
            <button
              onClick={onResetError}
              className="w-full text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear Error & Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}