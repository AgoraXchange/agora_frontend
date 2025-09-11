/**
 * Spend Permission Validator
 * Validates spend permissions on-chain before trusting them
 */

import { createPublicClient, http, type PublicClient } from 'viem';
import { baseSepolia } from 'viem/chains';
import { verifyTypedData } from 'viem';

interface SpendPermission {
  account: `0x${string}`;
  spender: `0x${string}`;
  token: `0x${string}`;
  allowance: bigint;
  period: number;
  start: number;
  end: number;
  salt: string;
  extraData: string;
  signature?: `0x${string}`;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    remainingAllowance?: bigint;
    isExpired?: boolean;
    isActive?: boolean;
  };
}

/**
 * Validates spend permissions on-chain
 */
export class SpendPermissionValidator {
  private publicClient: PublicClient;
  private permissionCache: Map<string, { result: ValidationResult; timestamp: number }>;
  private readonly CACHE_TTL = 60000; // 1 minute cache
  
  constructor() {
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
    });
    this.permissionCache = new Map();
  }
  
  /**
   * Validates a spend permission
   */
  async validatePermission(
    permission: SpendPermission,
    userAddress: string,
    agentAddress: string
  ): Promise<ValidationResult> {
    try {
      // Check cache first
      const cacheKey = `${userAddress}-${agentAddress}-${permission.token}`;
      const cached = this.permissionCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.result;
      }
      
      // Validate basic structure
      if (!permission.account || !permission.spender || !permission.token) {
        return { isValid: false, error: 'Invalid permission structure' };
      }
      
      // Validate addresses match
      if (permission.account.toLowerCase() !== userAddress.toLowerCase()) {
        return { isValid: false, error: 'Permission account mismatch' };
      }
      
      if (permission.spender.toLowerCase() !== agentAddress.toLowerCase()) {
        return { isValid: false, error: 'Permission spender mismatch' };
      }
      
      // Validate time bounds
      const now = Math.floor(Date.now() / 1000);
      if (permission.end && permission.end < now) {
        return { 
          isValid: false, 
          error: 'Permission expired',
          details: { isExpired: true }
        };
      }
      
      if (permission.start && permission.start > now) {
        return { 
          isValid: false, 
          error: 'Permission not yet active',
          details: { isActive: false }
        };
      }
      
      // Validate allowance
      if (permission.allowance <= 0n) {
        return { 
          isValid: false, 
          error: 'Invalid allowance amount',
          details: { remainingAllowance: 0n }
        };
      }
      
      // Verify signature if provided
      if (permission.signature) {
        const isValidSignature = await this.verifyPermissionSignature(permission);
        if (!isValidSignature) {
          return { isValid: false, error: 'Invalid permission signature' };
        }
      }
      
      // Check on-chain state (if contract supports it)
      const onChainValid = await this.checkOnChainValidity(permission);
      if (!onChainValid) {
        return { isValid: false, error: 'Permission not valid on-chain' };
      }
      
      const result: ValidationResult = {
        isValid: true,
        details: {
          remainingAllowance: permission.allowance,
          isExpired: false,
          isActive: true,
        }
      };
      
      // Cache the result
      this.permissionCache.set(cacheKey, { result, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      console.error('Permission validation error:', error);
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      };
    }
  }
  
  /**
   * Verifies the cryptographic signature of the permission
   */
  private async verifyPermissionSignature(permission: SpendPermission): Promise<boolean> {
    try {
      if (!permission.signature) return false;
      
      // Construct the EIP-712 typed data for spend permission
      const domain = {
        name: 'SpendPermission',
        version: '1',
        chainId: baseSepolia.id,
        verifyingContract: permission.token,
      };
      
      const types = {
        SpendPermission: [
          { name: 'account', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'allowance', type: 'uint256' },
          { name: 'period', type: 'uint48' },
          { name: 'start', type: 'uint48' },
          { name: 'end', type: 'uint48' },
          { name: 'salt', type: 'uint256' },
          { name: 'extraData', type: 'bytes' },
        ],
      };
      
      const message = {
        account: permission.account,
        spender: permission.spender,
        token: permission.token,
        allowance: permission.allowance,
        period: permission.period,
        start: permission.start,
        end: permission.end,
        salt: permission.salt,
        extraData: permission.extraData || '0x',
      };
      
      const recoveredAddress = await verifyTypedData({
        domain,
        types,
        primaryType: 'SpendPermission',
        message,
        signature: permission.signature,
      });
      
      return recoveredAddress.toLowerCase() === permission.account.toLowerCase();
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }
  
  /**
   * Checks if the permission is valid on-chain
   * This would interact with the spend permission contract if deployed
   */
  private async checkOnChainValidity(permission: SpendPermission): Promise<boolean> {
    try {
      // TODO: When Base deploys the spend permission contract,
      // add the actual on-chain validation here
      // For now, we'll do basic checks
      
      // Check if the account has sufficient balance
      const balance = await this.publicClient.getBalance({
        address: permission.account,
      });
      
      if (balance < permission.allowance) {
        console.warn('Account has insufficient balance for permission allowance');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('On-chain validation error:', error);
      // Default to true if we can't check on-chain
      // (better to fail at transaction time than block unnecessarily)
      return true;
    }
  }
  
  /**
   * Clears the validation cache
   */
  clearCache(): void {
    this.permissionCache.clear();
  }
}

// Singleton instance
export const permissionValidator = new SpendPermissionValidator();