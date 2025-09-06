"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useEnsureChain } from "@/lib/hooks/useEnsureChain";
import { NetworkSwitchModal } from "./NetworkSwitchModal";

export function Header() {
  const { 
    switchNetwork, 
    isSwitching, 
    error, 
    resetError, 
    retrySwitch
  } = useEnsureChain();
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-1000 border-b border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 min-w-0 gap-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 cursor-pointer flex-shrink-0 min-w-0">
              <img 
                src="/assets/icons/logo.svg" 
                alt="Agora Logo" 
                className="w-[18px] h-[18px] sm:w-6 sm:h-6 flex-shrink-0"
              />
              <span className="text-white text-xl sm:text-2xl font-bold whitespace-nowrap">agora</span>
            </Link>

            {/* Right side - Wallet */}
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  authenticationStatus,
                  mounted,
                }) => {
                  const ready = mounted && authenticationStatus !== 'loading';
                  const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                      authenticationStatus === 'authenticated');

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        'style': {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="px-3 py-1.5 text-xs sm:text-sm bg-transparent border border-primary text-primary hover:bg-primary hover:text-gray-1000 rounded-lg transition-colors min-w-0 flex items-center justify-center"
                            >
                              Connect Wallet
                            </button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                              Wrong network
                            </button>
                          );
                        }

                        return (
                          <div style={{ display: 'flex', gap: 12 }}>
                            <button
                              onClick={openChainModal}
                              style={{ display: 'flex', alignItems: 'center' }}
                              type="button"
                              className="px-2 py-1 text-xs sm:text-sm bg-transparent border border-primary text-primary hover:bg-primary hover:text-gray-1000 rounded-lg transition-colors"
                            >
                              {chain.hasIcon && (
                                <div
                                  style={{
                                    background: chain.iconBackground,
                                    width: 20,
                                    height: 20,
                                    borderRadius: 999,
                                    overflow: 'hidden',
                                    marginRight: 4,
                                  }}
                                >
                                  {chain.iconUrl && (
                                    <img
                                      alt={chain.name ?? 'Chain icon'}
                                      src={chain.iconUrl}
                                      style={{ width: 20, height: 20 }}
                                    />
                                  )}
                                </div>
                              )}
                              {chain.name}
                            </button>

                            <button
                              onClick={openAccountModal}
                              type="button"
                              className="px-3 py-1.5 text-xs sm:text-sm bg-transparent border border-primary text-primary hover:bg-primary hover:text-gray-1000 rounded-lg transition-colors min-w-0 flex items-center justify-center"
                            >
                              {account.displayName}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          </div>
        </div>
      </div>

      {/* Network banners moved to GlobalNetworkBanner in layout */}

      {/* Network Switch Modal */}
      <NetworkSwitchModal
        isOpen={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        onSwitchNetwork={switchNetwork}
        isSwitching={isSwitching}
        error={error}
        onResetError={resetError}
        onRetrySwitch={retrySwitch}
      />
    </header>
  );
}
