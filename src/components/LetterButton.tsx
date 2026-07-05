"use client";

import { useEffect, useState } from "react";

const PAPER_BACKGROUND =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%23fff8e7'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23ffe3ea'/%3E%3Crect x='10' y='9' width='2' height='2' fill='%23ffe3ea'/%3E%3C/svg%3E\")";

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 12 12" width="20" height="20" shapeRendering="crispEdges">
      <rect x="1" y="2" width="10" height="8" fill="#fff4d6" />
      <rect x="1" y="2" width="10" height="1" fill="#c98a4b" />
      <rect x="1" y="9" width="10" height="1" fill="#8a5a3b" />
      <rect x="1" y="2" width="1" height="8" fill="#c98a4b" />
      <rect x="10" y="2" width="1" height="8" fill="#8a5a3b" />
      <rect x="2" y="3" width="1" height="1" fill="#c98a4b" />
      <rect x="3" y="4" width="1" height="1" fill="#c98a4b" />
      <rect x="8" y="3" width="1" height="1" fill="#c98a4b" />
      <rect x="7" y="4" width="1" height="1" fill="#c98a4b" />
      <rect x="4" y="6" width="1" height="1" fill="#e0607a" />
      <rect x="6" y="6" width="1" height="1" fill="#e0607a" />
      <rect x="4" y="7" width="3" height="1" fill="#e0607a" />
      <rect x="5" y="8" width="1" height="1" fill="#e0607a" />
    </svg>
  );
}

export function LetterButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || text !== null || failed) return;
    fetch("/api/letter")
      .then((res) => res.json())
      .then((data: { text?: string }) => setText(data.text || ""))
      .catch(() => setFailed(true));
  }, [open, text, failed]);

  return (
    <>
      <button
        type="button"
        aria-label="Read your letter"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-white shadow-[0_2px_0_0_#0f172a] transition active:translate-y-[2px] active:shadow-none"
      >
        <EnvelopeIcon />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[85vh] w-full max-w-sm flex-col gap-3 overflow-hidden rounded-2xl border-[3px] border-slate-900 p-4 shadow-[0_6px_0_0_#0f172a]"
            style={{ backgroundImage: PAPER_BACKGROUND, backgroundSize: "16px 16px", imageRendering: "pixelated" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-pixel text-[11px] uppercase tracking-wide text-slate-900">A Letter For You</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close letter"
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-900 bg-white font-pixel text-[10px] text-slate-900 transition active:translate-y-[1px]"
              >
                X
              </button>
            </div>
            <div className="overflow-y-auto whitespace-pre-wrap rounded-xl border-2 border-slate-900 bg-white/70 p-3 font-pixel text-[11px] leading-loose text-slate-900">
              {failed ? "Couldn't load the letter." : text === null ? "Loading..." : text}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
