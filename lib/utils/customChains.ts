import { type Chain } from 'wagmi/chains';

// Define Monad testnet chain
export const monadTestnet: Chain = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: { 
      http: ["https://testnet-rpc.monad.xyz"],
      webSocket: ["wss://testnet-rpc.monad.xyz"],
    },
    public: { 
      http: ["https://testnet-rpc.monad.xyz"],
      webSocket: ["wss://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://explorer.testnet.monad.xyz",
    },
  },
  testnet: true,
};

/**
 * Add a custom chain to MetaMask
 */
export async function addChainToWallet(chain: Chain) {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Prepare chain parameters for MetaMask
    const params = {
      chainId: `0x${chain.id.toString(16)}`,
      chainName: chain.name,
      nativeCurrency: {
        name: chain.nativeCurrency.name,
        symbol: chain.nativeCurrency.symbol,
        decimals: chain.nativeCurrency.decimals,
      },
      rpcUrls: chain.rpcUrls.default.http,
      blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : [],
    };

    console.log('Adding chain to wallet with params:', params);

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [params],
    });
  } catch (error: any) {
    console.error('Error adding chain to wallet:', error);
    // Error code 4001 means user rejected the request
    if (error.code === 4001) {
      throw new Error('User rejected the request to add the network');
    }
    // Error code -32602 means invalid parameters
    if (error.code === -32602) {
      throw new Error('Invalid network parameters. Please check the RPC URL and try again.');
    }
    throw error;
  }
}

/**
 * Switch to a chain, adding it first if necessary
 */
export async function switchToChain(chainId: number) {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const chainIdHex = `0x${chainId.toString(16)}`;

  try {
    // Try to switch to the chain
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (error: any) {
    // Error code 4902 means chain is not added to MetaMask
    if (error.code === 4902) {
      // Find the chain configuration
      const chain = chainId === monadTestnet.id ? monadTestnet : null;
      if (chain) {
        await addChainToWallet(chain);
        // Try switching again after adding
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
      } else {
        throw new Error(`Unknown chain ID: ${chainId}`);
      }
    } else {
      throw error;
    }
  }
}