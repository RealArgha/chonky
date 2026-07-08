"use client";

import { useEffect, useRef, useState } from "react";

const NAME_KEY = "chonky-chat-name";
const NAMES = ["Dad", "Mom"] as const;
const POLL_MS = 3000;

type ChatMessage = {
  name: string;
  text: string;
  ts: number;
};

function ChatBubbleIcon() {
  return (
    <svg viewBox="0 0 12 12" width="20" height="20" shapeRendering="crispEdges">
      <rect x="1" y="1" width="10" height="7" fill="#fff4d6" />
      <rect x="1" y="1" width="10" height="1" fill="#c98a4b" />
      <rect x="1" y="7" width="10" height="1" fill="#8a5a3b" />
      <rect x="1" y="1" width="1" height="7" fill="#c98a4b" />
      <rect x="10" y="1" width="1" height="7" fill="#8a5a3b" />
      <rect x="3" y="8" width="1" height="1" fill="#8a5a3b" />
      <rect x="2" y="9" width="1" height="1" fill="#8a5a3b" />
      <rect x="3" y="3" width="1" height="1" fill="#7bb3e0" />
      <rect x="5" y="3" width="1" height="1" fill="#7bb3e0" />
      <rect x="7" y="3" width="1" height="1" fill="#7bb3e0" />
      <rect x="3" y="5" width="5" height="1" fill="#e0a37b" />
    </svg>
  );
}

export function ChatButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setName(localStorage.getItem(NAME_KEY));
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/chat");
        const data: { messages?: ChatMessage[] } = await res.json();
        if (!cancelled) setMessages(data.messages ?? []);
      } catch {
        // ignore transient poll failures
      }
    };

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const pickName = (n: string) => {
    localStorage.setItem(NAME_KEY, n);
    setName(n);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !name || sending) return;
    setSending(true);
    setDraft("");
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, text }),
      });
      const res = await fetch("/api/chat");
      const data: { messages?: ChatMessage[] } = await res.json();
      setMessages(data.messages ?? []);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open chat"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-white shadow-[0_2px_0_0_#0f172a] transition active:translate-y-[2px] active:shadow-none"
      >
        <ChatBubbleIcon />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[85vh] w-full max-w-sm flex-col gap-3 rounded-2xl border-[3px] border-slate-900 bg-slate-50 p-4 shadow-[0_6px_0_0_#0f172a]"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-pixel text-[11px] uppercase tracking-wide text-slate-900">Chat</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-900 bg-white font-pixel text-[10px] text-slate-900 transition active:translate-y-[1px]"
              >
                X
              </button>
            </div>

            {!name ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                <p className="font-pixel text-[10px] text-slate-900">Who&apos;s chatting?</p>
                <div className="flex gap-3">
                  {NAMES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => pickName(n)}
                      className="rounded-xl border-2 border-slate-900 bg-white px-4 py-2 font-pixel text-[10px] text-slate-900 shadow-[0_3px_0_0_#0f172a] transition active:translate-y-[2px] active:shadow-none"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div
                  ref={listRef}
                  className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-xl border-2 border-slate-900 bg-white/70 p-3"
                >
                  {messages.length === 0 && (
                    <p className="font-pixel text-[9px] text-slate-500">No messages yet. Say hi!</p>
                  )}
                  {messages.map((m, i) => {
                    const mine = m.name === name;
                    return (
                      <div key={i} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                        <span
                          className={`max-w-[80%] rounded-lg border-2 border-slate-900 px-2 py-1 font-pixel text-[10px] leading-relaxed text-slate-900 ${
                            mine ? "bg-amber-200" : "bg-white"
                          }`}
                        >
                          {m.text}
                        </span>
                        <span className="mt-0.5 font-pixel text-[7px] text-slate-500">{m.name}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") send();
                    }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border-2 border-slate-900 bg-white px-2 py-1 font-pixel text-[10px] text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={sending || !draft.trim()}
                    className="rounded-lg border-2 border-slate-900 bg-amber-200 px-3 py-1 font-pixel text-[10px] text-slate-900 shadow-[0_2px_0_0_#0f172a] transition active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
