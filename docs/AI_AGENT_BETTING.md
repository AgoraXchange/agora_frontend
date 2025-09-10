# AI Agent Betting Feature

This feature allows users to place bets on Agora agreements using ETH through natural language conversations with an AI assistant powered by OpenAI and Base Account Spend Permissions.

## Features

- 🤖 **Natural Language Betting**: Chat with an AI assistant to place bets
- 🔐 **Spend Permissions**: Secure daily spending limits using Base Account SDK
- 💬 **Conversational Interface**: Intuitive chat interface for betting
- ⛽ **Gas-Free Transactions**: Sponsored transactions via CDP Paymaster
- 🔄 **Server-Side Rendering**: Fully SSR-compatible with Next.js

## Setup

### 1. Environment Variables

Add the following to your `.env.local`:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview

# Coinbase Developer Platform
CDP_API_KEY_NAME=your_cdp_api_key_name
CDP_API_KEY_PRIVATE_KEY=your_cdp_private_key

# Paymaster for gas sponsorship
NEXT_PUBLIC_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base/your_key
```

### 2. Integration

Add the AI Agent Panel to any page:

```tsx
import { AIAgentPanel } from '@/components/ai-agent';

export default function AgreementPage({ agreementId, agreementTitle }) {
  return (
    <div>
      {/* Your existing page content */}
      
      {/* AI Agent Betting Assistant */}
      <AIAgentPanel 
        agreementId={agreementId}
        agreementTitle={agreementTitle}
      />
    </div>
  );
}
```

Or add it to your root layout for global access:

```tsx
// app/layout.tsx
import { AIAgentPanel } from '@/components/ai-agent';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <AIAgentPanel /> {/* Available on all pages */}
      </body>
    </html>
  );
}
```

## User Flow

### 1. Connect Wallet
Users must connect their wallet (Coinbase Smart Wallet) to use the AI agent.

### 2. Grant Spend Permission
Users set a daily spending limit (e.g., 0.01 ETH) that the AI agent can use for betting.

### 3. Chat to Bet
Users can place bets using natural language:
- "I want to bet 0.01 ETH on Party A"
- "Put 0.05 ETH on the first option"  
- "Bet 0.02 ETH on Party B for agreement XYZ"

### 4. Confirmation & Execution
The AI confirms the bet details and executes the transaction using the granted spend permission.

## API Endpoints

### `/api/ai/wallet`
- **POST**: Create or retrieve AI agent wallet for a user
- **GET**: Check if user has an existing AI agent wallet

### `/api/ai/chat`
- **POST**: Process natural language messages and extract betting intent
- Uses OpenAI to understand user intent and execute betting commands

### `/api/ai/bet`
- **POST**: Execute a bet on an Agora agreement
- **GET**: Retrieve user's betting history

## Components

### `AIAgentPanel`
Main floating panel that contains the entire AI betting interface.

### `SpendPermissionSetup`
Component for users to grant daily spending permissions to the AI agent.

### `ChatInterface`
Chat UI for conversing with the AI betting assistant.

## Security Considerations

1. **Spend Limits**: Users control daily spending limits
2. **Permission Revocation**: Users can revoke permissions at any time
3. **Transaction Signing**: All transactions require user approval via spend permissions
4. **Session Storage**: Permissions are stored locally and expire after 24 hours

## Testing

### Without OpenAI API Key
The system will work in demo mode, providing mock responses to test the UI flow.

### With Test Wallet
Use Base Sepolia testnet for testing:
1. Get test ETH from a Base Sepolia faucet
2. Grant spend permission with a small amount (e.g., 0.01 ETH)
3. Test betting on sample agreements

## Example Chat Interactions

```
User: "Hi, I want to bet on the current debate"
AI: "I can help you place a bet! Which side would you like to bet on - Party A or Party B?"

User: "I think Party A will win, bet 0.01 ETH"
AI: "Great! I'll place a 0.01 ETH bet on Party A for you. Confirming: 0.01 ETH on Party A. Shall I proceed?"

User: "Yes"
AI: "✅ Successfully placed a 0.01 ETH bet on Party A! Transaction: 0x123..."
```

## Troubleshooting

### "Permission not granted" error
- Ensure user has completed the SpendPermissionSetup flow
- Check that permission hasn't expired (24-hour limit)

### "Failed to create wallet" error
- Verify CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY are set
- Check Redis connection for wallet caching

### Chat not responding
- Verify OPENAI_API_KEY is set and valid
- Check browser console for API errors

## Future Enhancements

- [ ] Multi-language support
- [ ] Voice input for betting
- [ ] Betting recommendations based on analysis
- [ ] Portfolio tracking and analytics
- [ ] Automated betting strategies
- [ ] Integration with prediction markets