"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "I miss you both! 🥺",
  "Feed me pls 🍽️",
  "Best day ever with you two 💕",
  "Zzz... dreaming of snacks",
  "Squeak! (that means I love you)",
  "Can we play soon? 🎮",
  "You two are my favorite humans",
  "Chonky is thinking happy thoughts",
];

const MIN_INTERVAL_MS = 25_000;
const MAX_INTERVAL_MS = 55_000;
const SHOW_CHANCE = 0.5;
const VISIBLE_MS = 4500;

function randomDelay() {
  return MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
}

// Mounted only while Chonky is idle (see CapybaraStage) so an action starting
// unmounts it and clears any pending/visible bubble for free.
export function SpeechBubble() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let showTimeout: ReturnType<typeof setTimeout>;
    let hideTimeout: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      showTimeout = setTimeout(() => {
        if (Math.random() < SHOW_CHANCE) {
          setText(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
          hideTimeout = setTimeout(() => setText(null), VISIBLE_MS);
        }
        scheduleNext();
      }, randomDelay());
    };

    scheduleNext();
    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  if (!text) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-2 z-10 max-w-[85%] -translate-x-1/2">
      <div className="relative rounded-lg border-2 border-slate-900 bg-white px-2 py-1 text-center font-pixel text-[9px] leading-relaxed text-slate-900 shadow-[0_2px_0_0_#0f172a]">
        {text}
        <div className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-slate-900 bg-white" />
      </div>
    </div>
  );
}
