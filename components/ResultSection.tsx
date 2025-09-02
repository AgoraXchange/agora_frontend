"use client";

type LegacyWinnerArgs = {
  Jury1?: string;
  Jury2?: string;
  Jury3?: string;
  Conclusion?: string;
};

type DecisionWinnerArgs = {
  reasoning?: string;
  confidence?: number; // 0..1
  evidence?: string[];
  deliberationMode?: string;
  decisionId?: string;
  committeeDecisionId?: string;
};

type WinnerArguments = LegacyWinnerArgs & DecisionWinnerArgs;

interface ResultSectionProps {
  partyA: string;
  partyB: string;
  winner: number;
  winnerArguments?: WinnerArguments | null;
}

export function ResultSection({ partyA, partyB, winner, winnerArguments }: ResultSectionProps) {
  const hasDecision = Boolean(winnerArguments?.reasoning || (winnerArguments?.evidence && winnerArguments.evidence.length > 0));
  const confidencePct = typeof winnerArguments?.confidence === 'number'
    ? Math.round((winnerArguments.confidence as number) * 100)
    : null;
  const winnerLabel = winner === 1 ? partyA : winner === 2 ? partyB : '';

  return (
    <div className="mb-8">
      <h2 className="text-white text-xl font-bold mb-1">Result</h2>
      <p className="text-gray-100 text-sm mb-6">Finalized outcome and supporting rationale</p>

      {/* Winner summary */}
      <div className="mb-4 p-4 rounded-xl border border-gray-800 bg-gray-900">
        <div className="text-sm text-gray-300">Winner</div>
        <div className="text-white text-lg font-bold mt-1">{winnerLabel || '-'}</div>
        {confidencePct !== null && (
          <div className="text-gray-300 text-sm mt-1">Confidence: {confidencePct}%</div>
        )}
        {winnerArguments?.deliberationMode && (
          <div className="text-gray-500 text-xs mt-1">Mode: {winnerArguments.deliberationMode}</div>
        )}
      </div>

      {/* Decision-mode render */}
      {hasDecision ? (
        <div className="space-y-4 mb-6">
          {winnerArguments?.reasoning && (
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-0.5 flex-shrink-0">
                <svg className="w-4 h-4 text-gray-1000" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-base mb-1">Reasoning</h3>
                <p className="text-gray-200 text-sm leading-relaxed">{winnerArguments.reasoning}</p>
              </div>
            </div>
          )}
          {Array.isArray(winnerArguments?.evidence) && winnerArguments!.evidence!.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-0.5 flex-shrink-0">
                <svg className="w-4 h-4 text-gray-1000" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-base mb-2">Evidence</h3>
                <ul className="list-disc list-inside text-gray-200 text-sm space-y-1">
                  {winnerArguments!.evidence!.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Legacy jury layout fallback
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-0.5 flex-shrink-0">
              <svg className="w-4 h-4 text-gray-1000" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-base mb-1">Jury A1</h3>
              <p className="text-gray-200 text-sm leading-relaxed">{winnerArguments?.Jury1 || '-'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-0.5 flex-shrink-0">
              <svg className="w-4 h-4 text-gray-1000" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-base mb-1">Jury A2</h3>
              <p className="text-gray-200 text-sm leading-relaxed">{winnerArguments?.Jury2 || '-'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-0.5 flex-shrink-0">
              <svg className="w-4 h-4 text-gray-1000" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-base mb-1">Jury A3</h3>
              <p className="text-gray-200 text-sm leading-relaxed">{winnerArguments?.Jury3 || '-'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-0.5 flex-shrink-0">
              <svg className="w-4 h-4 text-gray-1000" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-primary font-semibold text-base mb-1">Conclusion</h3>
              <p className="text-gray-200 text-sm leading-relaxed">{winnerArguments?.Conclusion || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
