import { useEffect } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

export function useEnsureChain() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    // Automatically switch to Base Sepolia if on wrong chain
    if (chainId && chainId !== baseSepolia.id) {
      console.log(`Switching from chain ${chainId} to Base Sepolia (${baseSepolia.id})`);
      switchChain?.({ chainId: baseSepolia.id });
    }
  }, [chainId, switchChain]);

  return chainId === baseSepolia.id;
}