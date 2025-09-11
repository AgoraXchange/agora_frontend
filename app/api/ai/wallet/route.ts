import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import crypto from 'crypto';

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

// Cache key for user's AI agent wallet
const getWalletCacheKey = (userAddress: string) => `agora:ai:wallet:${userAddress.toLowerCase()}`;

// Generate a deterministic wallet address for the AI agent
function generateAgentWallet(userAddress: string): string {
  // Create a deterministic address based on user address and a secret
  const secret = process.env.AI_AGENT_PRIVATE_KEY || 'agora-ai-agent-secret';
  const hash = crypto.createHmac('sha256', secret).update(userAddress.toLowerCase()).digest('hex');
  // Take first 40 chars and prefix with 0x to make a valid address
  return `0x${hash.substring(0, 40)}`;
}

export async function POST(request: NextRequest) {
  try {
    const { userAddress } = await request.json();
    
    if (!userAddress) {
      return NextResponse.json({ error: 'User address required' }, { status: 400 });
    }

    console.log('Creating AI wallet for user:', userAddress);

    // Check if we already have a wallet for this user (if Redis is available)
    if (redis) {
      try {
        const cacheKey = getWalletCacheKey(userAddress);
        const cachedWallet = await redis.get(cacheKey);
        
        if (cachedWallet && typeof cachedWallet === 'object' && 'address' in cachedWallet) {
          console.log('Returning cached wallet:', cachedWallet.address);
          return NextResponse.json({
            agentWalletAddress: cachedWallet.address,
            cached: true,
          });
        }
      } catch (redisError) {
        console.warn('Redis lookup failed:', redisError);
      }
    }

    let agentWalletAddress: string;
    let method: string;

    // Option 1: Use fixed AI agent wallet from environment
    if (process.env.AI_AGENT_PRIVATE_KEY) {
      try {
        const account = privateKeyToAccount(process.env.AI_AGENT_PRIVATE_KEY as `0x${string}`);
        agentWalletAddress = account.address;
        method = 'fixed_private_key';
        console.log('Using fixed private key wallet:', agentWalletAddress);
      } catch (error) {
        console.warn('Fixed private key failed:', error);
        agentWalletAddress = generateAgentWallet(userAddress);
        method = 'deterministic_fallback';
      }
    } else {
      // Fallback to deterministic
      console.log('No AI_AGENT_PRIVATE_KEY found, using deterministic wallet');
      agentWalletAddress = generateAgentWallet(userAddress);
      method = 'deterministic';
    }
    
    // Store wallet info in Redis for future use (if available)
    if (redis) {
      try {
        const cacheKey = getWalletCacheKey(userAddress);
        await redis.set(cacheKey, {
          address: agentWalletAddress,
          createdAt: Date.now(),
          userAddress: userAddress.toLowerCase(),
          method
        }, {
          ex: 86400 * 30, // Expire after 30 days
        });
        console.log('Wallet cached in Redis');
      } catch (redisError) {
        console.warn('Redis cache failed:', redisError);
      }
    }

    console.log('Returning wallet:', agentWalletAddress, 'method:', method);

    return NextResponse.json({
      agentWalletAddress,
      cached: false,
      method
    });
  } catch (error) {
    console.error('Wallet creation error:', error);
    
    // Ultimate fallback - always return something
    return NextResponse.json({
      agentWalletAddress: '0x742d35Cc6634C0532925a3b8C0D52d3b0B5B24F6', // Fixed fallback address
      cached: false,
      fallback: true,
      method: 'ultimate_fallback',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userAddress = url.searchParams.get('userAddress');
    
    if (!userAddress) {
      return NextResponse.json({ error: 'User address required' }, { status: 400 });
    }

    if (redis) {
      try {
        const cacheKey = getWalletCacheKey(userAddress);
        const cachedWallet = await redis.get(cacheKey);
        
        if (cachedWallet && typeof cachedWallet === 'object' && 'address' in cachedWallet) {
          return NextResponse.json({
            agentWalletAddress: cachedWallet.address,
            exists: true,
          });
        }
      } catch (redisError) {
        console.warn('Redis lookup failed:', redisError);
      }
    }

    // Even without Redis, we can generate a deterministic address
    const agentWalletAddress = process.env.AI_AGENT_PRIVATE_KEY 
      ? privateKeyToAccount(process.env.AI_AGENT_PRIVATE_KEY as `0x${string}`).address
      : generateAgentWallet(userAddress);
      
    return NextResponse.json({
      agentWalletAddress,
      exists: true,
      method: process.env.AI_AGENT_PRIVATE_KEY ? 'fixed_private_key' : 'deterministic'
    });
  } catch (error) {
    console.error('Wallet fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}