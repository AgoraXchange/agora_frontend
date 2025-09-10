'use client';

import { useState } from 'react';
import { requestSpendPermission } from '@base-org/account/spend-permission';
import { createBaseAccountSDK } from '@base-org/account';
import { useAccount, useChainId, useSwitchChain, useWalletClient } from 'wagmi';
import { getTokenAddress, parseETHAmount } from '@/lib/spend-permissions';

interface SpendPermissionSetupProps {
  onPermissionGranted?: () => void;
}

export function SpendPermissionSetup({ onPermissionGranted }: SpendPermissionSetupProps) {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const [dailyLimit, setDailyLimit] = useState(0.01); // Default 0.01 ETH daily limit
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSetup, setIsSetup] = useState(false);

  const handleSetupPermission = async () => {
    if (!userAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting spend permission setup for chain:', chainId);
      
      // Check if we're on Base Sepolia (84532) and switch if needed
      if (chainId !== 84532) {
        console.log('Wrong chain, switching to Base Sepolia...');
        try {
          await switchChain({ chainId: 84532 });
          // Wait a moment for the switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (switchError) {
          console.error('Failed to switch chain:', switchError);
          throw new Error('Please manually switch to Base Sepolia network in your wallet');
        }
      }

      // Get or create server wallet address for the AI agent
      const walletResponse = await fetch('/api/ai/wallet', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress })
      });
      
      if (!walletResponse.ok) {
        throw new Error('Failed to create AI agent wallet');
      }

      const { agentWalletAddress } = await walletResponse.json();
      console.log('Got agent wallet address:', agentWalletAddress);

      const tokenAddress = getTokenAddress(chainId, false);
      const allowanceWei = parseETHAmount(dailyLimit);
      
      console.log('Requesting spend permission with:', {
        account: userAddress,
        spender: agentWalletAddress,
        token: tokenAddress,
        chainId,
        allowance: allowanceWei.toString(),
        dailyLimit
      });

      // Use Wagmi wallet client as provider
      if (!walletClient) {
        throw new Error('Wallet client not available. Please ensure your wallet is connected.');
      }
      
      console.log('Using Wagmi wallet client as provider');

      console.log('Attempting to request spend permission...');
      
      let permission;
      
      // Create a minimal Base Account SDK just for the requestSpendPermission function
      try {
        const baseSDK = createBaseAccountSDK({
          appName: "Agora AI Agent",
        });
        
        permission = await requestSpendPermission({
          account: userAddress as `0x${string}`,
          spender: agentWalletAddress as `0x${string}`,
          token: tokenAddress as `0x${string}`, // Use WETH
          chainId: 84532, // Base Sepolia
          allowance: allowanceWei,
          periodInDays: 1,
          provider: baseSDK.getProvider(), // Use Base Account SDK provider
        });
        
        console.log('Spend permission granted successfully!', permission);
      } catch (baseSDKError) {
        console.error('Base Account SDK approach failed, trying with Wagmi wallet client:', baseSDKError);
        
        // Fallback: try with Wagmi wallet client
        permission = await requestSpendPermission({
          account: userAddress as `0x${string}`,
          spender: agentWalletAddress as `0x${string}`,
          token: tokenAddress as `0x${string}`,
          chainId: 84532,
          allowance: allowanceWei,
          periodInDays: 1,
          provider: walletClient, // Use Wagmi wallet client
        });
        
        console.log('Spend permission granted with Wagmi wallet client!', permission);
      }

      // Store permission for this session
      localStorage.setItem('agora_spend_permission', JSON.stringify({
        permission,
        agentWalletAddress,
        dailyLimit,
        timestamp: Date.now()
      }));

      setIsSetup(true);
      onPermissionGranted?.();
    } catch (err) {
      console.error('Permission setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup permission');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSetup) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h3 className="font-semibold text-green-800">AI Agent Enabled</h3>
        </div>
        <p className="text-sm text-green-700">
          You've granted the AI agent permission to bet up to {dailyLimit} ETH per day on your behalf.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Enable AI Agent Betting</h3>
      <p className="text-sm text-gray-600 mb-4">
        Grant the AI agent permission to place bets on your behalf with a daily spending limit.
      </p>
      
      <div className="mb-4">
        <label htmlFor="dailyLimit" className="block text-sm font-medium text-gray-700 mb-2">
          Daily Spending Limit (ETH)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Ξ</span>
          <input
            id="dailyLimit"
            type="number"
            min="0.001"
            max="1"
            step="0.001"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(Number(e.target.value))}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <span className="text-sm text-gray-500">ETH per day</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Recommended: 0.01 - 0.1 ETH for safe betting
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleSetupPermission}
        disabled={isLoading || !userAddress}
        className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
          isLoading || !userAddress
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Setting up...' : 'Grant Permission'}
      </button>

      {!userAddress && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Connect your wallet to enable AI agent
        </p>
      )}
    </div>
  );
}