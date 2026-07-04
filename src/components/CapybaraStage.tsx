"use client";

import { useState } from "react";
import { ActionKey } from "@/lib/chonki";

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
    <div className="flex aspect-square w-full max-w-xs items-center justify-center overflow-hidden rounded-3xl bg-amber-100 dark:bg-stone-800">
      {errored ? (
        <div className="flex flex-col items-center gap-2 p-4 text-center text-stone-500 dark:text-stone-400">
          <span className="text-6xl">🦫</span>
          <span className="text-xs">
            Drop <code className="font-mono">{src.replace("/gifs/", "")}</code> in{" "}
            <code className="font-mono">public/gifs/</code>
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={actionPlaying ? `Chonki ${actionPlaying}` : sad ? "Chonki is sad" : "Chonki is happy"}
          className="h-full w-full object-contain"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}
