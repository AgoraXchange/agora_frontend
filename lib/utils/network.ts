import { baseSepolia } from 'wagmi/chains';

export interface NetworkInfo {
  id: number;
  name: string;
  hexId: string;
  rpcUrl: string;
  blockExplorer: string;
}

/**
 * Convert chain ID to hexadecimal format
 */
export function chainIdToHex(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}

/**
 * Get Base Sepolia network information
 */
export function getBaseSepolia(): NetworkInfo {
  return {
    id: baseSepolia.id,
    name: baseSepolia.name,
    hexId: chainIdToHex(baseSepolia.id),
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: baseSepolia.blockExplorers?.default?.url || 'https://sepolia-explorer.base.org'
  };
}

/**
 * Check if the given chain ID is Base Sepolia
 */
export function isBaseSepolia(chainId: number | undefined): boolean {
  return chainId === baseSepolia.id;
}

/**
 * Get network name by chain ID
 * This app only supports Base Sepolia
 */
export function getNetworkName(chainId: number | undefined): string {
  if (!chainId) return 'Unknown Network';
  
  switch (chainId) {
    case 84532:
      return 'Base Sepolia';
    // Legacy support for display purposes only - app doesn't support these networks
    case 1:
      return 'Ethereum Mainnet (Unsupported)';
    case 8453:
      return 'Base Mainnet (Unsupported)';
    default:
      return `Unsupported Network ${chainId}`;
  }
}

/**
 * Check if a network is a testnet
 * This app only supports Base Sepolia (testnet)
 */
export function isTestnet(chainId: number | undefined): boolean {
  if (!chainId) return false;
  
  // Only Base Sepolia is supported as the testnet
  return chainId === 84532;
}

/**
 * Get network status indicator color
 */
export function getNetworkStatusColor(chainId: number | undefined): string {
  if (!chainId) return 'text-gray-400';
  
  if (isBaseSepolia(chainId)) {
    return 'text-green-400';
  }
  
  if (isTestnet(chainId)) {
    return 'text-yellow-400';
  }
  
  return 'text-red-400';
}

/**
 * Get short network name for mobile display
 * This app only supports Base Sepolia
 */
export function getNetworkShortName(chainId: number | undefined): string {
  if (!chainId) return 'Unknown';
  
  switch (chainId) {
    case 84532:
      return 'Sepolia'; // Base Sepolia
    // Legacy support for display only - not supported
    case 8453:
      return 'Base (Unsupported)';
    case 1:
      return 'ETH (Unsupported)';
    default:
      return `Unsupported ${chainId}`;
  }
}

/**
 * Format chain ID for display (shows both decimal and hex)
 */
export function formatChainId(chainId: number): string {
  return `${chainId} (${chainIdToHex(chainId)})`;
}