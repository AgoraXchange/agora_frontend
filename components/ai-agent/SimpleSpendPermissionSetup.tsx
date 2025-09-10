'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';

interface SimpleSpendPermissionSetupProps {
  onPermissionGranted?: () => void;
}

export function SimpleSpendPermissionSetup({ onPermissionGranted }: SimpleSpendPermissionSetupProps) {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const [dailyLimit, setDailyLimit] = useState(0.01);
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
      // For now, we'll simulate the permission setup
      // In production, you would implement the actual spend permission logic
      
      // Get agent wallet address
      const walletResponse = await fetch('/api/ai/wallet', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress })
      });
      
      if (!walletResponse.ok) {
        throw new Error('Failed to create AI agent wallet');
      }

      const { agentWalletAddress } = await walletResponse.json();
      
      // For demo: Store permission info locally
      localStorage.setItem('agora_spend_permission', JSON.stringify({
        userAddress,
        agentWalletAddress,
        dailyLimit,
        chainId,
        timestamp: Date.now(),
        status: 'demo_granted'
      }));

      setIsSetup(true);
      onPermissionGranted?.();
      
      // Show success message
      alert(`Demo: AI Agent permission granted!\n\nDaily Limit: ${dailyLimit} ETH\nAgent Wallet: ${agentWalletAddress}\n\nNote: This is a demo setup. In production, you would sign a real spend permission transaction.`);
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
          <h3 className="font-semibold text-green-800">AI Agent Enabled (Demo)</h3>
        </div>
        <p className="text-sm text-green-700">
          You've granted the AI agent permission to bet up to {dailyLimit} ETH per day on your behalf.
        </p>
        <p className="text-xs text-green-600 mt-2">
          Note: This is a demo setup. Production version would require real spend permission transaction.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Enable AI Agent Betting (Demo)</h3>
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
        {isLoading ? 'Setting up...' : 'Grant Permission (Demo)'}
      </button>

      {!userAddress && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Connect your wallet to enable AI agent
        </p>
      )}
      
      <p className="mt-3 text-xs text-blue-600 bg-blue-50 p-2 rounded">
        💡 Demo Mode: This simulates spend permission setup. Production version would require signing a real blockchain transaction.
      </p>
    </div>
  );
}