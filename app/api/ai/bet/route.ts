import { NextRequest, NextResponse } from 'next/server';
import { parseETHAmount } from '@/lib/spend-permissions';
import { Redis } from '@upstash/redis';
import { createWalletClient, createPublicClient, http, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { AGREEMENT_FACTORY_ADDRESS, AGREEMENT_FACTORY_ABI } from '@/lib/agreementFactoryABI';

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
  },
  {
    "type": "function",
    "name": "spend",
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
      },
      {"name": "value", "type": "uint160"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const;

// Initialize Redis client (only if Redis URL is available)
let redis: Redis | null = null;
try {
  if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
    redis = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });
  }
} catch (error) {
  console.warn('Redis initialization failed:', error);
  redis = null;
}

// Execute betting using SpendPermissionManager - spends from user wallet via approved permission
async function executeAgoraBet(
  agreementId: string,
  side: 'partyA' | 'partyB',
  amountETH: bigint,
  userAddress: string,
  permission?: any
) {
  try {
    // Convert side to contract format (1 for partyA, 2 for partyB)
    const sideNumber = side === 'partyA' ? 1 : 2;
    
    console.log('Executing bet using SpendPermissionManager...');
    console.log('Permission data:', permission);
    
    if (!permission || !permission.approved) {
      throw new Error('Spend permission not approved. Please approve permission first.');
    }
    
    // Get AI agent private key
    const agentPrivateKey = process.env.AI_AGENT_PRIVATE_KEY;
    if (!agentPrivateKey) {
      throw new Error('AI agent private key not configured');
    }
    
    // Create wallet client for the AI agent
    // Ensure private key has 0x prefix
    const formattedPrivateKey = agentPrivateKey.startsWith('0x') 
      ? agentPrivateKey 
      : `0x${agentPrivateKey}`;
    const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
    });
    
    // Create public client for reading blockchain state
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
    });
    
    console.log('AI agent (spender) wallet:', account.address);
    
    // Convert stored permission back to proper format
    const spendPermission = {
      account: permission.permission.account as `0x${string}`,
      spender: permission.permission.spender as `0x${string}`,
      token: permission.permission.token as `0x${string}`,
      allowance: BigInt(permission.permission.allowance),
      period: permission.permission.period,
      start: permission.permission.start,
      end: permission.permission.end,
      salt: BigInt(permission.permission.salt),
      extraData: permission.permission.extraData as `0x${string}`,
    };
    
    console.log('Using approved spend permission:', spendPermission);
    
    // Check user's ETH balance
    const userBalance = await publicClient.getBalance({ address: spendPermission.account });
    console.log('User balance:', userBalance.toString());
    console.log('Required amount:', amountETH.toString());
    
    if (userBalance < amountETH) {
      throw new Error(`Insufficient balance. User has ${userBalance.toString()} wei, need ${amountETH.toString()} wei`);
    }
    
    // Use SpendPermissionManager to spend from user's wallet directly to the betting contract
    // The correct approach is to have SpendPermissionManager send the funds directly to the contract
    
    // Create the bet call data that SpendPermissionManager should execute
    const betCallData = encodeFunctionData({
      abi: AGREEMENT_FACTORY_ABI,
      functionName: 'simpleBet',
      args: [BigInt(agreementId), sideNumber],
    });
    
    console.log('Calling SpendPermissionManager.spend with bet execution...');
    
    // Check if AI agent has any ETH balance first
    const agentBalance = await publicClient.getBalance({ address: account.address });
    console.log('AI agent balance before spend:', agentBalance.toString());
    
    // SpendPermissionManager should transfer funds from user to AI agent
    // The spend() function should be called by the spender (AI agent) to claim funds
    let spendHash: `0x${string}`;
    try {
      spendHash = await walletClient.writeContract({
        address: SPEND_PERMISSION_MANAGER_ADDRESS as `0x${string}`,
        abi: SPEND_PERMISSION_MANAGER_ABI,
        functionName: 'spend',
        args: [spendPermission, amountETH],
        chain: baseSepolia,
        gas: BigInt(1000000), // Add explicit gas limit
      });
      
      console.log('SpendPermissionManager.spend transaction hash:', spendHash);
    } catch (spendError) {
      console.error('SpendPermissionManager.spend failed:', spendError);
      
      // Try to get more details about the error
      if (spendError instanceof Error) {
        console.error('Spend error message:', spendError.message);
        console.error('Spend error cause:', spendError.cause);
      }
      
      throw new Error(`SpendPermissionManager.spend failed: ${spendError instanceof Error ? spendError.message : 'Unknown error'}`);
    }
    
    // Wait for spend transaction
    const spendReceipt = await publicClient.waitForTransactionReceipt({ hash: spendHash });
    console.log('SpendPermissionManager.spend confirmed:', spendReceipt.transactionHash);
    
    // Check AI agent balance after spend
    const agentBalanceAfter = await publicClient.getBalance({ address: account.address });
    console.log('AI agent balance after spend:', agentBalanceAfter.toString());
    
    // Verify the AI agent received the funds
    if (agentBalanceAfter < amountETH) {
      throw new Error(`AI agent didn't receive expected funds. Balance: ${agentBalanceAfter.toString()}, Expected: ${amountETH.toString()}`);
    }
    
    // Now AI agent has the ETH, place the bet
    const betHash = await walletClient.sendTransaction({
      to: AGREEMENT_FACTORY_ADDRESS as `0x${string}`,
      data: betCallData,
      value: amountETH,
      chain: baseSepolia,
    });
    
    console.log('Bet transaction executed:', betHash);
    
    // Store successful bet in Redis (optional)
    if (redis) {
      try {
        const betKey = `agora:bets:${userAddress.toLowerCase()}:${Date.now()}`;
        await redis.set(betKey, {
          agreementId,
          side,
          sideNumber,
          amount: amountETH.toString(),
          userAddress: userAddress.toLowerCase(),
          transactionHash: betHash,
          spendTransactionHash: spendHash,
          timestamp: Date.now(),
          status: 'confirmed',
          method: 'spend_permission_manager',
          permissionTransactionHash: permission?.transactionHash || 'N/A',
        }, {
          ex: 86400 * 7, // Expire after 7 days
        });
        console.log('✅ Bet stored in Redis');
      } catch (redisError) {
        console.warn('⚠️ Failed to store bet in Redis:', redisError);
      }
    } else {
      console.log('ℹ️ Redis not configured, skipping bet storage');
    }
    
    return {
      transactionHash: betHash,
      spendTransactionHash: spendHash,
      status: 'confirmed',
      message: 'Bet placed successfully using user wallet via spend permission!',
    };
  } catch (error) {
    console.error('Bet execution error:', error);
    
    // Fallback error handling
    const mockTxHash = `0x${Buffer.from(`${agreementId}-${side}-${Date.now()}`).toString('hex')}`;
    
    if (redis) {
      try {
        const betKey = `agora:bets:${userAddress.toLowerCase()}:${Date.now()}`;
        await redis.set(betKey, {
          agreementId,
          side,
          amount: amountETH.toString(),
          userAddress: userAddress.toLowerCase(),
          transactionHash: mockTxHash,
          timestamp: Date.now(),
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }, {
          ex: 86400 * 7,
        });
      } catch (redisError) {
        console.warn('⚠️ Failed to store error in Redis:', redisError);
      }
    }
    
    // Return error instead of success
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Bet API called');
    const { agreementId, side, amountETH } = await request.json();
    console.log('📊 Request data:', { agreementId, side, amountETH });
    
    // Validate inputs
    if (!agreementId || !side || !amountETH) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    if (side !== 'partyA' && side !== 'partyB') {
      return NextResponse.json(
        { error: 'Invalid side. Must be partyA or partyB' },
        { status: 400 }
      );
    }
    
    if (amountETH <= 0 || amountETH > 1) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between 0 and 1 ETH' },
        { status: 400 }
      );
    }
    
    // Get user address from session/auth (simplified for demo)
    // In production, get this from your auth system
    const userAddress = request.headers.get('x-user-address') || '0x0000000000000000000000000000000000000000';
    
    // Convert ETH amount to wei (18 decimals)
    const amountWei = parseETHAmount(amountETH);
    
    // Get stored spend permission (if available)
    const permissionData = request.headers.get('x-spend-permission');
    let permission = null;
    if (permissionData) {
      try {
        permission = JSON.parse(permissionData);
      } catch (e) {
        console.error('Failed to parse spend permission:', e);
      }
    }
    
    // Execute the bet automatically using spend permission
    const result = await executeAgoraBet(
      agreementId,
      side,
      amountWei,
      userAddress,
      permission
    );
    
    // Format success message
    const sideDisplay = side === 'partyA' ? 'Party A' : 'Party B';
    const message = `✅ Successfully placed ${amountETH} ETH bet on ${sideDisplay} automatically!`;
    
    return NextResponse.json({
      success: true,
      message,
      transactionHash: result.transactionHash,
      spendTransactionHash: result.spendTransactionHash,
      details: {
        agreementId,
        side,
        amountETH,
        amountWei: amountWei.toString(),
        userAddress,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('❌ Bet execution error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: 'Failed to execute bet',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check bet history
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userAddress = url.searchParams.get('userAddress');
    
    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address required' },
        { status: 400 }
      );
    }
    
    if (!redis) {
      return NextResponse.json({
        bets: [],
        count: 0,
        message: 'Redis not configured - bet history not available',
      });
    }
    
    // Get recent bets from Redis
    const pattern = `agora:bets:${userAddress.toLowerCase()}:*`;
    const keys = await redis.keys(pattern);
    
    const bets = [];
    for (const key of keys.slice(0, 10)) { // Limit to 10 most recent
      const bet = await redis.get(key);
      if (bet) {
        bets.push(bet);
      }
    }
    
    // Sort by timestamp (most recent first)
    bets.sort((a: any, b: any) => b.timestamp - a.timestamp);
    
    return NextResponse.json({
      bets,
      count: bets.length,
    });
  } catch (error) {
    console.error('Bet history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bet history' },
      { status: 500 }
    );
  }
}