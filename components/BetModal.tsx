"use client";

import { useState } from "react";

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyA: string;
  partyB: string;
  oddsA: string;
  oddsB: string;
  selectedSide: 1 | 2 | null;
  setSelectedSide: (side: 1 | 2 | null) => void;
  onSideSelect?: (side: 1 | 2) => void;
  betAmount: string;
  setBetAmount: (amount: string) => void;
  onBet: () => void;
  isPending: boolean;
  isConfirming: boolean;
  isCorrectChain: boolean;
  isSwitching: boolean;
  needsSwitch: boolean;
  errorTitle?: string;
  errorDetails?: string[];
  onClearError?: () => void;
  insufficientBalance?: boolean;
  minBet?: string;
  maxBet?: string;
  chainId?: number;
}

export function BetModal({
  isOpen,
  onClose,
  partyA,
  partyB,
  oddsA,
  oddsB,
  selectedSide,
  setSelectedSide,
  onSideSelect,
  betAmount,
  setBetAmount,
  onBet,
  isPending,
  isConfirming,
  isCorrectChain,
  isSwitching,
  needsSwitch,
  errorTitle,
  errorDetails,
  onClearError,
  insufficientBalance = false,
  minBet = "0.0002",
  maxBet = "100",
  chainId,
}: BetModalProps) {
  const [showAmountStep, setShowAmountStep] = useState(false);
  
  const getCurrencySymbol = () => {
    if (chainId === 84532) return "ETH";
    if (chainId === 10143) return "MON";
    return "ETH";
  };
  
  const getNetworkName = () => {
    if (chainId === 84532) return "Base Sepolia";
    if (chainId === 10143) return "Monad Testnet";
    return "Base Sepolia";
  };

  if (!isOpen) return null;

  const handleSideSelect = (side: 1 | 2) => {
    setSelectedSide(side);
    if (onSideSelect) onSideSelect(side);
    setShowAmountStep(true);
  };

  const handleClose = () => {
    onClose();
    setShowAmountStep(false);
    setSelectedSide(null);
    onClearError?.();
  };

  const handleBack = () => {
    setShowAmountStep(false);
  };

  const increaseBetAmount = () => {
    const current = parseFloat(betAmount) || 0;
    const max = parseFloat(maxBet);
    const increment = 0.001;
    const newAmount = current + increment;
    if (newAmount <= max) {
      setBetAmount(newAmount.toFixed(4));
    }
  };

  const decreaseBetAmount = () => {
    const current = parseFloat(betAmount) || 0;
    const min = parseFloat(minBet);
    const decrement = 0.001;
    const newAmount = current - decrement;
    if (newAmount >= min) {
      setBetAmount(newAmount.toFixed(4));
    }
  };

  const calculateWinAmount = () => {
    const amount = parseFloat(betAmount) || 0;
    const odds = selectedSide === 1 ? parseFloat(oddsA) : parseFloat(oddsB);
    if (isNaN(amount) || isNaN(odds) || amount === 0) {
      return "0.0000";
    }
    return (amount * odds).toFixed(4);
  };

  const isValidAmount = () => {
    const amount = parseFloat(betAmount) || 0;
    const min = parseFloat(minBet);
    const max = parseFloat(maxBet);
    return amount >= min && amount <= max;
  };

  const hasOppositeBets = () => {
    const oppositeOdds = selectedSide === 1 ? parseFloat(oddsB) : parseFloat(oddsA);
    return oppositeOdds > 1;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-end z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="w-full bg-gray-900 rounded-t-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="w-8"></div>
          <h2 className="text-white text-lg font-bold">Bet</h2>
          <button 
            onClick={handleClose}
            className="text-white p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <p className="text-gray-400 text-sm mb-4">Odds rates fluctuate in real time.</p>

          {!showAmountStep ? (
            /* Step 1: Select Side */
            <div className="space-y-3">
              <button
                onClick={() => handleSideSelect(1)}
                className="w-full bg-green-700 hover:bg-green-600 text-white py-4 rounded-xl font-medium transition-colors"
              >
                <div className="text-lg">{partyA}</div>
                <div className="text-sm mt-1">Odds : {oddsA}x</div>
              </button>
              
              <button
                onClick={() => handleSideSelect(2)}
                className="w-full bg-red-500 hover:bg-red-400 text-white py-4 rounded-xl font-medium transition-colors"
              >
                <div className="text-lg">{partyB}</div>
                <div className="text-sm mt-1">Odds : {oddsB}x</div>
              </button>
            </div>
          ) : (
            /* Step 2: Set Amount */
            <div className="space-y-4">
              {/* Selected Option Display */}
              <div 
                className={`w-full py-4 rounded-xl text-white text-center ${
                  selectedSide === 1 ? 'bg-green-700' : 'bg-red-500'
                }`}
              >
                <div className="text-lg font-medium">
                  {selectedSide === 1 ? partyA : partyB}
                </div>
                <div className="text-sm mt-1">
                  Odds : {selectedSide === 1 ? oddsA : oddsB}x
                </div>
              </div>

              {/* To Win Display */}
              <div className="text-center">
                <span className="text-gray-400">To Win : </span>
                <span className="text-primary font-bold">{calculateWinAmount()} {getCurrencySymbol()}</span>
                {!hasOppositeBets() && (
                  <div className="text-xs text-gray-500 mt-1">
                    Actual winnings may vary based on final odds
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={decreaseBetAmount}
                  className="w-12 h-12 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>

                <div className="flex-1 max-w-xs">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg"
                    placeholder={minBet}
                    step="0.0001"
                    min={minBet}
                    max={maxBet}
                  />
                  <div className="text-center text-gray-400 text-sm mt-1">{getCurrencySymbol()}</div>
                  <div className="text-center text-gray-500 text-xs mt-1">
                    Min: {minBet} {getCurrencySymbol()} | Max: {maxBet} {getCurrencySymbol()}
                  </div>
                </div>

                <button
                  onClick={increaseBetAmount}
                  className="w-12 h-12 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Network Warning */}
              {needsSwitch && (
                <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <p className="text-yellow-400 text-sm text-center">
                    Please switch to {getNetworkName()} network to place bets
                  </p>
                </div>
              )}

              {/* Bet validation warning */}
              {(() => {
                const amount = parseFloat(betAmount) || 0;
                const min = parseFloat(minBet);
                const max = parseFloat(maxBet);
                
                if (amount < min && betAmount !== '') {
                  return (
                    <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                      <p className="text-yellow-300 text-sm text-center">
                        Minimum bet is {minBet} {getCurrencySymbol()}
                      </p>
                    </div>
                  );
                }
                
                if (amount > max) {
                  return (
                    <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                      <p className="text-yellow-300 text-sm text-center">
                        Maximum bet is {maxBet} {getCurrencySymbol()}
                      </p>
                    </div>
                  );
                }
                
                if (insufficientBalance) {
                  return (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-600 rounded-lg">
                      <p className="text-red-300 text-sm text-center">
                        Insufficient {getCurrencySymbol()} balance (need {betAmount} {getCurrencySymbol()} + gas fees)
                      </p>
                    </div>
                  );
                }
                
                return null;
              })()}

              {/* Error State Message */}
              {errorTitle && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-600 rounded-lg">
                  <p className="text-red-300 text-sm font-medium mb-1">{errorTitle}</p>
                  {Array.isArray(errorDetails) && errorDetails.length > 0 && (
                    <ul className="list-disc list-inside text-red-200/90 text-xs space-y-0.5">
                      {errorDetails.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Bet Button */}
              <button
                onClick={onBet}
                disabled={!betAmount || !isValidAmount() || isPending || isConfirming || !isCorrectChain || isSwitching || insufficientBalance}
                className="w-full bg-primary text-gray-1000 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 disabled:bg-gray-800 disabled:text-gray-100 transition-colors"
              >
                {(() => {
                  if (isSwitching) return "Switching Network...";
                  if (isPending || isConfirming) return "Processing...";
                  if (needsSwitch) return "Wrong Network";
                  if (insufficientBalance) return `Insufficient ${getCurrencySymbol()}`;
                  
                  const amount = parseFloat(betAmount) || 0;
                  const min = parseFloat(minBet);
                  const max = parseFloat(maxBet);
                  
                  if (amount < min && betAmount !== '') return `Min ${minBet} ${getCurrencySymbol()}`;
                  if (amount > max) return `Max ${maxBet} ${getCurrencySymbol()}`;
                  if (!isValidAmount()) return "Invalid Amount";
                  
                  return "Bet";
                })()}
              </button>

              {/* Cancel Button */}
              <button
                onClick={handleBack}
                className="w-full text-gray-400 py-2 text-center hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
