"use client";

import { useState } from "react";
import { ActionKey } from "@/lib/chonky";

const ACTION_GIF: Record<ActionKey, string> = {
  eat: "/gifs/eat.gif",
  sleep: "/gifs/sleep.gif",
  bath: "/gifs/bath.gif",
  play: "/gifs/play.gif",
};

export function CapybaraStage({
  actionPlaying,
  sad,
}: {
  actionPlaying: ActionKey | null;
  sad: boolean;
}) {
  const src = actionPlaying ? ACTION_GIF[actionPlaying] : sad ? "/gifs/idle-sad.gif" : "/gifs/idle-happy.gif";
  const [errored, setErrored] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  // Reset the "missing gif" fallback whenever we switch to a different clip.
  if (src !== prevSrc) {
    setPrevSrc(src);
    setErrored(false);
  }

  return (
    <div className="relative flex aspect-square w-full max-w-xs items-center justify-center overflow-hidden rounded-2xl border-[3px] border-slate-900 bg-[#9bbc0f] shadow-[inset_0_0_0_3px_#0f172a]">
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.06)_0px,rgba(0,0,0,0.06)_1px,transparent_1px,transparent_3px)]" />
      {errored ? (
        <div className="relative flex flex-col items-center gap-2 p-4 text-center text-slate-800">
          <span className="text-6xl">🦫</span>
          <span className="font-pixel text-[9px] leading-relaxed">
            Drop <code className="font-mono">{src.replace("/gifs/", "")}</code> in{" "}
            <code className="font-mono">public/gifs/</code>
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={actionPlaying ? `Chonky ${actionPlaying}` : sad ? "Chonky is sad" : "Chonky is happy"}
          className="relative h-full w-full object-contain"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}
