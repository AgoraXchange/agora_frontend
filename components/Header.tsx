"use client";

import { useState } from "react";
import { 
  ConnectWallet, 
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect 
} from "@coinbase/onchainkit/wallet";
import { Name, Address } from "@coinbase/onchainkit/identity";
import Link from "next/link";
import { base } from "wagmi/chains";
import { useAccount, useChainId } from "wagmi";
import { useEnsureChain } from "@/lib/hooks/useEnsureChain";
import { NetworkSwitchModal } from "./NetworkSwitchModal";
import { getNetworkName, getNetworkStatusColor, getNetworkShortName, isBaseSepolia } from "@/lib/utils/network";

interface HeaderProps {
  saveFrameButton?: React.ReactNode;
}

export function Header({ saveFrameButton }: HeaderProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { needsSwitch, switchNetwork, isSwitching, error, resetError } = useEnsureChain();
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

            {/* Right side - Network, Wallet & Save */}
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              {/* Network Status Indicator */}
              {chainId && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isBaseSepolia(chainId) ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className={`hidden sm:inline text-xs font-medium ${getNetworkStatusColor(chainId)} whitespace-nowrap`}>
                      {getNetworkName(chainId)}
                    </span>
                    {/* Mobile: Show distinct short name to distinguish Base networks */}
                    <span className={`sm:hidden text-xs font-medium ${getNetworkStatusColor(chainId)}`}>
                      {getNetworkShortName(chainId)}
                    </span>
                  </div>
                  
                  {/* Switch Network Button */}
                  {needsSwitch && (
                    <button
                      onClick={() => setShowNetworkModal(true)}
                      className="text-[10px] sm:text-xs bg-red-600 hover:bg-red-700 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded transition-colors whitespace-nowrap"
                    >
                      Switch
                    </button>
                  )}
                </div>
              )}

              {saveFrameButton}
              
              <Wallet className="z-10 flex-shrink-0">
                <ConnectWallet className="!h-8 sm:!h-10 !px-2 sm:!px-4 !text-xs sm:!text-sm !bg-transparent !border !border-primary !text-primary hover:!bg-primary hover:!text-gray-1000 !rounded-lg transition-colors !min-w-0">
                  <Name 
                    className="text-inherit truncate" 
                    chain={base}  // Check Base Name on mainnet
                  />
                </ConnectWallet>
                <WalletDropdown>
                  <Name 
                    address={address}
                    chain={base}  // Check Base Name on mainnet
                  />
                  <Address address={address} />
                  <WalletDropdownLink icon="wallet" href="https://wallet.coinbase.com">
                    Go to Wallet
                  </WalletDropdownLink>
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </Wallet>
            </div>
          </div>
        </div>
      </div>

      {/* Network Switch Modal */}
      <NetworkSwitchModal
        isOpen={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        onSwitchNetwork={switchNetwork}
        isSwitching={isSwitching}
        error={error}
        onResetError={resetError}
      />
    </header>
  );
}