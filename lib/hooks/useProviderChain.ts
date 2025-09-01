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

  return {
    providerChainId,
    uiChainId,
    isMismatch,
    isCoinbaseBrowser,
    refresh: readChain,
  } as const;
}

