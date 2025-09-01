"use client";

import { useEffect, useState } from "react";
import { useEnsureChain } from "@/lib/hooks/useEnsureChain";
import { useProviderChain } from "@/lib/hooks/useProviderChain";

export function GlobalNetworkBanner() {
  const {
    needsSwitch,
    switchNetwork,
    isSwitching,
    autoSwitchEnabled,
    setAutoSwitchEnabled,
  } = useEnsureChain();
  const { isMismatch, providerChainId, isCoinbaseBrowser, switchToSepolia, isSwitching: isProvSwitching, switchError } = useProviderChain();

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const bannerKey = "agora:networkBannerDismissed";

  useEffect(() => {
    try {
      const v = typeof window !== "undefined" ? window.sessionStorage.getItem(bannerKey) : null;
      if (v === "true") setBannerDismissed(true);
    } catch {}
  }, []);

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(bannerKey, "true");
      }
    } catch {}
  };

  // Auto-switch the injected provider when a mismatch is detected
  useEffect(() => {
    if (isMismatch) {
      void switchToSepolia();
    }
  }, [isMismatch, switchToSepolia]);

  if (bannerDismissed) return null;

  return (
    <>
      {needsSwitch && (
        <div className="bg-red-900/30 border-b border-red-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-red-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Wrong network. Please switch to Base Sepolia.</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-gray-300">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={autoSwitchEnabled}
                  onChange={(e) => setAutoSwitchEnabled(e.target.checked)}
                />
                Auto-switch
              </label>
              <button
                onClick={switchNetwork}
                disabled={isSwitching}
                className="text-xs bg-primary hover:bg-primary/90 text-gray-1000 px-3 py-1 rounded-md disabled:opacity-60"
              >
                {isSwitching ? "Switching…" : "Switch now"}
              </button>
              <button onClick={dismissBanner} className="text-gray-400 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {!needsSwitch && isMismatch && (
        <div className="bg-amber-900/30 border-b border-amber-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {isProvSwitching ? "Switching wallet to Base Sepolia…" : `Wallet is on ${providerChainId === 8453 ? "Base Mainnet" : providerChainId ?? "unknown"}. Attempting auto-switch.`}
              </span>
              {switchError && (
                <span className="hidden sm:inline text-amber-300/80">{switchError}</span>
              )}
              {isCoinbaseBrowser && (
                <span className="hidden sm:inline text-amber-300/80">(If prompted in Base app, enable Testnets and accept)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={dismissBanner} className="text-gray-400 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
