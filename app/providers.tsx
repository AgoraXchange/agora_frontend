"use client";

import { type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { 
  RainbowKitProvider,
  getDefaultWallets,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { monadTestnet } from "@/lib/utils/customChains";

// Create query client
const queryClient = new QueryClient();

// Get the default wallets (includes MetaMask, Coinbase, Rainbow, and WalletConnect)
const { wallets } = getDefaultWallets();

// Configure wagmi with RainbowKit's default config
// This includes support for WalletConnect which enables Farcaster and other mobile wallets
const wagmiConfig = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Agora",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "YOUR_PROJECT_ID", // Required for WalletConnect
  chains: [baseSepolia, monadTestnet], // Base Sepolia and Monad testnet supported
  wallets,
  ssr: false, // Disable SSR for client-side wallet connections
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
          <RainbowKitProvider
            appInfo={{
              appName: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Agora",
              learnMoreUrl: process.env.NEXT_PUBLIC_URL,
            }}
            modalSize="compact"
            showRecentTransactions={true}
            initialChain={baseSepolia}
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
          </RainbowKitProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}