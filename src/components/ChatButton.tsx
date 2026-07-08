"use client";

import { useEffect, useRef, useState } from "react";
import { CHAT_NAMES } from "@/lib/chat";

const NAME_KEY = "chonky-chat-name";
const LAST_SEEN_KEY = "chonky-chat-last-seen";
const POLL_MS = 3000;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

async function subscribeToPush(name: string) {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subscription: subscription.toJSON() }),
    });
  } catch {
    // push is best-effort; chat still works via polling if this fails
  }
}

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
  const [hasUnread, setHasUnread] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const lastSeenRef = useRef<number>(0);

  useEffect(() => {
    setName(localStorage.getItem(NAME_KEY));
    lastSeenRef.current = Number(localStorage.getItem(LAST_SEEN_KEY) ?? 0);
  }, []);

  useEffect(() => {
    if (!open || !name) return;
    subscribeToPush(name);
  }, [open, name]);

  // Poll for messages whether the chat is open or not, so the button can
  // badge an unread message even while the modal is closed.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/chat");
        const data: { messages?: ChatMessage[] } = await res.json();
        const list = data.messages ?? [];
        if (cancelled) return;

        const latest = list[list.length - 1];

        if (open) {
          setMessages(list);
          setHasUnread(false);
          if (latest) {
            lastSeenRef.current = latest.ts;
            localStorage.setItem(LAST_SEEN_KEY, String(latest.ts));
          }
        } else if (latest && name && latest.name !== name && latest.ts > lastSeenRef.current) {
          setHasUnread(true);
        }
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
  }, [open, name]);

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
        onClick={() => {
          setHasUnread(false);
          setOpen(true);
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-white shadow-[0_2px_0_0_#0f172a] transition active:translate-y-[2px] active:shadow-none"
      >
        <ChatBubbleIcon />
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
        )}
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
                  {CHAT_NAMES.map((n) => (
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
