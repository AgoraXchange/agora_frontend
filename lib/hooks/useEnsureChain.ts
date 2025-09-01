import { useEffect, useState, useCallback } from 'react';
import { useChainId, useSwitchChain, useConfig } from 'wagmi';
import { getChainId } from 'wagmi/actions';
import { baseSepolia } from 'wagmi/chains';

interface EnsureChainState {
  isCorrectChain: boolean;
  isSwitching: boolean;
  error: string | null;
  needsSwitch: boolean;
  switchNetwork: () => void;
  resetError: () => void;
  retrySwitch: () => void;
  autoSwitchEnabled: boolean;
  setAutoSwitchEnabled: (enabled: boolean) => void;
  ensureCorrectChain: () => Promise<boolean>;
}

export function useEnsureChain(): EnsureChainState {
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchPending, error: switchError } = useSwitchChain();
  const config = useConfig();
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSwitchAttempted, setAutoSwitchAttempted] = useState(false);
  const [autoSwitchEnabled, setAutoSwitchEnabledState] = useState<boolean>(true);
  const PREF_KEY = 'agora:autoSwitchToSepolia';

  const isCorrectChain = chainId === baseSepolia.id;
  const needsSwitch = chainId !== undefined && !isCorrectChain;

  const switchNetwork = useCallback(async () => {
    if (!switchChain || !chainId) return;
    
    try {
      setIsSwitching(true);
      setError(null);
      console.log(`Switching from chain ${chainId} to Base Sepolia (${baseSepolia.id})`);
      await switchChain({ chainId: baseSepolia.id });
      // Wait until the client actually reports the new chain id
      const start = Date.now();
      while (Date.now() - start < 7000) {
        try {
          const current = getChainId(config);
          if (current === baseSepolia.id) break;
        } catch {}
        await new Promise((r) => setTimeout(r, 150));
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch network';
      setError(errorMessage);
      console.error('Network switch error:', err);
    } finally {
      setIsSwitching(false);
    }
  }, [switchChain, chainId, config]);

  const resetError = () => {
    setError(null);
  };

  const retrySwitch = useCallback(async () => {
    resetError();
    await switchNetwork();
  }, [switchNetwork]);

  const ensureCorrectChain = useCallback(async (): Promise<boolean> => {
    if (isCorrectChain) return true;
    await switchNetwork();
    // Double check via config
    try {
      const current = getChainId(config);
      return current === baseSepolia.id;
    } catch {
      return false;
    }
  }, [isCorrectChain, switchNetwork, config]);

  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(PREF_KEY) : null;
      if (stored === 'false') {
        setAutoSwitchEnabledState(false);
      }
    } catch {}
  }, []);

  // Auto-switch only once when component mounts and chain is detected (if enabled)
  useEffect(() => {
    if (needsSwitch && autoSwitchEnabled && !autoSwitchAttempted && !isSwitching) {
      setAutoSwitchAttempted(true);
      switchNetwork();
    }
  }, [chainId, needsSwitch, autoSwitchEnabled, autoSwitchAttempted, isSwitching, switchNetwork]);

  const setAutoSwitchEnabled = useCallback((enabled: boolean) => {
    setAutoSwitchEnabledState(enabled);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PREF_KEY, String(enabled));
      }
    } catch {}
  }, []);

  // Handle wagmi switch errors
  useEffect(() => {
    if (switchError) {
      setError(switchError.message);
      setIsSwitching(false);
    }
  }, [switchError]);

  // Update switching state from wagmi
  useEffect(() => {
    if (isSwitchPending !== isSwitching) {
      setIsSwitching(isSwitchPending);
    }
  }, [isSwitchPending, isSwitching]);

  return {
    isCorrectChain,
    isSwitching,
    error,
    needsSwitch,
    switchNetwork,
    resetError,
    retrySwitch,
    autoSwitchEnabled,
    setAutoSwitchEnabled,
    ensureCorrectChain
  };
}
