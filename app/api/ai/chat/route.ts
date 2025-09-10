import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT, AGORA_BET_FUNCTION } from '@/lib/openai';

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';

export async function POST(request: NextRequest) {
  try {
    const { messages, tools = [AGORA_BET_FUNCTION] } = await request.json();
    
    console.log('OpenAI API Key check:', OPENAI_API_KEY ? `Present (${OPENAI_API_KEY.substring(0, 10)}...)` : 'Missing');
    
    if (!OPENAI_API_KEY) {
      // Fallback response when OpenAI is not configured
      const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
      
      console.log('Running in demo mode - OpenAI API key not found');
      
      // Simple pattern matching for demo mode
      if (lastMessage.includes('bet') || lastMessage.includes('wager')) {
        return NextResponse.json({
          message: "I'm currently in demo mode. In production with OpenAI configured, I would help you place that bet! Try saying something like 'I want to bet 0.01 ETH on Party A'.",
          toolCall: false,
        });
      }
      
      return NextResponse.json({
        message: "Hi! I'm your AI betting assistant running in demo mode. Try asking me to place a bet by saying 'I want to bet 0.01 ETH on Party A'!",
        toolCall: false,
      });
    }

    console.log('Making OpenAI API request with model:', OPENAI_MODEL);
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        tools,
        tool_choice: 'auto',
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', response.status, error);
      throw new Error(`Failed to get AI response: ${response.status} ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    
    console.log('OpenAI response received. Has tool calls:', !!choice.message.tool_calls);
    
    // Check if the AI wants to call a function (place a bet)
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      console.log('Tool call detected:', toolCall.function.name, toolCall.function.arguments);
      
      const { agreementId, side, amountETH } = JSON.parse(toolCall.function.arguments);
      
      // Execute the bet (would call the actual betting API here)
      const betResponse = await fetch('/api/ai/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreementId, side, amountETH }),
      });
      
      if (!betResponse.ok) {
        return NextResponse.json({
          message: `I understood you want to bet ${amountETH} ETH on ${side} for agreement ${agreementId}, but there was an error placing the bet. Please try again.`,
          toolCall: false,
        });
      }
      
      const betData = await betResponse.json();
      
      return NextResponse.json({
        message: betData.message || `Successfully placed a ${amountETH} ETH bet on ${side} for agreement ${agreementId}!`,
        toolCall: true,
        details: {
          agreementId,
          side,
          amount: amountETH,
          transactionHash: betData.transactionHash,
        },
      });
    }
    
    // Regular conversation response
    return NextResponse.json({
      message: choice.message.content,
      toolCall: false,
    });
  } catch (error) {
    console.error('Chat processing error:', error);
    
    // Check if it's an OpenAI API error
    if (error instanceof Error && error.message.includes('Failed to get AI response')) {
      return NextResponse.json({
        message: "I'm having trouble connecting to OpenAI right now. This could be due to API limits or network issues. Please try again in a moment.",
        toolCall: false,
      });
    }
    
    // Provide a helpful fallback response
    return NextResponse.json({
      message: "I'm having trouble processing your request right now. You can try saying something like 'I want to bet 0.01 ETH on Party A' and I'll help you place that bet.",
      toolCall: false,
    });
  }
}

// Helper endpoint to check if OpenAI is configured
export async function GET() {
  return NextResponse.json({
    configured: !!OPENAI_API_KEY,
    keyPresent: OPENAI_API_KEY ? `${OPENAI_API_KEY.substring(0, 10)}...` : 'Missing',
    model: OPENAI_MODEL,
    envKeys: Object.keys(process.env).filter(key => key.includes('OPENAI')),
  });
}