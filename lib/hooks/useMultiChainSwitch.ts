import { useCallback, useState } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { monadTestnet, addChainToWallet } from '@/lib/utils/customChains';

export function useMultiChainSwitch() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isAddingChain, setIsAddingChain] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchToChain = useCallback(async (targetChainId: number) => {
    if (!switchChain) {
      setError('Wallet not connected');
      return false;
    }

    setError(null);
    
    try {
      // First, try to switch using wagmi
      await switchChain({ chainId: targetChainId });
      return true;
    } catch (wagmiError: any) {
      console.log('Wagmi switch failed, trying direct MetaMask approach:', wagmiError);
      
      // If wagmi fails, try adding the chain to MetaMask first
      if (targetChainId === monadTestnet.id && window.ethereum) {
        try {
          setIsAddingChain(true);
          
          // Try to switch first
          const chainIdHex = `0x${targetChainId.toString(16)}`;
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: chainIdHex }],
            });
            return true;
          } catch (switchError: any) {
            // If chain doesn't exist (error code 4902), add it
            if (switchError.code === 4902) {
              await addChainToWallet(monadTestnet);
              
              // Try switching again after adding
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }],
              });
              return true;
            }
            throw switchError;
          }
        } catch (addError: any) {
          console.error('Failed to add/switch to Monad testnet:', addError);
          setError(addError.message || 'Failed to add Monad testnet to wallet');
          return false;
        } finally {
          setIsAddingChain(false);
        }
      }
      
      // For other chains or if no ethereum object
      setError(wagmiError.message || 'Failed to switch network');
      return false;
    }
  }, [switchChain]);

  const switchToBaseSepolia = useCallback(() => {
    return switchToChain(baseSepolia.id);
  }, [switchToChain]);

  const switchToMonadTestnet = useCallback(() => {
    return switchToChain(monadTestnet.id);
  }, [switchToChain]);

  return {
    currentChainId: chainId,
    switchToChain,
    switchToBaseSepolia,
    switchToMonadTestnet,
    isAddingChain,
    error,
    clearError: () => setError(null),
  };
}