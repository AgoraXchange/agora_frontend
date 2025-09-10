import { NextRequest, NextResponse } from 'next/server';
import { prepareSpendCallData } from '@base-org/account/spend-permission';
import { parseETHAmount, getTokenAddress } from '@/lib/spend-permissions';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

// Mock betting function - in production, this would interact with your smart contracts
async function executeAgoraBet(
  agreementId: string,
  side: 'partyA' | 'partyB',
  amountETH: bigint,
  userAddress: string,
  permission?: any
) {
  // Here you would:
  // 1. Get the actual Agora contract address for the agreement
  // 2. Prepare the betting transaction
  // 3. Use the spend permission to execute the transaction
  // 4. Return the transaction hash
  
  // For now, we'll simulate the transaction
  const mockTxHash = `0x${Buffer.from(`${agreementId}-${side}-${Date.now()}`).toString('hex')}`;
  
  // Store bet in Redis for tracking
  const betKey = `agora:bets:${userAddress.toLowerCase()}:${Date.now()}`;
  await redis.set(betKey, {
    agreementId,
    side,
    amount: amountETH.toString(),
    userAddress: userAddress.toLowerCase(),
    transactionHash: mockTxHash,
    timestamp: Date.now(),
    status: 'pending',
  }, {
    ex: 86400 * 7, // Expire after 7 days
  });
  
  return {
    transactionHash: mockTxHash,
    status: 'pending',
  };
}

export async function POST(request: NextRequest) {
  try {
    const { agreementId, side, amountETH } = await request.json();
    
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
    
    // Execute the bet
    const result = await executeAgoraBet(
      agreementId,
      side,
      amountWei,
      userAddress,
      permission
    );
    
    // Format success message
    const sideDisplay = side === 'partyA' ? 'Party A' : 'Party B';
    const message = `✅ Successfully placed a ${amountETH} ETH bet on ${sideDisplay} for agreement ${agreementId}!`;
    
    return NextResponse.json({
      success: true,
      message,
      transactionHash: result.transactionHash,
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
    console.error('Bet execution error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute bet',
        message: error instanceof Error ? error.message : 'Unknown error'
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