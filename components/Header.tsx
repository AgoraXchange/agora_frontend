"use client";

import { ConnectWallet, Wallet } from "@coinbase/onchainkit/wallet";
import { Name } from "@coinbase/onchainkit/identity";

interface HeaderProps {
  saveFrameButton?: React.ReactNode;
}

export function Header({ saveFrameButton }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-1000 border-b border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-1.5">
              <img 
                src="/assets/icons/logo.svg" 
                alt="Agora Logo" 
                className="w-[18px] h-[18px] sm:w-6 sm:h-6"
              />
              <span className="text-white text-xl sm:text-2xl font-bold">agora</span>
            </div>

            {/* Right side - Wallet & Save */}
            <div className="flex items-center gap-2 sm:gap-4">
              {saveFrameButton}
              
              <Wallet className="z-10">
                <ConnectWallet className="!h-8 sm:!h-10 !px-3 sm:!px-4 !text-xs sm:!text-sm !bg-transparent !border !border-primary !text-primary hover:!bg-primary hover:!text-gray-1000 !rounded-lg transition-colors">
                  <Name className="text-inherit" />
                </ConnectWallet>
              </Wallet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}