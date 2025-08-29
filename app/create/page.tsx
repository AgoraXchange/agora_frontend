"use client";

import { CreateAgreement } from "../components/CreateAgreement";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreatePage() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const router = useRouter();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  return (
    <div className="min-h-screen bg-gray-1000">
      {/* Custom Header for Create Page */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-1000 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Back Button */}
              <button
                onClick={() => router.back()}
                className="text-white p-2 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7" 
                  />
                </svg>
              </button>

              {/* Center Logo */}
              <Link href="/" className="flex items-center gap-1.5">
                <img 
                  src="/assets/icons/logo.svg" 
                  alt="Agora Logo" 
                  className="w-[18px] h-[18px] sm:w-6 sm:h-6"
                />
                <span className="text-white text-xl sm:text-2xl font-bold">agora</span>
              </Link>

              {/* Right Placeholder for symmetry */}
              <div className="w-10 h-10"></div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="pt-14 sm:pt-16">
        <CreateAgreement />
      </div>
    </div>
  );
}