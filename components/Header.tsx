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
import { getNetworkName, getNetworkStatusColor, isBaseSepolia } from "@/lib/utils/network";

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
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 cursor-pointer">
              <img 
                src="/assets/icons/logo.svg" 
                alt="Agora Logo" 
                className="w-[18px] h-[18px] sm:w-6 sm:h-6"
              />
              <span className="text-white text-xl sm:text-2xl font-bold">agora</span>
            </Link>

            {/* Right side - Network, Wallet & Save */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Network Status Indicator */}
              {chainId && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isBaseSepolia(chainId) ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className={`text-xs sm:text-sm font-medium ${getNetworkStatusColor(chainId)}`}>
                      {getNetworkName(chainId)}
                    </span>
                  </div>
                  
                  {/* Switch Network Button */}
                  {needsSwitch && (
                    <button
                      onClick={() => setShowNetworkModal(true)}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
                    >
                      Switch
                    </button>
                  )}
                </div>
              )}

              {saveFrameButton}
              
              <Wallet className="z-10">
                <ConnectWallet className="!h-8 sm:!h-10 !px-3 sm:!px-4 !text-xs sm:!text-sm !bg-transparent !border !border-primary !text-primary hover:!bg-primary hover:!text-gray-1000 !rounded-lg transition-colors">
                  <Name 
                    className="text-inherit" 
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