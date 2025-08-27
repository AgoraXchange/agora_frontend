"use client";

interface ResultSectionProps {
  partyA: string;
  partyB: string;
  winner: number;
}

export function ResultSection({ partyA, partyB, winner }: ResultSectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-white text-xl font-bold mb-1">Result</h2>
      <p className="text-gray-100 text-sm mb-6">For more information, please refer to github</p>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <img src="/assets/icons/check.svg" alt="Check" className="w-5 h-5" />
          </div>
          <div>
            <div className="text-gray-100 text-sm font-medium">Jury AI 1</div>
            <div className="text-gray-100 text-sm">{partyA} perspective based on evidence</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <img src="/assets/icons/check.svg" alt="Check" className="w-5 h-5" />
          </div>
          <div>
            <div className="text-gray-100 text-sm font-medium">Jury AI 2</div>
            <div className="text-gray-100 text-sm">{partyA} perspective based on evidence</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <img src="/assets/icons/check.svg" alt="Check" className="w-5 h-5" />
          </div>
          <div>
            <div className="text-gray-100 text-sm font-medium">Jury AI 3</div>
            <div className="text-gray-100 text-sm">{partyA} perspective based on evidence</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 flex items-center justify-center">
            <img src="/assets/icons/check_circle.svg" alt="Check Circle" className="w-5 h-5" />
          </div>
          <div>
            <div className="text-primary text-sm font-bold">Conclusion</div>
            <div className="text-primary text-sm">
              {winner === 1 ? partyA : winner === 2 ? partyB : "No winner declared"} - Final decision based on evidence
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}