"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endTime: bigint;
  onEnd?: () => void; // optional callback fired once when time is up
}

export function CountdownTimer({ endTime, onEnd }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [fired, setFired] = useState(false);

  useEffect(() => {
    function tick() {
      const now = Math.floor(Date.now() / 1000);
      const end = Number(endTime);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (!fired) {
          setFired(true);
          try { onEnd?.(); } catch {}
        }
      } else {
        setTimeLeft({
          days: Math.floor(diff / 86400),
          hours: Math.floor((diff % 86400) / 3600),
          minutes: Math.floor((diff % 3600) / 60),
          seconds: diff % 60,
        });
      }
    }

    // run immediately and then every second
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endTime, onEnd, fired]);

  return (
    <div className="flex justify-center gap-4 sm:gap-6 mb-8">
      <div className="text-center">
        <div className="text-2xl sm:text-3xl font-bold text-white">{String(timeLeft.days).padStart(2, '0')}</div>
        <div className="text-xs sm:text-sm text-gray-100">days</div>
      </div>
      <div className="text-center">
        <div className="text-2xl sm:text-3xl font-bold text-white">{String(timeLeft.hours).padStart(2, '0')}</div>
        <div className="text-xs sm:text-sm text-gray-100">hrs</div>
      </div>
      <div className="text-center">
        <div className="text-2xl sm:text-3xl font-bold text-white">{String(timeLeft.minutes).padStart(2, '0')}</div>
        <div className="text-xs sm:text-sm text-gray-100">min</div>
      </div>
      <div className="text-center">
        <div className="text-2xl sm:text-3xl font-bold text-white">{String(timeLeft.seconds).padStart(2, '0')}</div>
        <div className="text-xs sm:text-sm text-gray-100">sec</div>
      </div>
    </div>
  );
}
