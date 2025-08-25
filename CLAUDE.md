# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development Tasks
- `npm run dev` - Start the development server on http://localhost:3000
- `npm run build` - Build the production-ready application
- `npm run lint` - Run ESLint to check code quality
- `npm start` - Start the production server (requires npm run build first)

### Testing & Verification
Always run these commands after making changes:
- `npm run lint` - Ensure code follows project linting rules
- `npm run build` - Verify the build compiles without errors

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.3 with App Router
- **UI**: React 18 with TypeScript
- **Blockchain**: Wagmi v2 + Viem for Web3 interactions (Base Sepolia chain)
- **Wallet**: Coinbase Smart Wallet (via @base-org/account SDK)
- **Frame SDK**: Farcaster MiniApp SDK for mini-app functionality
- **Styling**: Tailwind CSS with custom theme variables
- **State Management**: React Query (TanStack Query v5)
- **Database**: Upstash Redis for notification storage

### Project Structure
```
app/
├── api/           # API routes for webhooks and notifications
│   ├── notify/    # Send frame notifications endpoint
│   └── webhook/   # Handle Farcaster frame lifecycle events
├── components/    # React components
├── providers.tsx  # MiniKitProvider setup with OnchainKit
├── layout.tsx     # Root layout with Frame metadata
└── page.tsx       # Main application entry point

lib/
├── notification.ts        # Redis-backed notification storage
├── notification-client.ts # Frame notification utilities
└── redis.ts              # Upstash Redis client configuration
```

### Key Integration Points

#### Wallet & Provider Configuration
- **Wagmi v2 Setup**: Custom configuration in `app/providers.tsx` with Coinbase Smart Wallet
- **Smart Wallet Only Mode**: Uses `preference: "smartWalletOnly"` for improved UX
- **Session Persistence**: `reconnectOnMount={true}` maintains wallet connection across refreshes
- **Provider Hierarchy**: WagmiProvider → QueryClientProvider → MiniKitProvider → App
- **Base Sepolia Chain**: Configured for testnet with RPC endpoint `https://sepolia.base.org`

#### MiniKit & OnchainKit
- Application wrapped with `MiniKitProvider` for Farcaster Frame context
- OnchainKit components available for Web3 UI elements
- Frame metadata automatically injected in `app/layout.tsx`
- App branding: "Agora" displayed in wallet interactions instead of localhost

#### Notification System
- **Storage**: User notification details stored in Redis with key pattern `{project_name}:user:{fid}`
- **Webhooks**: `/api/webhook` handles frame lifecycle events (added, removed, notifications enabled/disabled)
- **Verification**: FID ownership verified against Optimism KeyRegistry contract
- **API**: `/api/notify` endpoint for sending notifications to users

#### Frame Events Handling
The webhook endpoint processes four main events:
1. `frame_added` - Store notification details, send welcome message
2. `frame_removed` - Clean up user notification data
3. `notifications_enabled` - Store details, send confirmation
4. `notifications_disabled` - Remove notification details

### Environment Configuration
Critical environment variables that must be set:
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY` - OnchainKit API access
- `NEXT_PUBLIC_URL` - Application URL for frame metadata
- `REDIS_URL` & `REDIS_TOKEN` - Upstash Redis connection (required for notifications)
- Frame metadata variables (`FARCASTER_*`) - Generated via `npx create-onchain --manifest`

### TypeScript Configuration
- Strict mode enabled
- Path alias `@/*` maps to project root
- Target ES2017 for compatibility

### Frame Asset Specifications
Required image assets in `public/` directory with recommended dimensions:
- **icon.png** - PNG 1024×1024
- **logo.png** - 200-400px width (horizontal) - Brand logo
- **splash.png** - 200x200px (square) - Frame launch splash screen
- **hero.png** - 1200x630px (1.91:1 ratio) - Open Graph preview and Frame card image
- **screenshot.png** - portrait 1284×2778px recommended.
