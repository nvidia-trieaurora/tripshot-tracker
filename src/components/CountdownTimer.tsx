"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetDate: string;
  label: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

const UNITS: { key: keyof TimeLeft; label: string }[] = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Min" },
  { key: "seconds", label: "Sec" },
];

export default function CountdownTimer({
  targetDate,
  label,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calcTimeLeft(new Date(targetDate))
  );

  useEffect(() => {
    const target = new Date(targetDate);
    const tick = () => setTimeLeft(calcTimeLeft(target));
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 p-5 text-white">
      <p className="text-sm font-medium text-white/80 mb-3">{label}</p>

      {timeLeft == null ? (
        <p className="text-2xl font-bold">🎉 Time&apos;s up!</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {UNITS.map(({ key, label: unitLabel }) => (
            <div
              key={key}
              className="flex flex-col items-center bg-white/15 backdrop-blur-sm rounded-xl py-3"
            >
              <span className="text-2xl sm:text-3xl font-bold tabular-nums leading-none">
                {String(timeLeft[key]).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-wider text-white/70">
                {unitLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
