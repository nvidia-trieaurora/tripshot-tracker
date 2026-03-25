"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface ConfettiEffectProps {
  trigger: boolean;
}

export default function ConfettiEffect({ trigger }: ConfettiEffectProps) {
  const prevTrigger = useRef(false);

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#f97316", "#f43f5e", "#a855f7", "#10b981", "#eab308"],
      });
    }
    prevTrigger.current = trigger;
  }, [trigger]);

  return null;
}
