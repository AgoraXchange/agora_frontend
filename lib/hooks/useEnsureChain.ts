import { useEffect, useState, useCallback } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

interface EnsureChainState {
  isCorrectChain: boolean;
  isSwitching: boolean;
  error: string | null;
  needsSwitch: boolean;
  switchNetwork: () => void;
  resetError: () => void;
  retrySwitch: () => void;
}

export function useEnsureChain(): EnsureChainState {
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchPending, error: switchError } = useSwitchChain();
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSwitchAttempted, setAutoSwitchAttempted] = useState(false);

  const isCorrectChain = chainId === baseSepolia.id;
  const needsSwitch = chainId !== undefined && !isCorrectChain;

  const switchNetwork = useCallback(async () => {
    if (!switchChain || !chainId) return;
    
    try {
      setIsSwitching(true);
      setError(null);
      console.log(`Switching from chain ${chainId} to Base Sepolia (${baseSepolia.id})`);
      await switchChain({ chainId: baseSepolia.id });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch network';
      setError(errorMessage);
      console.error('Network switch error:', err);
    } finally {
      setIsSwitching(false);
    }
  }, [switchChain, chainId]);

  const resetError = () => {
    setError(null);
  };

  const retrySwitch = useCallback(async () => {
    resetError();
    await switchNetwork();
  }, [switchNetwork]);

  // Auto-switch only once when component mounts and chain is detected
  useEffect(() => {
    if (needsSwitch && !autoSwitchAttempted && !isSwitching) {
      setAutoSwitchAttempted(true);
      switchNetwork();
    }
  }, [chainId, needsSwitch, autoSwitchAttempted, isSwitching, switchNetwork]);

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
    retrySwitch
  };
}