"use client";

import { useEffect, useState } from "react";
import { ACTION_VERB, ActionKey } from "@/lib/chonky";

type LogEntry = {
  name: string;
  action: ActionKey;
  ts: number;
};

function ScrollIcon() {
  return (
    <svg viewBox="0 0 12 12" width="20" height="20" shapeRendering="crispEdges">
      <rect x="2" y="1" width="8" height="10" fill="#fff4d6" />
      <rect x="1" y="1" width="1" height="2" fill="#c98a4b" />
      <rect x="10" y="1" width="1" height="2" fill="#c98a4b" />
      <rect x="1" y="9" width="1" height="2" fill="#8a5a3b" />
      <rect x="10" y="9" width="1" height="2" fill="#8a5a3b" />
      <rect x="3" y="3" width="6" height="1" fill="#c98a4b" />
      <rect x="3" y="5" width="6" height="1" fill="#c98a4b" />
      <rect x="3" y="7" width="4" height="1" fill="#c98a4b" />
    </svg>
  );
}

function timeAgo(ts: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function LogButton() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/pet/log")
      .then((res) => res.json())
      .then((data: { entries?: LogEntry[] }) => {
        setEntries([...(data.entries ?? [])].reverse());
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="View activity log"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-white shadow-[0_2px_0_0_#0f172a] transition active:translate-y-[2px] active:shadow-none"
      >
        <ScrollIcon />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[70vh] w-full max-w-sm flex-col gap-3 rounded-2xl border-[3px] border-slate-900 bg-slate-50 p-4 shadow-[0_6px_0_0_#0f172a]"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-pixel text-[11px] uppercase tracking-wide text-slate-900">Activity Log</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close activity log"
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-900 bg-white font-pixel text-[10px] text-slate-900 transition active:translate-y-[1px]"
              >
                X
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-xl border-2 border-slate-900 bg-white/70 p-3">
              {failed && <p className="font-pixel text-[9px] text-slate-500">Couldn&apos;t load the log.</p>}
              {!failed && entries === null && <p className="font-pixel text-[9px] text-slate-500">Loading...</p>}
              {!failed && entries?.length === 0 && (
                <p className="font-pixel text-[9px] text-slate-500">No activity yet.</p>
              )}
              {entries?.map((entry, i) => (
                <div key={i} className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <span className="font-pixel text-[10px] leading-relaxed text-slate-900">
                    {entry.name} {ACTION_VERB[entry.action]}
                  </span>
                  <span className="shrink-0 font-pixel text-[8px] text-slate-500">{timeAgo(entry.ts)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
