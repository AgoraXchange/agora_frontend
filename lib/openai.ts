// OpenAI integration for natural language betting
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// System prompt for the AI agent
export const SYSTEM_PROMPT = `You are an AI assistant for Agora, a decentralized debate and betting platform. 
You help users place bets on debate outcomes using natural language. 

When users want to bet on a debate/agreement, extract:
1. The agreement/debate ID (if mentioned)
2. Which side they want to bet on (Party A or Party B)
3. The amount they want to bet (in ETH)

Be conversational and helpful. If information is missing, ask clarifying questions.
Always confirm the details before executing a bet.`;

// Function definition for betting on Agora debates
export const AGORA_BET_FUNCTION = {
  type: 'function' as const,
  function: {
    name: 'place_agora_bet',
    description: 'Place a bet on an Agora debate/agreement outcome',
    parameters: {
      type: 'object',
      properties: {
        agreementId: {
          type: 'string',
          description: 'The ID of the agreement/debate to bet on',
        },
        side: {
          type: 'string',
          enum: ['partyA', 'partyB'],
          description: 'Which party to bet on (partyA or partyB)',
        },
        amountETH: {
          type: 'number',
          description: 'The amount to bet in ETH',
        },
      },
      required: ['agreementId', 'side', 'amountETH'],
    },
  },
};

// Function to generate chat responses with OpenAI
export async function generateChatResponse(
  messages: ChatMessage[],
  tools: any[] = [AGORA_BET_FUNCTION]
) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, tools }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate chat response');
  }

  return response.json();
}

// Helper to parse betting intent from natural language
export function parseBettingIntent(message: string): {
  hasIntent: boolean;
  possibleAmount?: number;
  possibleSide?: 'partyA' | 'partyB';
  needsMoreInfo: string[];
} {
  const lowerMessage = message.toLowerCase();
  const hasIntent = 
    lowerMessage.includes('bet') || 
    lowerMessage.includes('wager') || 
    lowerMessage.includes('stake') ||
    lowerMessage.includes('put money on') ||
    lowerMessage.includes('support');

  if (!hasIntent) {
    return { hasIntent: false, needsMoreInfo: [] };
  }

  const needsMoreInfo = [];
  
  // Try to extract amount (ETH)
  const amountMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:eth|ether|Ξ)?/i);
  const possibleAmount = amountMatch ? parseFloat(amountMatch[1]) : undefined;
  
  // Try to extract side
  let possibleSide: 'partyA' | 'partyB' | undefined;
  if (lowerMessage.includes('party a') || lowerMessage.includes('partya') || lowerMessage.includes('first')) {
    possibleSide = 'partyA';
  } else if (lowerMessage.includes('party b') || lowerMessage.includes('partyb') || lowerMessage.includes('second')) {
    possibleSide = 'partyB';
  }
  
  if (!possibleAmount) needsMoreInfo.push('amount');
  if (!possibleSide) needsMoreInfo.push('side');
  
  return { hasIntent, possibleAmount, possibleSide, needsMoreInfo };
}