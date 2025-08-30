"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { EVENTS } from "@/lib/analytics";

export function WalletAnalytics() {
  const { isConnected, address } = useAccount();
  const prevConnected = useRef<boolean>(false);
  const prevAddress = useRef<string | undefined>(undefined);
  const { trackWalletEvent } = useAnalytics();

  useEffect(() => {
    // Detect connect
    if (isConnected && address && (!prevConnected.current || prevAddress.current !== address)) {
      trackWalletEvent(EVENTS.WALLET_CONNECTED, {
        wallet_address: address,
        connection_method: "coinbase_smart_wallet",
      });
    }

    // Detect disconnect
    if (!isConnected && prevConnected.current) {
      trackWalletEvent(EVENTS.WALLET_DISCONNECTED, {
        connection_method: "coinbase_smart_wallet",
      });
    }

    prevConnected.current = isConnected;
    prevAddress.current = address;
  }, [isConnected, address, trackWalletEvent]);

  return null;
}

