"use client";

import { type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepolia, mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { coinbaseWallet } from "wagmi/connectors";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";

// Create query client
const queryClient = new QueryClient();

// Configure wagmi with Coinbase Wallet connector
const wagmiConfig = createConfig({
  // Include Base Sepolia (app chain) and Ethereum Mainnet (ENS resolution)
  chains: [baseSepolia, mainnet],
  connectors: [
    coinbaseWallet({
      appName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Agora",
      appLogoUrl: process.env.NEXT_PUBLIC_ICON_URL,
      preference: {
        options: "smartWalletOnly"
      },
      chainId: baseSepolia.id, // Explicitly set Base Sepolia chain ID
    }),
  ],
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"),
    // Use a CORS-friendly public RPC for mainnet by default; allow override via env
    [mainnet.id]: http(
      process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
        "https://rpc.ankr.com/eth"
    ),
  },
  syncConnectedChain: true, // Force chain synchronization with wallet
  ssr: false,
});

export function Providers(props: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={baseSepolia}
          rpcUrl="https://sepolia.base.org"
          config={{
            appearance: {
              mode: "dark",
              theme: "dark",
              name: "Agora",
              logo: process.env.NEXT_PUBLIC_ICON_URL,
            },
          }}
        >
          <MiniKitProvider
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            chain={baseSepolia}
            config={{
              appearance: {
                mode: "auto",
                // Use OnchainKit built-in theme to avoid overriding wallet colors
                theme: "dark",
                name: "Agora",
                logo: process.env.NEXT_PUBLIC_ICON_URL,
              },
            }}
          >
            <AnalyticsProvider>
              {props.children}
            </AnalyticsProvider>
          </MiniKitProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
