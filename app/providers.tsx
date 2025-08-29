"use client";

import { type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { coinbaseWallet } from "wagmi/connectors";

// Create query client
const queryClient = new QueryClient();

// Configure wagmi with Coinbase Wallet connector
const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Agora",
      appLogoUrl: process.env.NEXT_PUBLIC_ICON_URL,
      preference: "smartWalletOnly",
    }),
  ],
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"),
  },
  ssr: false,
});

export function Providers(props: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <MiniKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={baseSepolia}
          config={{
            appearance: {
              mode: "auto",
              theme: "mini-app-theme",
              name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Agora",
              logo: process.env.NEXT_PUBLIC_ICON_URL,
            },
          }}
        >
          {props.children}
        </MiniKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}