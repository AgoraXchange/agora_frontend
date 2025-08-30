"use client";

interface WinnerArguments {
  Jury1: string;
  Jury2: string;
  Jury3: string;
  Conclusion: string;
}

interface ResultSectionProps {
  partyA: string;
  partyB: string;
  winner: number;
  winnerArguments?: WinnerArguments | null;
}

export function ResultSection({ partyA, partyB, winner, winnerArguments }: ResultSectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-white text-xl font-bold mb-1">Result</h2>
      <p className="text-gray-100 text-sm mb-6">For more information, please refer to github</p>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-0.5 flex-shrink-0">
            <svg className="w-4 h-4 text-gray-1000" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-base mb-1">Jury A1</h3>
            <p className="text-gray-200 text-sm leading-relaxed">{winnerArguments?.Jury1 || "-"}</p>
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
            <p className="text-gray-200 text-sm leading-relaxed">{winnerArguments?.Jury2 || "-"}</p>
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
            <p className="text-gray-200 text-sm leading-relaxed">{winnerArguments?.Jury3 || "-"}</p>
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
            <p className="text-gray-200 text-sm leading-relaxed">{winnerArguments?.Conclusion || "-"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}