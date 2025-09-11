/**
 * Secure Key Management for AI Agent
 * Production-ready key management using CDP SDK or KMS
 */

import { CdpClient } from '@coinbase/cdp-sdk';
import { createWalletClient, http, type WalletClient } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

interface SecureWalletManager {
  getWalletClient(): Promise<WalletClient>;
  signTransaction(tx: any): Promise<string>;
  getAddress(): Promise<string>;
}

/**
 * Production-ready secure wallet manager using CDP SDK
 * This replaces direct private key usage with secure key custody
 */
export class CDPSecureWalletManager implements SecureWalletManager {
  private cdpClient: CdpClient;
  private walletId?: string;
  
  constructor() {
    if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
      throw new Error('CDP credentials not configured');
    }
    
    this.cdpClient = new CdpClient({
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
    });
  }
  
  async initializeWallet(userAddress: string): Promise<void> {
    // Create or retrieve a server-managed wallet for this user
    const walletKey = `agora-agent-${userAddress.toLowerCase()}`;
    
    try {
      // Try to retrieve existing wallet
      const wallets = await this.cdpClient.listWallets();
      const existingWallet = wallets.find(w => w.name === walletKey);
      
      if (existingWallet) {
        this.walletId = existingWallet.id;
      } else {
        // Create new wallet
        const wallet = await this.cdpClient.createWallet({
          name: walletKey,
          chainId: baseSepolia.id,
        });
        this.walletId = wallet.id;
      }
    } catch (error) {
      console.error('Failed to initialize CDP wallet:', error);
      throw new Error('Secure wallet initialization failed');
    }
  }
  
  async getWalletClient(): Promise<WalletClient> {
    if (!this.walletId) {
      throw new Error('Wallet not initialized');
    }
    
    const wallet = await this.cdpClient.getWallet(this.walletId);
    const address = await wallet.getAddress();
    
    // Create a custom account that uses CDP for signing
    const account = {
      address: address as `0x${string}`,
      signMessage: async ({ message }: { message: string }) => {
        return await wallet.signMessage(message) as `0x${string}`;
      },
      signTransaction: async (tx: any) => {
        return await wallet.signTransaction(tx) as `0x${string}`;
      },
      signTypedData: async (data: any) => {
        return await wallet.signTypedData(data) as `0x${string}`;
      },
    };
    
    return createWalletClient({
      account: account as any,
      chain: baseSepolia,
      transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
    });
  }
  
  async signTransaction(tx: any): Promise<string> {
    if (!this.walletId) {
      throw new Error('Wallet not initialized');
    }
    
    const wallet = await this.cdpClient.getWallet(this.walletId);
    return await wallet.signTransaction(tx);
  }
  
  async getAddress(): Promise<string> {
    if (!this.walletId) {
      throw new Error('Wallet not initialized');
    }
    
    const wallet = await this.cdpClient.getWallet(this.walletId);
    return await wallet.getAddress();
  }
}

/**
 * Fallback wallet manager for development
 * NEVER use this in production
 */
export class DevelopmentWalletManager implements SecureWalletManager {
  private account: any;
  
  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Development wallet manager cannot be used in production');
    }
    
    const privateKey = process.env.AI_AGENT_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('AI agent private key not configured');
    }
    
    this.account = privateKeyToAccount(privateKey as `0x${string}`);
  }
  
  async getWalletClient(): Promise<WalletClient> {
    return createWalletClient({
      account: this.account,
      chain: baseSepolia,
      transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
    });
  }
  
  async signTransaction(tx: any): Promise<string> {
    return await this.account.signTransaction(tx);
  }
  
  async getAddress(): Promise<string> {
    return this.account.address;
  }
}

/**
 * Factory function to get appropriate wallet manager
 */
export function getSecureWalletManager(): SecureWalletManager {
  // Use CDP in production, development wallet for testing
  if (process.env.NODE_ENV === 'production' || process.env.USE_CDP_WALLET === 'true') {
    return new CDPSecureWalletManager();
  }
  
  return new DevelopmentWalletManager();
}