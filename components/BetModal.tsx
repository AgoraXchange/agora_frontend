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
}: BetModalProps) {
  const [showAmountStep, setShowAmountStep] = useState(false);

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
  };

  const handleBack = () => {
    setShowAmountStep(false);
  };

  const increaseBetAmount = () => {
    const current = parseFloat(betAmount) || 0;
    setBetAmount((current + 0.001).toFixed(3));
  };

  const decreaseBetAmount = () => {
    const current = parseFloat(betAmount) || 0;
    if (current > 0.001) {
      setBetAmount((current - 0.001).toFixed(3));
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
    return amount >= 0.001 && amount <= 0.1;
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
                <span className="text-primary font-bold">{calculateWinAmount()} ETH</span>
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
                    placeholder="0.001"
                    step="0.001"
                    min="0.001"
                  />
                  <div className="text-center text-gray-400 text-sm mt-1">ETH</div>
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
                    Please switch to Base Sepolia network to place bets
                  </p>
                </div>
              )}

              {/* Bet Button */}
              <button
                onClick={onBet}
                disabled={!betAmount || !isValidAmount() || isPending || isConfirming || !isCorrectChain || isSwitching}
                className="w-full bg-primary text-gray-1000 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 disabled:bg-gray-800 disabled:text-gray-100 transition-colors"
              >
                {isSwitching ? "Switching Network..." : isPending || isConfirming ? "Processing..." : needsSwitch ? "Wrong Network" : "Bet"}
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
