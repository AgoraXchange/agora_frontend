/**
 * Secure AI Betting API Route
 * Production-ready implementation with security, gas optimization, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { prepareSpendCallData } from '@base-org/account/spend-permission';
import { parseETHAmount } from '@/lib/spend-permissions';
import { permissionValidator } from '@/lib/permission-validator';
import { getSecureWalletManager } from '@/lib/secure-key-manager';
import { Redis } from '@upstash/redis';
import { createPublicClient, http, parseEther, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { AGREEMENT_FACTORY_ADDRESS, AGREEMENT_FACTORY_ABI } from '@/lib/agreementFactoryABI';

// Initialize Redis with error handling
const redis = process.env.REDIS_URL && process.env.REDIS_TOKEN 
  ? new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    })
  : null;

// Constants for validation
const MIN_BET_AMOUNT = parseEther('0.0001'); // 0.0001 ETH minimum
const MAX_BET_AMOUNT = parseEther('1'); // 1 ETH maximum
const MAX_DAILY_VOLUME = parseEther('10'); // 10 ETH daily limit per user

// Rate limiting
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

interface BetRequest {
  agreementId: string;
  side: 'partyA' | 'partyB';
  amountETH: number;
}

interface BetResult {
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  blockNumber?: bigint;
}

/**
 * Validates the betting request
 */
async function validateBetRequest(
  request: BetRequest,
  userAddress: string
): Promise<{ isValid: boolean; error?: string }> {
  // Validate agreement ID
  if (!request.agreementId || !/^\d+$/.test(request.agreementId)) {
    return { isValid: false, error: 'Invalid agreement ID format' };
  }
  
  const agreementId = BigInt(request.agreementId);
  if (agreementId < 0n || agreementId > BigInt(Number.MAX_SAFE_INTEGER)) {
    return { isValid: false, error: 'Agreement ID out of range' };
  }
  
  // Validate side
  if (request.side !== 'partyA' && request.side !== 'partyB') {
    return { isValid: false, error: 'Invalid side. Must be partyA or partyB' };
  }
  
  // Validate amount
  if (typeof request.amountETH !== 'number' || isNaN(request.amountETH)) {
    return { isValid: false, error: 'Invalid amount format' };
  }
  
  const amountWei = parseEther(request.amountETH.toString());
  if (amountWei < MIN_BET_AMOUNT) {
    return { isValid: false, error: `Minimum bet is ${formatEther(MIN_BET_AMOUNT)} ETH` };
  }
  
  if (amountWei > MAX_BET_AMOUNT) {
    return { isValid: false, error: `Maximum bet is ${formatEther(MAX_BET_AMOUNT)} ETH` };
  }
  
  // Check daily volume limit
  if (redis) {
    const volumeKey = `betting:volume:${userAddress.toLowerCase()}:${new Date().toISOString().split('T')[0]}`;
    const dailyVolume = await redis.get(volumeKey) as string || '0';
    const newVolume = BigInt(dailyVolume) + amountWei;
    
    if (newVolume > MAX_DAILY_VOLUME) {
      return { 
        isValid: false, 
        error: `Daily volume limit of ${formatEther(MAX_DAILY_VOLUME)} ETH exceeded` 
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Checks rate limiting
 */
async function checkRateLimit(userAddress: string): Promise<boolean> {
  if (!redis) return true; // Skip rate limiting if Redis not available
  
  const key = `ratelimit:betting:${userAddress.toLowerCase()}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  try {
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);
    
    // Count requests in current window
    const count = await redis.zcard(key);
    if (count >= MAX_REQUESTS_PER_WINDOW) {
      return false;
    }
    
    // Add current request
    await redis.zadd(key, { score: now, member: now.toString() });
    await redis.expire(key, Math.ceil(RATE_LIMIT_WINDOW / 1000));
    
    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Allow request if rate limiting fails
  }
}

/**
 * Estimates gas for the betting transaction
 */
async function estimateGas(
  agreementId: bigint,
  side: number,
  amountWei: bigint,
  fromAddress: string
): Promise<{ gasLimit: bigint; maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
  });
  
  try {
    // Estimate gas for the transaction
    const gasEstimate = await publicClient.estimateContractGas({
      address: AGREEMENT_FACTORY_ADDRESS as `0x${string}`,
      abi: AGREEMENT_FACTORY_ABI,
      functionName: 'simpleBet',
      args: [agreementId, side],
      value: amountWei,
      account: fromAddress as `0x${string}`,
    });
    
    // Get current gas prices (EIP-1559)
    const block = await publicClient.getBlock();
    const baseFee = block.baseFeePerGas || 0n;
    
    // Base-optimized gas pricing
    // Base L2 has very low gas prices, we add small buffer
    const maxPriorityFeePerGas = parseEther('0.000000001'); // 1 gwei
    const maxFeePerGas = baseFee * 120n / 100n + maxPriorityFeePerGas; // 20% buffer
    
    return {
      gasLimit: gasEstimate * 120n / 100n, // 20% buffer
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
  } catch (error) {
    console.error('Gas estimation failed:', error);
    // Fallback values for Base Sepolia
    return {
      gasLimit: 200000n,
      maxFeePerGas: parseEther('0.000000030'), // 30 gwei
      maxPriorityFeePerGas: parseEther('0.000000001'), // 1 gwei
    };
  }
}

/**
 * Executes the bet on the Agora contract
 */
async function executeBet(
  request: BetRequest,
  userAddress: string,
  permission?: any
): Promise<BetResult> {
  const agreementId = BigInt(request.agreementId);
  const sideNumber = request.side === 'partyA' ? 1 : 2;
  const amountWei = parseEther(request.amountETH.toString());
  
  // Get secure wallet manager
  const walletManager = getSecureWalletManager();
  
  try {
    // Initialize wallet for user if using CDP
    if ('initializeWallet' in walletManager) {
      await (walletManager as any).initializeWallet(userAddress);
    }
    
    const walletClient = await walletManager.getWalletClient();
    const agentAddress = await walletManager.getAddress();
    
    // Validate permission if provided
    if (permission) {
      const validation = await permissionValidator.validatePermission(
        permission,
        userAddress,
        agentAddress
      );
      
      if (!validation.isValid) {
        throw new Error(`Invalid spend permission: ${validation.error}`);
      }
      
      // Use spend permission flow
      const spendCalls = await prepareSpendCallData({
        permission,
        amount: amountWei,
      });
      
      // Execute spend permission calls
      for (const call of spendCalls) {
        await walletClient.sendTransaction({
          ...call,
          chain: baseSepolia,
        });
      }
    }
    
    // Estimate gas for the bet
    const gasParams = await estimateGas(agreementId, sideNumber, amountWei, agentAddress);
    
    // Execute the bet with optimized gas
    const hash = await walletClient.writeContract({
      address: AGREEMENT_FACTORY_ADDRESS as `0x${string}`,
      abi: AGREEMENT_FACTORY_ABI,
      functionName: 'simpleBet',
      args: [agreementId, sideNumber],
      value: amountWei,
      chain: baseSepolia,
      ...gasParams,
    });
    
    // Wait for confirmation
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
    });
    
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });
    
    // Update daily volume
    if (redis) {
      const volumeKey = `betting:volume:${userAddress.toLowerCase()}:${new Date().toISOString().split('T')[0]}`;
      const currentVolume = await redis.get(volumeKey) as string || '0';
      await redis.set(volumeKey, (BigInt(currentVolume) + amountWei).toString(), {
        ex: 86400, // Expire after 24 hours
      });
      
      // Store bet record
      const betKey = `bets:${userAddress.toLowerCase()}:${Date.now()}`;
      await redis.set(betKey, {
        agreementId: request.agreementId,
        side: request.side,
        amount: amountWei.toString(),
        transactionHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
        timestamp: Date.now(),
        status: receipt.status === 'success' ? 'confirmed' : 'failed',
      }, {
        ex: 86400 * 30, // Keep for 30 days
      });
    }
    
    return {
      transactionHash: hash,
      status: receipt.status === 'success' ? 'confirmed' : 'failed',
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error('Bet execution error:', error);
    throw error;
  }
}

/**
 * Main POST handler for placing bets
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: BetRequest = await request.json();
    
    // Get user address from headers (should come from auth)
    const userAddress = request.headers.get('x-user-address');
    if (!userAddress) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }
    
    // Check rate limiting
    const rateLimitOk = await checkRateLimit(userAddress);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Validate request
    const validation = await validateBetRequest(body, userAddress);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    // Get spend permission from headers (if available)
    const permissionHeader = request.headers.get('x-spend-permission');
    let permission = null;
    if (permissionHeader) {
      try {
        permission = JSON.parse(permissionHeader);
      } catch (e) {
        console.warn('Failed to parse spend permission:', e);
      }
    }
    
    // Execute the bet
    const result = await executeBet(body, userAddress, permission);
    
    // Format response
    const sideDisplay = body.side === 'partyA' ? 'Party A' : 'Party B';
    const gasUsedETH = result.gasUsed && result.effectiveGasPrice
      ? formatEther(result.gasUsed * result.effectiveGasPrice)
      : '0';
    
    return NextResponse.json({
      success: true,
      message: `Successfully placed ${body.amountETH} ETH bet on ${sideDisplay}`,
      transactionHash: result.transactionHash,
      status: result.status,
      details: {
        agreementId: body.agreementId,
        side: body.side,
        amountETH: body.amountETH,
        amountWei: parseEther(body.amountETH.toString()).toString(),
        userAddress,
        gasUsed: result.gasUsed?.toString(),
        gasUsedETH,
        blockNumber: result.blockNumber?.toString(),
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Bet API error:', error);
    
    // Don't expose internal errors to client
    const message = error instanceof Error ? error.message : 'Transaction failed';
    const isUserError = message.includes('Invalid') || 
                       message.includes('exceeded') || 
                       message.includes('Minimum') ||
                       message.includes('Maximum');
    
    return NextResponse.json(
      { 
        error: isUserError ? message : 'Failed to execute bet. Please try again.',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: isUserError ? 400 : 500 }
    );
  }
}

/**
 * GET handler for retrieving bet history
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userAddress = url.searchParams.get('userAddress');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address required' },
        { status: 400 }
      );
    }
    
    if (!redis) {
      return NextResponse.json(
        { error: 'Bet history not available' },
        { status: 503 }
      );
    }
    
    // Get bet keys for user
    const pattern = `bets:${userAddress.toLowerCase()}:*`;
    const keys = await redis.keys(pattern);
    
    // Sort by timestamp (newest first)
    const sortedKeys = keys.sort((a, b) => {
      const timestampA = parseInt(a.split(':')[2]);
      const timestampB = parseInt(b.split(':')[2]);
      return timestampB - timestampA;
    });
    
    // Apply pagination
    const paginatedKeys = sortedKeys.slice(offset, offset + limit);
    
    // Fetch bet data
    const bets = [];
    for (const key of paginatedKeys) {
      const bet = await redis.get(key);
      if (bet) {
        bets.push(bet);
      }
    }
    
    return NextResponse.json({
      bets,
      total: sortedKeys.length,
      limit,
      offset,
      hasMore: offset + limit < sortedKeys.length,
    });
  } catch (error) {
    console.error('Bet history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bet history' },
      { status: 500 }
    );
  }
}