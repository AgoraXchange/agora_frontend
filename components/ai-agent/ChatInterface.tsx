'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { generateChatResponse, ChatMessage, parseBettingIntent } from '@/lib/openai';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  toolCall?: boolean;
  details?: any;
}

interface ChatInterfaceProps {
  agreementId?: string;
  agreementTitle?: string;
}

export function ChatInterface({ agreementId, agreementTitle }: ChatInterfaceProps) {
  const { address: userAddress } = useAccount();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  // Add welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: agreementId 
          ? `Hi! I'm your AI betting assistant. I can help you place bets on "${agreementTitle || 'this agreement'}". Try saying something like "I want to bet 0.01 ETH on Party A" or "Bet 0.05 ETH on the first option"!`
          : `Hi! I'm your AI betting assistant. I can help you place bets on Agora agreements. Try saying "Bet 0.01 ETH on Party A" or ask me about any agreement!`,
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [agreementId, agreementTitle]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Parse betting intent from user message
      const intent = parseBettingIntent(inputValue);
      
      // Check if user has granted spend permission for betting intents
      const permissionData = localStorage.getItem('agora_spend_permission');
      if (intent.hasIntent && !permissionData) {
        const promptMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Before I can place bets for you, you need to grant me spending permission. Please use the "Enable AI Agent" section above to set this up.',
          sender: 'agent',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, promptMessage]);
        setIsLoading(false);
        return;
      }

      // If betting intent detected and we have context
      if (intent.hasIntent && agreementId) {
        // Check what information is missing
        if (intent.needsMoreInfo.length > 0) {
          let missingInfo = [];
          if (intent.needsMoreInfo.includes('amount')) {
            missingInfo.push('the amount you want to bet (e.g., 0.01 ETH)');
          }
          if (intent.needsMoreInfo.includes('side')) {
            missingInfo.push('which side you want to bet on (Party A or Party B)');
          }
          
          const clarifyMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `I understand you want to place a bet on "${agreementTitle}". Please specify ${missingInfo.join(' and ')}.`,
            sender: 'agent',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, clarifyMessage]);
          setIsLoading(false);
          return;
        }
        
        // We have all the info, execute the bet
        if (intent.possibleAmount && intent.possibleSide && permissionData) {
          const permission = JSON.parse(permissionData);
          
          // Confirm the bet details
          const confirmMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `🎯 Placing bet:\n• Agreement: ${agreementTitle}\n• Side: ${intent.possibleSide === 'partyA' ? 'Party A' : 'Party B'}\n• Amount: ${intent.possibleAmount} ETH\n\nProcessing...`,
            sender: 'agent',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, confirmMessage]);
          
          // Execute the bet automatically via AI agent with spend permission
          const processingMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: `🤖 Placing bet automatically using your spend permission...\n\n• Amount: ${intent.possibleAmount} ETH\n• Side: ${intent.possibleSide === 'partyA' ? 'Party A' : 'Party B'}\n• Agreement: ${agreementTitle}`,
            sender: 'agent',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, processingMessage]);
          
          // Execute the bet via API (AI agent will handle it)
          const betResponse = await fetch('/api/ai/bet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-address': userAddress || '',
              'x-spend-permission': JSON.stringify(permission.permission || permission),
            },
            body: JSON.stringify({
              agreementId,
              side: intent.possibleSide,
              amountETH: intent.possibleAmount,
            }),
          });
          
          const betResult = await betResponse.json();
          
          if (betResult.success) {
            const successMessage: Message = {
              id: (Date.now() + 3).toString(),
              content: `✅ ${betResult.message}\n\nTransaction Hash: ${betResult.transactionHash}\n\nYour bet has been placed automatically on the blockchain!`,
              sender: 'agent',
              timestamp: new Date(),
              details: betResult.details,
            };
            // Replace processing message with success
            setMessages(prev => prev.filter(m => m.id !== processingMessage.id).concat(successMessage));
          } else {
            throw new Error(betResult.error || 'Failed to place bet');
          }
          
          setIsLoading(false);
          return;
        }
      }

      // Default flow: Use AI for general conversation
      const chatMessages: ChatMessage[] = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));
      chatMessages.push({ role: 'user', content: inputValue });

      // Add context about current agreement if available
      if (agreementId && !inputValue.includes(agreementId)) {
        chatMessages.push({
          role: 'system',
          content: `Context: User is viewing agreement ID: ${agreementId} titled "${agreementTitle}"`
        });
      }

      const response = await generateChatResponse(chatMessages);
      
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: 'agent',
        timestamp: new Date(),
        toolCall: response.toolCall,
        details: response.details,
      };

      setMessages(prev => [...prev, agentMessage]);

      // If AI suggested a bet through function calling
      if (response.toolCall && response.details?.transactionHash) {
        const txMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `✅ Bet placed successfully! Transaction: ${response.details.transactionHash}`,
          sender: 'agent',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, txMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">AI Betting Assistant</h3>
        <p className="text-xs text-gray-500">
          {userAddress ? 'Ask me to place bets in natural language' : 'Connect wallet to start betting'}
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.toolCall && message.details && (
                <div className="mt-2 pt-2 border-t border-opacity-20 border-white">
                  <p className="text-xs opacity-90">
                    {message.details.side && `Side: ${message.details.side}`}
                    {message.details.amount && ` | Amount: ${message.details.amount} ETH`}
                  </p>
                </div>
              )}
              <p className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={userAddress ? "e.g., 'Bet 0.01 ETH on Party A'" : "Connect wallet to chat"}
            disabled={!userAddress || isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
          <button
            onClick={sendMessage}
            disabled={!userAddress || isLoading || !inputValue.trim()}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              !userAddress || isLoading || !inputValue.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}