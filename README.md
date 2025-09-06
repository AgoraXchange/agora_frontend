# Agora - The Onchain Colosseum

Agora aspires to become the debate platform of the onchain world. We want to turn debate into a game for users through gamification and AI. By opening a market that people can use every day, we make it possible to capture speech itself, the intangible asset of human exchange, onchain as the internet shifts from Web2 to Web3. Words preserved in this way can be passed down to future generations.

Agora allows users to place bets on specific topics. Each participant stands on their own perspective, and those who guide that perspective to victory can earn rewards. When the betting period ends, an AI jury DAO reviews the debate records and delivers a verdict. The outcome is shared transparently with all participants.

Built on Base Sepolia with MiniKit and OnchainKit integration.

## Tech Stack

- [Next.js 15](https://nextjs.org) with App Router
- [MiniKit](https://docs.base.org/builderkits/minikit/overview) for Farcaster Frame integration
- [OnchainKit](https://www.base.org/builders/onchainkit) for Web3 components
- [Wagmi v2](https://wagmi.sh) + [Viem](https://viem.sh) for blockchain interactions
- [Base Account SDK](https://docs.base.org/base-account) for wallet integration
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Upstash Redis](https://upstash.com) for notification storage

## Getting Started

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

2. Verify environment variables, these will be set up by the `npx create-onchain --mini` command:

You can regenerate the FARCASTER Account Association environment variables by running `npx create-onchain --manifest` in your project directory.

The environment variables enable the following features:

- Frame metadata - Sets up the Frame Embed that will be shown when you cast your frame
- Account association - Allows users to add your frame to their account, enables notifications
- Redis API keys - Enable Webhooks and background notifications for your application by storing users notification details

```bash
# Shared/OnchainKit variables
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=
NEXT_PUBLIC_URL=
NEXT_PUBLIC_ICON_URL=
NEXT_PUBLIC_ONCHAINKIT_API_KEY=

# wallet connect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=

# Frame metadata
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=
NEXT_PUBLIC_APP_ICON=
NEXT_PUBLIC_APP_SUBTITLE=
NEXT_PUBLIC_APP_DESCRIPTION=
NEXT_PUBLIC_APP_SPLASH_IMAGE=
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=
NEXT_PUBLIC_APP_PRIMARY_CATEGORY=
NEXT_PUBLIC_APP_HERO_IMAGE=
NEXT_PUBLIC_APP_TAGLINE=
NEXT_PUBLIC_APP_OG_TITLE=
NEXT_PUBLIC_APP_OG_DESCRIPTION=
NEXT_PUBLIC_APP_OG_IMAGE=

# Redis config
REDIS_URL=
REDIS_TOKEN=
```

3. Start the development server:
```bash
npm run dev
```

### Analytics (Mixpanel)

Client-side analytics is initialized. Behavior by environment:
- Development: default opt-in (events are tracked if a token is set).
- Production: default opt-out unless the user has previously consented, or `NEXT_PUBLIC_ANALYTICS_DEFAULT_OPT_IN=true` is set.

To test events locally, add a Mixpanel token to `.env.local` and restart the dev server:

```
NEXT_PUBLIC_MIXPANEL_TOKEN=YOUR_MIXPANEL_PROJECT_TOKEN
```

To opt-in by default in production (without per-user consent), set:

```
NEXT_PUBLIC_ANALYTICS_DEFAULT_OPT_IN=true
```

For server-side webhook analytics (frame added/removed, notifications enabled/disabled), you can optionally set a server token:

```
MIXPANEL_TOKEN=YOUR_MIXPANEL_SERVER_TOKEN
```

Client events are proxied through Next.js at `/mp/*` to avoid CORS/adblock issues.

### Telegram Notifications

Send Telegram notifications for new debates and comments.

1) Create a Telegram bot and get the token from @BotFather.

2) Get a `chat_id` (user, group, or channel):
- For a group, add the bot to the group and use tools like @RawDataBot, or call `getUpdates` from your bot after sending a message in the group.

3) Add the following environment variables:
```
TELEGRAM_BOT_TOKEN=1234567890:ABCDEF_your_bot_token
TELEGRAM_CHAT_ID=YOUR_CHAT_OR_CHANNEL_ID
```

4) On successful debate creation and comment submission, the app calls `/api/telegram` to send a message. If you want to customize the message, edit `app/api/telegram/route.ts`.

## Template Features

### Frame Configuration
- `.well-known/farcaster.json` endpoint configured for Frame metadata and account association
- Frame metadata automatically added to page headers in `layout.tsx`

### Background Notifications
- Redis-backed notification system using Upstash
- Ready-to-use notification endpoints in `api/notify` and `api/webhook`
- Notification client utilities in `lib/notification-client.ts`

### Theming
- Custom theme defined in `theme.css` with OnchainKit variables
- Pixel font integration with Pixelify Sans
- Dark/light mode support through OnchainKit

### Wallet Configuration
The app uses a custom Wagmi configuration in `providers.tsx` with:
- **Coinbase Smart Wallet** integration (Smart Wallet only mode)
- **Base Sepolia** testnet support
- **Session persistence** - wallet connection maintained across page refreshes
- **MiniKit Provider** wrapper for Farcaster Frame context
- **Query Client** setup for data fetching with React Query

## Customization

To get started building your own frame, follow these steps:

1. Remove the DemoComponents:
   - Delete `components/DemoComponents.tsx`
   - Remove demo-related imports from `page.tsx`

2. Start building your Frame:
   - Modify `page.tsx` to create your Frame UI
   - Update theme variables in `theme.css`
   - Adjust MiniKit configuration in `providers.tsx`

3. Add your frame to your account:
   - Cast your frame to see it in action
   - Share your frame with others to start building your community

## Learn More

- [MiniKit Documentation](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit Documentation](https://docs.base.org/builderkits/onchainkit/getting-started)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
