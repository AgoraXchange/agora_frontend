"use client";

import { useEffect, useRef } from "react";
import { useAccount, useChainId } from "wagmi";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { EVENTS } from "@/lib/analytics";
import { getAddress as checksum } from "viem";

export function WalletAnalytics() {
  const { isConnected, address, connector } = useAccount();
  const chainId = useChainId();
  const prevConnected = useRef<boolean>(false);
  const prevAddress = useRef<string | undefined>(undefined);
  const { trackWalletEvent, identify, register, reset } = useAnalytics();

  useEffect(() => {
    // Detect connect
    if (isConnected && address && (!prevConnected.current || prevAddress.current !== address)) {
      const normalized = (() => {
        try { return checksum(address as `0x${string}`); } catch { return address; }
      })();
      const providerName = connector?.name || 'unknown';

      // Identify unique user by wallet address (EIP-55)
      identify(normalized, {
        wallet_address: normalized,
        last_connected_chain_id: chainId,
        wallet_provider: providerName,
      });

      // Register super properties applied to all events
      register({
        wallet_address: normalized,
        chain_id: chainId,
        wallet_provider: providerName,
        network_env: 'testnet', // Base Sepolia
      });

      // Track connect event immediately to trigger ID merge
      trackWalletEvent(EVENTS.WALLET_CONNECTED, {
        wallet_address: normalized,
        connection_method: providerName?.toLowerCase().includes('coinbase') ? 'coinbase_smart_wallet' : 'external',
      });
    }

    // Detect disconnect
    if (!isConnected && prevConnected.current) {
      trackWalletEvent(EVENTS.WALLET_DISCONNECTED, {
        connection_method: 'coinbase_smart_wallet',
      });
      reset(); // prevent identity bleed across users on same device
    }

    prevConnected.current = isConnected;
    prevAddress.current = address;
  }, [isConnected, address, chainId, connector, identify, register, reset, trackWalletEvent]);

  return null;
}
