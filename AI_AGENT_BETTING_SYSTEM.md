# AI Agent Automatic Betting System

## Overview

The AI Agent Automatic Betting System enables users to place bets on Agora agreements using natural language commands through an AI agent. The system leverages Base's SpendPermissionManager to allow automatic fund transfers without requiring user transaction approval for each bet.

## Architecture

### Core Components

1. **SpendPermissionManager Contract** (`0xf85210B21cC50302F477BA56686d2019dC9b67Ad`)
   - Base network singleton contract for managing spend permissions
   - Acts as a modular owner of user's Smart Wallet
   - Enables controlled fund transfers within permission constraints

2. **AI Agent Wallet**
   - Server-side wallet controlled by AI agent private key
   - Receives funds via spend permissions
   - Executes betting transactions on behalf of users

3. **Permission Management System**
   - Frontend component for setting up spend permissions
   - LocalStorage-based permission state management
   - Daily spending limits configuration

## Technical Flow

### 1. Permission Setup Phase

```typescript
// User sets up spend permission with daily limits
const spendPermission = {
  account: userAddress,           // User's wallet address
  spender: agentWalletAddress,    // AI agent wallet address
  token: '0xEeeeeEeee...',        // Native ETH token address
  allowance: parseEther("0.01"),  // Daily limit in wei
  period: 86400,                  // 24 hours in seconds
  start: currentTimestamp,        // Permission start time
  end: currentTimestamp + 30days, // Permission expiry
  salt: randomSalt,               // Unique identifier
  extraData: '0x'                 // Additional data (empty)
}
```

**Process:**
1. User connects wallet and specifies daily spending limit (0.001-0.1 ETH)
2. Frontend creates AI agent wallet via `/api/ai/wallet`
3. User signs approval transaction to SpendPermissionManager
4. Permission stored in localStorage with approval status

### 2. Automatic Betting Phase

**User Input:**
```
"Bet 0.01 ETH on Party A for agreement #39"
```

**AI Processing:**
1. Parse natural language to extract:
   - Amount: 0.01 ETH
   - Side: partyA
   - Agreement ID: 39

2. Validate spend permission and user balance

**Fund Transfer:**
```typescript
// AI agent calls SpendPermissionManager.spend()
const spendHash = await walletClient.writeContract({
  address: SPEND_PERMISSION_MANAGER_ADDRESS,
  abi: SPEND_PERMISSION_MANAGER_ABI,
  functionName: 'spend',
  args: [spendPermission, amountWei],
  chainId: baseSepolia.id,
});
```

**Bet Execution:**
```typescript
// AI agent places bet using transferred funds
const betHash = await walletClient.sendTransaction({
  to: AGREEMENT_FACTORY_ADDRESS,
  data: encodeFunctionData({
    abi: AGREEMENT_FACTORY_ABI,
    functionName: 'simpleBet',
    args: [BigInt(agreementId), sideNumber]
  }),
  value: amountETH,
});
```

## Implementation Details

### API Endpoints

#### `/api/ai/wallet`
- Creates and manages AI agent wallets
- Redis caching for wallet persistence
- Deterministic address generation based on user

#### `/api/ai/bet`
- Executes automatic betting workflow
- Validates spend permissions
- Handles fund transfer and bet placement
- Error handling for contract-specific failures

#### `/api/ai/chat`
- Natural language processing via OpenAI
- Intent extraction and parameter parsing
- Bet execution coordination

### Frontend Components

#### `SimpleSpendPermissionFallback.tsx`
- Spend permission setup UI
- Daily limit configuration
- Direct approve transaction handling
- Permission state management

#### `AIAgentPanel.tsx`
- Chat interface for natural language betting
- Permission status display
- Real-time bet execution feedback

## Error Handling

### Permission Errors
- **Not Approved**: Prompts user to set up permissions
- **Expired**: Requires permission renewal
- **Insufficient Allowance**: Suggests increasing daily limit

### Transaction Errors
- **Already Placed Bet**: User-friendly duplicate bet message
- **Insufficient Funds**: Balance validation with clear error
- **Contract Errors**: Specific handling for agreement state issues

### Recovery Mechanisms
- **Redis Fallback**: Graceful degradation when Redis unavailable
- **Deterministic Wallets**: Consistent agent addresses without storage
- **Transaction Retry**: Automatic retry with gas optimization

## Security Considerations

### Permission Constraints
- **Daily Limits**: Maximum 0.1 ETH per day configurable limit
- **Time-Bounded**: 30-day maximum permission duration
- **Single Spender**: AI agent address locked at permission creation
- **Native ETH Only**: No token approvals, ETH transfers only

### Smart Contract Integration
- **Modular Ownership**: SpendPermissionManager as Smart Wallet owner
- **Permission Validation**: On-chain verification of spend limits
- **Atomic Operations**: Combined permission check and fund transfer

### Server-Side Security
- **Private Key Management**: Environment variable storage
- **Request Validation**: User address and permission verification
- **Transaction Simulation**: Pre-execution validation

## Monitoring and Analytics

### Transaction Tracking
- **Spend Permission Hashes**: Monitor approval transactions
- **Fund Transfer Hashes**: Track SpendPermissionManager.spend calls
- **Bet Execution Hashes**: Record final betting transactions

### Redis Storage
- **Bet History**: 7-day retention of betting records
- **Wallet Caching**: 30-day agent wallet persistence
- **Performance Metrics**: API response times and success rates

### Error Analytics
- **Permission Failures**: Track setup and renewal issues
- **Contract Errors**: Monitor agreement-specific failures
- **Balance Issues**: Identify insufficient fund scenarios

## Performance Metrics

### Successful Transaction Example
```
User Balance: 49,999,576,120,208,876 wei
Transfer Amount: 10,000,000,000,000,000 wei (0.01 ETH)
AI Agent Balance Before: 41,780,549,537,970,332 wei
AI Agent Balance After: 41,780,486,830,072,182 wei (reduced by gas)

Transactions:
- Permission Setup: 0xfc59b474ddff49994e2a8d42c07dabeb7963c07c6f9c51298049e2724763eb80
- Fund Transfer: 0x3bb8ffcd1a5e2a4fe068e5342aa99ca36669b72a106c4aa42c88221aac22acff
- Bet Execution: 0x38c2c8ffb3b961b5659db98c9989a37d6b935a5c783663d52f4720586ea53a33

Total Execution Time: 7.4 seconds
```

## Future Enhancements

### Planned Features
- **Multi-Agreement Betting**: Batch betting across multiple agreements
- **Dynamic Limit Adjustment**: Real-time daily limit modifications
- **Advanced AI Logic**: Market analysis and betting recommendations
- **Cross-Chain Support**: Extension to other Base-compatible networks

### Optimization Opportunities
- **Gas Optimization**: Batch transactions for multiple operations
- **Predictive Caching**: Pre-generate agent wallets for frequent users
- **Smart Routing**: Optimal transaction timing based on network congestion
- **Enhanced Security**: Multi-sig requirements for high-value permissions

## Network Configuration

### Base Sepolia Testnet
- **Chain ID**: 84532
- **RPC Endpoint**: https://sepolia.base.org
- **SpendPermissionManager**: 0xf85210B21cC50302F477BA56686d2019dC9b67Ad
- **Native Token**: ETH (0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)

### Required Environment Variables
```env
AI_AGENT_PRIVATE_KEY=0x... # AI agent wallet private key
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
REDIS_URL=redis://... # Upstash Redis connection
REDIS_TOKEN=... # Upstash Redis token
OPENAI_API_KEY=sk-... # OpenAI API for natural language processing
```

This system represents a significant advancement in Web3 UX, enabling truly automatic transactions while maintaining security through constrained permissions and modular smart wallet architecture.