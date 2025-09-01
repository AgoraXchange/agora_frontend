import "./theme.css";
import "@coinbase/onchainkit/styles.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;
  return {
    title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
    description:
      "The onchain colosseum of debate",
    icons: {
      icon: "/favicon.svg",
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
        button: {
          title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME}`,
          action: {
            type: "launch_frame",
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
            url: URL,
            splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE,
            splashBackgroundColor:
              process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
          },
        },
      }),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background">
        {/* Disable Coinbase ClientAnalytics to prevent 401 to cca-lite.coinbase.com */}
        <Script id="disable-coinbase-cca" strategy="beforeInteractive">
          {`
          (function(){
            try {
              if (typeof window !== 'undefined') {
                var stub = {
                  init: function(){ return stub; },
                  identify: function(){},
                  track: function(){},
                  logEvent: function(){},
                  PlatformName: { web: 'web' }
                };
                window.ClientAnalytics = stub;
              }
            } catch (e) {}
          })();
          `}
        </Script>
        {/* Filter noisy third-party deprecation warnings without hiding others */}
        <Script id="filter-frame-sdk-deprecation" strategy="beforeInteractive">
          {`
          (function(){
            try {
              var _warn = console.warn;
              console.warn = function(){
                try {
                  var msg = arguments[0] && String(arguments[0]);
                  if (msg && msg.indexOf('@farcaster/frame-sdk is deprecated') !== -1) {
                    return; // suppress only this deprecation warning
                  }
                } catch (e) {}
                return _warn.apply(console, arguments);
              };
            } catch (e) {}
          })();
          `}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
