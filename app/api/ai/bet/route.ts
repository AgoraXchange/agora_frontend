import { NextRequest, NextResponse } from 'next/server';
import { parseETHAmount } from '@/lib/spend-permissions';
import { Redis } from '@upstash/redis';
import { createWalletClient, createPublicClient, http, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { AGREEMENT_FACTORY_ADDRESS, AGREEMENT_FACTORY_ABI } from '@/lib/agreementFactoryABI';

// Initialize Redis client (only if Redis URL is available)
let redis = null;
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

// Execute betting using EIP-712 spend permissions - AI agent places bet automatically
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
    
    console.log('Executing bet with EIP-712 fallback method...');
    console.log('Permission data:', permission);
    
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
    
    console.log('AI agent wallet:', account.address);
    
    // Check if we have enough ETH in the AI agent wallet
    const balance = await publicClient.getBalance({
      address: account.address,
    });
    
    console.log('AI agent balance:', balance.toString(), 'wei');
    
    if (balance < amountETH) {
      throw new Error(`Insufficient balance. Agent has ${balance.toString()} wei, need ${amountETH.toString()} wei`);
    }
    
    // Place the actual bet transaction
    const betCallData = encodeFunctionData({
      abi: AGREEMENT_FACTORY_ABI,
      functionName: 'simpleBet',
      args: [BigInt(agreementId), sideNumber],
    });
    
    console.log('Placing real bet transaction...');
    console.log('Agreement ID:', agreementId);
    console.log('Side:', sideNumber);
    console.log('Amount:', amountETH.toString());
    
    const betHash = await walletClient.sendTransaction({
      to: AGREEMENT_FACTORY_ADDRESS as `0x${string}`,
      data: betCallData,
      value: amountETH,
      chain: baseSepolia,
    });
    
    console.log('Real bet transaction executed:', betHash);
    
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
          timestamp: Date.now(),
          status: 'confirmed',
          method: 'eip712_fallback',
          permissionSignature: permission?.signature || 'N/A',
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
      status: 'confirmed',
      message: 'Bet placed successfully using AI agent wallet!',
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
      spendPermissionTxs: result.spendPermissionTxs,
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