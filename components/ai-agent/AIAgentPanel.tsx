'use client';

import { useState, useEffect } from 'react';
import { SimpleSpendPermissionFallback } from './SimpleSpendPermissionFallback';
import { ChatInterface } from './ChatInterface';
import { useAccount } from 'wagmi';

interface AIAgentPanelProps {
  agreementId?: string;
  agreementTitle?: string;
}

export function AIAgentPanel({ agreementId, agreementTitle }: AIAgentPanelProps) {
  const { address: userAddress } = useAccount();
  const [isExpanded, setIsExpanded] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Check if permission is already granted
  useEffect(() => {
    const stored = localStorage.getItem('agora_spend_permission');
    console.log('🔍 Checking stored permission:', stored);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        console.log('📊 Permission data:', data);
        // Check if permission is still valid (within 24 hours)
        const isValid = data.timestamp && Date.now() - data.timestamp < 86400000;
        console.log('✅ Permission valid:', isValid);
        if (isValid) {
          setPermissionGranted(true);
        } else {
          console.log('⏰ Permission expired, removing...');
          localStorage.removeItem('agora_spend_permission');
        }
      } catch (e) {
        console.error('❌ Failed to parse stored permission:', e);
        localStorage.removeItem('agora_spend_permission');
      }
    } else {
      console.log('🚫 No stored permission found');
    }
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50 max-w-[calc(100vw-2rem)]">
      {/* Collapsed view - floating button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-600 text-white rounded-full p-3 sm:p-4 shadow-lg hover:bg-blue-700 transition-all hover:scale-105 flex items-center gap-2"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z"
            />
          </svg>
          <span className="font-medium text-sm sm:text-base hidden xs:inline">AI Betting Assistant</span>
          <span className="font-medium text-sm xs:hidden">AI Bot</span>
        </button>
      )}

      {/* Expanded view - full panel */}
      {isExpanded && (
        <>
          {/* Mobile overlay */}
          <div className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsExpanded(false)} />
          
          {/* Panel */}
          <div className="bg-white rounded-lg sm:shadow-2xl w-full sm:w-[400px] max-w-[400px] max-h-[90vh] sm:max-h-[calc(100vh-6rem)] flex flex-col sm:relative fixed bottom-0 sm:bottom-auto sm:top-24 left-0 right-0 sm:left-auto sm:right-0 z-50 sm:z-auto rounded-b-none sm:rounded-b-lg">
            {/* Panel header */}
            <div className="px-3 sm:px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-blue-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <h2 className="font-semibold text-sm sm:text-base">
                  <span className="hidden sm:inline">AI Betting Assistant</span>
                  <span className="sm:hidden">AI Bot</span>
                </h2>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white hover:bg-blue-700 rounded p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto">
              {!userAddress ? (
                <div className="p-4 sm:p-6 text-center">
                  <svg
                    className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Connect Your Wallet</h3>
                  <p className="text-sm text-gray-600">
                    Connect your wallet to start using the AI betting assistant
                  </p>
                </div>
              ) : (
                <>
                  {!permissionGranted && (
                    <div className="p-3 sm:p-4 border-b border-gray-200">
                      <SimpleSpendPermissionFallback onPermissionGranted={() => setPermissionGranted(true)} />
                    </div>
                  )}
                  
                  {permissionGranted && (
                    <div className="p-2 border-b border-gray-200 bg-green-50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-green-700">✅ AI Agent Enabled</span>
                        <button
                          onClick={() => {
                            localStorage.removeItem('agora_spend_permission');
                            setPermissionGranted(false);
                            console.log('🔄 Permission reset');
                          }}
                          className="text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Reset Permission
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <ChatInterface 
                    agreementId={agreementId} 
                    agreementTitle={agreementTitle}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}