"use client";

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { initMixpanel, isAnalyticsEnabled } from '@/lib/mixpanel';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { EVENTS } from '../lib/analytics';
import { WalletAnalytics } from './WalletAnalytics';

interface AnalyticsContextType {
  isEnabled: boolean;
  initialized: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  isEnabled: false,
  initialized: false
});

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { context, isFrameReady } = useMiniKit();
  const { track, autoIdentify } = useAnalytics();

  useEffect(() => {
    // Initialize Mixpanel when the component mounts
    const initialized = initMixpanel();
    
    if (initialized && isAnalyticsEnabled()) {
      // Track app loaded event
      track(EVENTS.APP_LOADED, {
        initialized_at: Date.now(),
        has_context: Boolean(context),
        frame_ready: isFrameReady
      });

      console.log('Analytics provider initialized');
    }
  }, [track, context, isFrameReady]);

  useEffect(() => {
    // Track frame ready event
    if (isFrameReady && isAnalyticsEnabled()) {
      track(EVENTS.FRAME_READY, {
        context_available: Boolean(context),
        user_fid: context?.user?.fid,
        frame_added: context?.client?.added
      });
    }
  }, [isFrameReady, track, context]);

  useEffect(() => {
    // Auto-identify user when context becomes available
    if (context && isAnalyticsEnabled()) {
      autoIdentify();
    }
  }, [context, autoIdentify]);

  const contextValue: AnalyticsContextType = {
    isEnabled: isAnalyticsEnabled(),
    initialized: true
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
      {/* Wallet connect/disconnect analytics listener */}
      <WalletAnalytics />
    </AnalyticsContext.Provider>
  );
}

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};
