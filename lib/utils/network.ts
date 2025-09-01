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
 */
export function getNetworkName(chainId: number | undefined): string {
  if (!chainId) return 'Unknown Network';
  
  switch (chainId) {
    case 1:
      return 'Ethereum Mainnet';
    case 5:
      return 'Goerli Testnet';
    case 11155111:
      return 'Sepolia Testnet';
    case 8453:
      return 'Base Mainnet';
    case 84532:
      return 'Base Sepolia';
    case 137:
      return 'Polygon';
    case 80001:
      return 'Polygon Mumbai';
    default:
      return `Chain ${chainId}`;
  }
}

/**
 * Check if a network is a testnet
 */
export function isTestnet(chainId: number | undefined): boolean {
  if (!chainId) return false;
  
  const testnets = [5, 11155111, 84532, 80001]; // Goerli, Sepolia, Base Sepolia, Polygon Mumbai
  return testnets.includes(chainId);
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
 * Format chain ID for display (shows both decimal and hex)
 */
export function formatChainId(chainId: number): string {
  return `${chainId} (${chainIdToHex(chainId)})`;
}