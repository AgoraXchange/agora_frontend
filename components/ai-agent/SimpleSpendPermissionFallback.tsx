'use client';

import { useState } from 'react';
import { useAccount, useChainId, useConfig } from 'wagmi';
import { writeContract, waitForTransactionReceipt } from 'wagmi/actions';
import { baseSepolia } from 'viem/chains';
import { parseEther } from 'viem';

interface SimpleSpendPermissionFallbackProps {
  onPermissionGranted?: () => void;
}

const SPEND_PERMISSION_MANAGER_ADDRESS = '0xf85210B21cC50302F477BA56686d2019dC9b67Ad';
const SPEND_PERMISSION_MANAGER_ABI = [
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {
        "name": "spendPermission",
        "type": "tuple",
        "components": [
          {"name": "account", "type": "address"},
          {"name": "spender", "type": "address"},
          {"name": "token", "type": "address"},
          {"name": "allowance", "type": "uint160"},
          {"name": "period", "type": "uint48"},
          {"name": "start", "type": "uint48"},
          {"name": "end", "type": "uint48"},
          {"name": "salt", "type": "uint256"},
          {"name": "extraData", "type": "bytes"}
        ]
      }
    ],
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable"
  }
] as const;

export function SimpleSpendPermissionFallback({ onPermissionGranted }: SimpleSpendPermissionFallbackProps) {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
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
      // Check if we're on the correct chain
      if (chainId !== baseSepolia.id) {
        throw new Error('Please switch to Base Sepolia network (Chain ID: 84532)');
      }

      // Get AI agent wallet address from backend
      const walletResponse = await fetch('/api/ai/wallet', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress })
      });
      
      if (!walletResponse.ok) {
        throw new Error('Failed to create AI agent wallet');
      }

      const { agentWalletAddress } = await walletResponse.json();
      
      console.log('Setting up fallback spend permission...');
      console.log('User address:', userAddress);
      console.log('Agent address:', agentWalletAddress);
      console.log('Chain ID:', chainId);
      console.log('Daily limit:', dailyLimit);
      
      // Create EIP-712 typed data for spend permission
      const domain = {
        name: 'SpendPermissionManager',
        version: '1',
        chainId: baseSepolia.id,
        verifyingContract: '0xf85210B21cC50302F477BA56686d2019dC9b67Ad' as `0x${string}`,
      };
      
      const types = {
        SpendPermission: [
          { name: 'account', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'allowance', type: 'uint160' },
          { name: 'period', type: 'uint48' },
          { name: 'start', type: 'uint48' },
          { name: 'end', type: 'uint48' },
          { name: 'salt', type: 'uint256' },
          { name: 'extraData', type: 'bytes' },
        ],
      };
      
      const now = Math.floor(Date.now() / 1000);
      const oneDay = 24 * 60 * 60;
      
      const values = {
        account: userAddress as `0x${string}`,
        spender: agentWalletAddress as `0x${string}`,
        token: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as `0x${string}`, // Native ETH
        allowance: parseEther(dailyLimit.toString()),
        period: oneDay, // 1 day in seconds
        start: now,
        end: now + (30 * oneDay), // 30 days from now
        salt: BigInt(Math.floor(Math.random() * 1000000)),
        extraData: '0x' as `0x${string}`,
      };
      
      // Directly approve the spend permission via transaction
      console.log('Sending approve transaction to SpendPermissionManager...');
      
      // Send approve transaction
      const hash = await writeContract(config, {
        address: SPEND_PERMISSION_MANAGER_ADDRESS as `0x${string}`,
        abi: SPEND_PERMISSION_MANAGER_ABI,
        functionName: 'approve',
        args: [values],
        chainId: baseSepolia.id,
      });
      
      console.log('Approval transaction sent:', hash);
      
      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash,
        chainId: baseSepolia.id,
      });
      
      console.log('Spend permission approved on-chain:', receipt.transactionHash);
      
      // Create permission object
      const permission = {
        permission: values,
        approved: true,
        transactionHash: receipt.transactionHash,
        domain,
        types,
      };
      
      // Store permission details for later use (convert BigInt values to strings for JSON)
      const permissionData = {
        userAddress,
        agentWalletAddress,
        dailyLimit,
        chainId: baseSepolia.id,
        timestamp: Date.now(),
        permission: {
          ...permission,
          permission: {
            ...permission.permission,
            allowance: permission.permission.allowance.toString(),
            salt: permission.permission.salt.toString(),
          }
        },
        status: 'approved',
        method: 'direct_approve',
      };
      
      localStorage.setItem('agora_spend_permission', JSON.stringify(permissionData));

      setIsSetup(true);
      onPermissionGranted?.();
      
    } catch (err) {
      console.error('Permission setup error:', err);
      
      let errorMessage = 'Failed to setup permission.';
      
      if (err instanceof Error) {
        const message = err.message.toLowerCase();
        
        if (message.includes('chain id')) {
          errorMessage = 'Please switch to Base Sepolia network (Chain ID: 84532) in your wallet.';
        } else if (message.includes('rejected') || message.includes('denied')) {
          errorMessage = 'Transaction was rejected. Please try again and approve the spend permission.';
        } else {
          errorMessage = `Setup failed: ${err.message}`;
        }
      }
      
      setError(errorMessage);
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
        <p className="text-xs text-green-600 mt-2">
          The AI can now automatically place bets based on your instructions.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Enable AI Agent Betting</h3>
      <p className="text-sm text-gray-600 mb-4">
        Approve the AI agent to place bets on your behalf with a daily spending limit.
      </p>
      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-4">
        ⚠️ This will send a transaction to approve spend permissions on-chain.
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
        {isLoading ? 'Approving...' : 'Approve Permission'}
      </button>

      {!userAddress && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Connect your wallet to enable AI agent
        </p>
      )}
      
      <p className="mt-3 text-xs text-green-600 bg-green-50 p-2 rounded">
        ✅ Direct approval: This sends an on-chain transaction to approve spend permissions.
      </p>
    </div>
  );
}