"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChainId } from "wagmi";

type EthRequestArgs = {
  method: string;
  params?: unknown[];
};

interface EIP1193Provider {
  request<T = unknown>(args: EthRequestArgs): Promise<T>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
  isCoinbaseBrowser?: boolean;
}

function getInjectedProvider(): EIP1193Provider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: EIP1193Provider }).ethereum;
  return eth ?? null;
}

function hexToNumber(hex: unknown): number | null {
  if (typeof hex === "string") {
    try {
      return Number.parseInt(hex, 16);
    } catch {
      return null;
    }
  }
  if (typeof hex === "number") return hex;
  return null;
}

export function useProviderChain() {
  const uiChainId = useChainId();
  const providerRef = useRef<EIP1193Provider | null>(null);
  const [providerChainId, setProviderChainId] = useState<number | null>(null);
  const [isCoinbaseBrowser, setIsCoinbaseBrowser] = useState<boolean>(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const readChain = useCallback(async () => {
    const prov = providerRef.current ?? getInjectedProvider();
    providerRef.current = prov;
    if (!prov?.request) return null;
    try {
      const result = await prov.request<string | number>({ method: "eth_chainId" });
      const id = hexToNumber(result);
      if (id !== null) setProviderChainId(id);
      if (typeof (prov as EIP1193Provider).isCoinbaseBrowser === "boolean") {
        setIsCoinbaseBrowser(Boolean((prov as EIP1193Provider).isCoinbaseBrowser));
      }
      return id;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    void readChain();
  }, [readChain]);

  useEffect(() => {
    const prov = providerRef.current ?? getInjectedProvider();
    if (!prov?.on || !prov?.removeListener) return;
    const onChainChanged = (c: unknown) => {
      const id = hexToNumber(c);
      if (id !== null) setProviderChainId(id);
    };
    prov.on("chainChanged", onChainChanged);
    return () => prov.removeListener?.("chainChanged", onChainChanged);
  }, []);

  const isMismatch = useMemo(() => {
    return providerChainId !== null && uiChainId !== undefined && providerChainId !== uiChainId;
  }, [providerChainId, uiChainId]);

  const switchToSepolia = useCallback(async (): Promise<boolean> => {
    const prov = providerRef.current ?? getInjectedProvider();
    providerRef.current = prov;
    if (!prov?.request) return false;
    const BASE_SEPOLIA_HEX = "0x14a34"; // 84532
    setIsSwitching(true);
    setSwitchError(null);
    try {
      // Try to switch first
      await prov.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_SEPOLIA_HEX }],
      } as EthRequestArgs);
    } catch (err: unknown) {
      // If the chain is not added, attempt to add it
      const message = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: number }).code;
      const needsAdd = code === 4902 || /Unrecognized chain ID|chain .* not found/i.test(message);
      if (!needsAdd) {
        setSwitchError(message);
        setIsSwitching(false);
        return false;
      }
      try {
        await prov.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: BASE_SEPOLIA_HEX,
              chainName: "Base Sepolia",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://sepolia.base.org"],
              blockExplorerUrls: ["https://sepolia.basescan.org"],
            },
          ],
        } as EthRequestArgs);
      } catch (addErr: unknown) {
        const addMsg = addErr instanceof Error ? addErr.message : String(addErr);
        setSwitchError(addMsg);
        setIsSwitching(false);
        return false;
      }
      // After adding, try switching again
      try {
        await prov.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BASE_SEPOLIA_HEX }],
        } as EthRequestArgs);
      } catch (switchErr: unknown) {
        const switchMsg = switchErr instanceof Error ? switchErr.message : String(switchErr);
        setSwitchError(switchMsg);
        setIsSwitching(false);
        return false;
      }
    }

    // Confirm the provider actually switched
    await readChain();
    setIsSwitching(false);
    return providerChainId === 84532 || (await readChain()) === 84532;
  }, [readChain, providerChainId]);

  return {
    providerChainId,
    uiChainId,
    isMismatch,
    isCoinbaseBrowser,
    refresh: readChain,
    switchToSepolia,
    isSwitching,
    switchError,
  } as const;
}
