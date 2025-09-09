"use client";

import { useState } from "react";
import { useChainId } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { monadTestnet } from "@/lib/utils/customChains";
import { useMultiChainSwitch } from "@/lib/hooks/useMultiChainSwitch";
import { getNetworkShortName } from "@/lib/utils/network";

const supportedChains = [
  { id: monadTestnet.id, name: "Monad Testnet", icon: null, logo: "/assets/icons/monad_logo.svg" },
];

export function NetworkSelector() {
  const chainId = useChainId();
  const [isOpen, setIsOpen] = useState(false);
  const { switchToChain, isAddingChain, error, clearError } = useMultiChainSwitch();

  const currentChain = supportedChains.find(c => c.id === chainId);
  const isSupported = !!currentChain;

  const handleChainSelect = async (targetChainId: number) => {
    if (targetChainId === chainId) {
      setIsOpen(false);
      return;
    }

    const success = await switchToChain(targetChainId);
    if (success) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
          ${isSupported 
            ? 'bg-gray-800 hover:bg-gray-700 text-white' 
            : 'bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-700'
          }
        `}
      >
        {currentChain?.logo ? (
          <img 
            src={currentChain.logo} 
            alt={`${currentChain.name} logo`}
            className="w-5 h-5"
          />
        ) : (
          <span className="text-lg">
            {currentChain?.icon || "⚠️"}
          </span>
        )}
        <span className="hidden sm:inline">
          {currentChain?.name || "Unsupported Network"}
        </span>
        <span className="sm:hidden">
          {getNetworkShortName(chainId)}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-20 bg-gray-900 border border-gray-700 rounded-lg shadow-xl min-w-[200px]">
            <div className="p-2">
              <div className="text-xs text-gray-400 px-3 py-1 mb-1">Select Network</div>
              {supportedChains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => handleChainSelect(chain.id)}
                  disabled={isAddingChain}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                    ${chain.id === chainId
                      ? 'bg-primary/20 text-primary'
                      : 'hover:bg-gray-800 text-white'
                    }
                    ${isAddingChain ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {chain.logo ? (
                    <img 
                      src={chain.logo} 
                      alt={`${chain.name} logo`}
                      className="w-5 h-5"
                    />
                  ) : (
                    <span className="text-lg">{chain.icon}</span>
                  )}
                  <span className="flex-1 text-left">{chain.name}</span>
                  {chain.id === chainId && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {error && (
              <div className="border-t border-gray-700 p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs text-red-400">{error}</p>
                    <button
                      onClick={clearError}
                      className="text-xs text-gray-400 hover:text-white mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isAddingChain && (
              <div className="border-t border-gray-700 p-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding network to wallet...
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}