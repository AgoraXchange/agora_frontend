// Spend permission utilities for AI agent betting
import { createBaseAccountSDK } from '@base-org/account';
import { fetchPermissions } from '@base-org/account/spend-permission';
import { parseEther, formatEther } from 'viem';

// ETH address (native token)
export const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
// WETH on Base mainnet
export const WETH_BASE_ADDRESS = '0x4200000000000000000000000000000000000006';
// WETH on Base Sepolia (testnet)
export const WETH_BASE_SEPOLIA_ADDRESS = '0x4200000000000000000000000000000000000006';

export const getTokenAddress = (chainId: number, useNativeETH: boolean = true) => {
  if (useNativeETH) return ETH_ADDRESS;
  return chainId === 8453 ? WETH_BASE_ADDRESS : WETH_BASE_SEPOLIA_ADDRESS;
};

export async function getUserSpendPermissions(
  userAccount: string,
  spenderAccount: string,
  chainId: number = 84532 // Base Sepolia by default
) {
  try {
    const permissions = await fetchPermissions({
      account: userAccount as `0x${string}`,
      chainId,
      spender: spenderAccount as `0x${string}`,
      provider: createBaseAccountSDK({
        appName: "Agora AI Agent",
      }).getProvider(),
    });

    // Filter for ETH/WETH permissions
    const ethAddress = ETH_ADDRESS.toLowerCase();
    const wethAddress = getTokenAddress(chainId, false).toLowerCase();
    return permissions.filter(p => {
      const token = p.permission?.token?.toLowerCase();
      return token === ethAddress || token === wethAddress;
    });
  } catch (error) {
    console.error('Error fetching spend permissions:', error);
    return [];
  }
}

export async function revokeSpendPermission(permission: any) {
  try {
    // Note: revokeSpendPermission may not be available in current SDK version
    // This is a placeholder for future implementation
    console.warn('Revoke spend permission not implemented in current SDK version');
    return { success: false, message: 'Revoke not available' };
  } catch (error) {
    console.error('Error revoking permission:', error);
    throw error;
  }
}

// Helper to format ETH amount (18 decimals)
export function formatETHAmount(amount: bigint): string {
  return formatEther(amount);
}

export function parseETHAmount(amount: string | number): bigint {
  const strAmount = typeof amount === 'number' ? amount.toString() : amount;
  return parseEther(strAmount);
}