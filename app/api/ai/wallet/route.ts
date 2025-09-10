import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { CdpClient } from '@coinbase/cdp-sdk';
import crypto from 'crypto';

// Initialize Redis client (only if Redis URL is available)
const redis = process.env.REDIS_URL && process.env.REDIS_TOKEN 
  ? new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    })
  : null;

// Initialize CDP client (only if credentials are available)
const cdp = process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET 
  ? new CdpClient()
  : null;

// Cache key for user's AI agent wallet
const getWalletCacheKey = (userAddress: string) => `agora:ai:wallet:${userAddress.toLowerCase()}`;

// Generate a deterministic wallet address for the AI agent
function generateAgentWallet(userAddress: string): string {
  // Create a deterministic address based on user address and a secret
  const secret = process.env.CDP_API_KEY_SECRET || 'agora-ai-agent-secret';
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

    // Check if we already have a wallet for this user (if Redis is available)
    if (redis) {
      const cacheKey = getWalletCacheKey(userAddress);
      const cachedWallet = await redis.get(cacheKey);
      
      if (cachedWallet && typeof cachedWallet === 'object' && 'address' in cachedWallet) {
        return NextResponse.json({
          agentWalletAddress: cachedWallet.address,
          cached: true,
        });
      }
    }

    let agentWalletAddress: string;
    let method: string;

    // Try to create a real CDP wallet first, fallback to deterministic
    if (cdp) {
      try {
        const account = await cdp.evm.createAccount();
        agentWalletAddress = account.address;
        method = 'cdp_wallet';
        
        // Store CDP wallet info in Redis for future use (if available)
        if (redis) {
          const cacheKey = getWalletCacheKey(userAddress);
          await redis.set(cacheKey, {
            address: agentWalletAddress,
            createdAt: Date.now(),
            userAddress: userAddress.toLowerCase(),
            method: 'cdp_wallet'
          }, {
            ex: 86400 * 30, // Expire after 30 days
          });
        }
      } catch (error) {
        console.warn('CDP wallet creation failed, falling back to deterministic:', error);
        agentWalletAddress = generateAgentWallet(userAddress);
        method = 'deterministic_fallback';
      }
    } else {
      // Generate a deterministic wallet address for this user
      agentWalletAddress = generateAgentWallet(userAddress);
      method = 'deterministic';
      
      // Store wallet info in Redis for future use (if available)
      if (redis) {
        const cacheKey = getWalletCacheKey(userAddress);
        await redis.set(cacheKey, {
          address: agentWalletAddress,
          createdAt: Date.now(),
          userAddress: userAddress.toLowerCase(),
          method: 'deterministic'
        }, {
          ex: 86400 * 30, // Expire after 30 days
        });
      }
    }

    return NextResponse.json({
      agentWalletAddress,
      cached: false,
      method
    });
  } catch (error) {
    console.error('Wallet creation error:', error);
    
    // Fallback to a simple deterministic address
    const fallbackAddress = generateAgentWallet(request.body?.userAddress || 'fallback');
    
    return NextResponse.json({
      agentWalletAddress: fallbackAddress,
      cached: false,
      fallback: true,
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
      const cacheKey = getWalletCacheKey(userAddress);
      const cachedWallet = await redis.get(cacheKey);
      
      if (cachedWallet && typeof cachedWallet === 'object' && 'address' in cachedWallet) {
        return NextResponse.json({
          agentWalletAddress: cachedWallet.address,
          exists: true,
        });
      }
    }

    // Even without Redis, we can generate a deterministic address
    const agentWalletAddress = generateAgentWallet(userAddress);
    return NextResponse.json({
      agentWalletAddress,
      exists: true,
      method: 'deterministic'
    });
  } catch (error) {
    console.error('Wallet fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}